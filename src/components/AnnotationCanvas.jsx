import { useRef, useState, useEffect, useCallback } from 'react'
import { idbGet, idbSet, idbDel } from '../store/idb'

/**
 * AnnotationCanvas – Smooth drawing overlay.
 * - Pointer capture → no missed strokes even when moving fast
 * - Touch ignored for drawing → finger natively scrolls, pen/mouse draws
 * - requestAnimationFrame render loop removed → zero latency point-to-point drawing
 * - Tools: pencil (pressure-sensitive), ballpoint, fountain, highlighter, eraser
 * - Color picker for pencil, ballpoint, fountain & highlighter
 * - Save as image (PNG export)
 */

const PRESET_COLORS = [
    '#000000', // đen
    '#ef4444', // đỏ
    '#f97316', // cam
    '#eab308', // vàng
    '#22c55e', // xanh lá
    '#3b82f6', // xanh dương
    '#8b5cf6', // tím
    '#ec4899', // hồng
]

const TOOLS = {
    pencil: {
        label: 'Bút chì',
        icon: '✏️',
        baseWidth: 2,
        opacity: 1,
        composite: 'source-over',
        pressureSensitive: true,
        lineCap: 'round',
    },
    ballpoint: {
        label: 'Bút bi',
        icon: '🖊️',
        baseWidth: 1.5,
        opacity: 1,
        composite: 'source-over',
        pressureSensitive: false,
        lineCap: 'round',
    },
    fountain: {
        label: 'Bút mực',
        icon: '🖋️',
        baseWidth: 2.5,
        opacity: 0.9,
        composite: 'source-over',
        pressureSensitive: true,
        speedSensitive: true,
        lineCap: 'round',
    },
    highlighter: {
        label: 'Highlight',
        icon: '🖍️',
        baseWidth: 18,
        opacity: 0.35,
        composite: 'multiply',
        pressureSensitive: false,
        lineCap: 'square',
    },
    eraser: {
        label: 'Tẩy',
        icon: '🧹',
        baseWidth: 24,
        opacity: 1,
        composite: 'destination-out',
        pressureSensitive: false,
        lineCap: 'round',
    },
}

const SIZE_MULTIPLIERS = [0.6, 1, 2]
const SIZE_LABELS = ['S', 'M', 'L']

export default function AnnotationCanvas({ fileName, containerRef, isActive }) {
    const canvasRef = useRef(null)
    const [tool, setTool] = useState('pencil')
    const [sizeIdx, setSizeIdx] = useState(1)
    const [color, setColor] = useState('#000000')
    const [showColorPicker, setShowColorPicker] = useState(false)

    // Drawing state – all in refs for performance (no re-render during draw)
    const isDrawing = useRef(false)
    const lastPoint = useRef(null)
    const lastTime = useRef(0)

    const strokesKey = `hoso-annotations-${fileName || 'untitled'}`

    // ── Canvas sizing ──────────────────────────────────────────────────────
    const resizeCanvas = useCallback(() => {
        const canvas = canvasRef.current
        const container = containerRef?.current
        if (!canvas || !container) return

        const rect = container.getBoundingClientRect()
        const dpr = window.devicePixelRatio || 1

        // Save current drawing before resize ONLY if user has drawn something
        // This prevents the massive freeze when loading a new file with a huge canvas
        const imageData = (canvas.width > 0 && hasUserDrawn.current) ? canvas.toDataURL() : null

        const h = Math.min(rect.height, 16000) // Cap height to prevent browser painting aborts on huge files
        canvas.width = Math.round(rect.width * dpr)
        canvas.height = Math.round(h * dpr)
        canvas.style.width = rect.width + 'px'
        canvas.style.height = rect.height + 'px'

        const ctx = canvas.getContext('2d')
        ctx.scale(dpr, dpr)

        if (imageData) {
            const img = new Image()
            img.onload = () => {
                const c = canvasRef.current
                if (!c) return
                const cx = c.getContext('2d')
                cx.drawImage(img, 0, 0, rect.width, rect.height)
            }
            img.src = imageData
        }
    }, [containerRef])

    // Load saved image from IDB
    useEffect(() => {
        if (!isActive || !fileName) return
        idbGet(strokesKey).then(saved => {
            if (saved && canvasRef.current) {
                hasUserDrawn.current = true
                const img = new Image()
                img.onload = () => {
                    const canvas = canvasRef.current
                    if (!canvas) return
                    const ctx = canvas.getContext('2d')
                    const dpr = window.devicePixelRatio || 1
                    ctx.drawImage(img, 0, 0, canvas.width / dpr, canvas.height / dpr)
                }
                img.src = saved
            }
        })
    }, [isActive, fileName, strokesKey])

    // Resize observer
    useEffect(() => {
        if (!isActive) return
        resizeCanvas()
        const ro = new ResizeObserver(() => resizeCanvas())
        if (containerRef?.current) ro.observe(containerRef.current)
        return () => ro.disconnect()
    }, [isActive, resizeCanvas, containerRef])

    // ── Save ──────────────────────────────────────────────────────────────
    const saveAnnotations = useCallback(() => {
        const canvas = canvasRef.current
        if (!canvas || !fileName) return
        idbSet(strokesKey, canvas.toDataURL()).catch(() => { })
    }, [fileName, strokesKey])

    // ── Point helper ──────────────────────────────────────────────────────
    const getPoint = useCallback((e) => {
        const canvas = canvasRef.current
        if (!canvas) return null
        const rect = canvas.getBoundingClientRect()
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
            pressure: (e.pressure > 0 ? e.pressure : 0.5),
        }
    }, [])

    // ── Pointer events ────────────────────────────────────────────────────
    const hasUserDrawn = useRef(false)
    const saveTimeout = useRef(null)

    const startDraw = useCallback((e) => {
        // Feature: only allow pen/mouse to draw. Pass-through touch for scrolling.
        if (e.pointerType === 'touch') {
            return
        }

        e.preventDefault()
        e.stopPropagation()
        e.currentTarget.setPointerCapture(e.pointerId)

        hasUserDrawn.current = true
        isDrawing.current = true
        lastPoint.current = getPoint(e)
        lastTime.current = performance.now()
    }, [getPoint])

    const draw = useCallback((e) => {
        if (!isDrawing.current) return
        e.preventDefault()

        const point = getPoint(e)
        const prev = lastPoint.current
        if (!point || !prev) return

        const toolConfig = TOOLS[tool]
        const now = performance.now()
        const dt = now - (lastTime.current || now)

        let width
        if (toolConfig.speedSensitive) {
            // Fountain pen: width varies with speed (slower = thicker)
            const dx = point.x - prev.x
            const dy = point.y - prev.y
            const dist = Math.sqrt(dx * dx + dy * dy)
            const speed = dt > 0 ? dist / dt : 0
            const speedFactor = Math.max(0.4, Math.min(1.8, 1.5 - speed * 0.8))
            const pressure = toolConfig.pressureSensitive ? point.pressure : 0.5
            width = toolConfig.baseWidth * SIZE_MULTIPLIERS[sizeIdx] * speedFactor * (pressure * 1.2 + 0.4)
        } else {
            const pressure = toolConfig.pressureSensitive ? point.pressure : 0.5
            width = toolConfig.baseWidth * SIZE_MULTIPLIERS[sizeIdx] * (pressure * 1.2 + 0.4)
        }

        // Draw synchronously to avoid dropping events on high-Hz displays
        const canvas = canvasRef.current
        if (canvas) {
            const ctx = canvas.getContext('2d')
            ctx.save()
            ctx.globalCompositeOperation = toolConfig.composite
            ctx.globalAlpha = toolConfig.opacity
            ctx.strokeStyle = toolConfig.composite === 'destination-out' ? 'rgba(0,0,0,1)' : color
            ctx.lineWidth = width
            ctx.lineCap = toolConfig.lineCap
            ctx.lineJoin = 'round'

            ctx.beginPath()
            ctx.moveTo(prev.x, prev.y)
            ctx.lineTo(point.x, point.y)
            ctx.stroke()
            ctx.restore()
        }

        lastPoint.current = point
        lastTime.current = now
    }, [tool, sizeIdx, color, getPoint])

    const endDraw = useCallback((e) => {
        if (!isDrawing.current) return
        isDrawing.current = false
        lastPoint.current = null

        // Debounce the save to prevent UI freeze on every stroke for large canvases
        if (saveTimeout.current) clearTimeout(saveTimeout.current)
        saveTimeout.current = setTimeout(saveAnnotations, 1000)
    }, [saveAnnotations])

    // ── Clear all ──────────────────────────────────────────────────────────
    const clearAll = useCallback(() => {
        if (!confirm('Xóa toàn bộ ghi chú tay?')) return
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        idbDel(strokesKey)
    }, [strokesKey])

    // ── Save as image ──────────────────────────────────────────────────────
    const saveAsImage = useCallback(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        // Check if canvas has content
        const ctx = canvas.getContext('2d')
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const hasContent = imageData.data.some((val, idx) => idx % 4 === 3 && val > 0)
        if (!hasContent) {
            alert('Chưa có nét vẽ nào để lưu!')
            return
        }

        const baseName = (fileName || 'annotation').replace(/\.[^.]+$/, '')
        const dataUrl = canvas.toDataURL('image/png')
        const link = window.document.createElement('a')
        link.href = dataUrl
        link.download = `${baseName}_annotation_${Date.now()}.png`
        link.click()
    }, [fileName])

    if (!isActive) return null

    const currentTool = TOOLS[tool]

    return (
        <>
            {/* Toolbar */}
            <div className="annotation-toolbar no-print">

                {/* Tool buttons */}
                {Object.entries(TOOLS).map(([key, cfg]) => (
                    <button
                        key={key}
                        className={tool === key ? 'active' : ''}
                        onClick={() => setTool(key)}
                        title={cfg.label}
                    >
                        {cfg.icon}
                    </button>
                ))}

                <span className="ann-divider" />

                {/* Size */}
                {SIZE_MULTIPLIERS.map((_, idx) => (
                    <button
                        key={idx}
                        className={sizeIdx === idx ? 'active' : ''}
                        onClick={() => setSizeIdx(idx)}
                        title={SIZE_LABELS[idx]}
                        style={{ minWidth: 30 }}
                    >
                        <span style={{
                            display: 'inline-block',
                            width: 6 + idx * 4,
                            height: 6 + idx * 4,
                            borderRadius: '50%',
                            background: sizeIdx === idx
                                ? 'var(--color-paper)'
                                : (tool === 'eraser' ? 'var(--color-gray-500)' : color),
                            border: sizeIdx !== idx ? '1px solid var(--color-gray-300)' : 'none',
                        }} />
                    </button>
                ))}

                <span className="ann-divider" />

                {/* Color picker – hidden for eraser */}
                {tool !== 'eraser' && (
                    <div style={{ position: 'relative' }}>
                        <button
                            onClick={() => setShowColorPicker(v => !v)}
                            title="Chọn màu"
                            style={{ padding: '4px 6px' }}
                        >
                            <span style={{
                                display: 'inline-block',
                                width: 18,
                                height: 18,
                                borderRadius: 3,
                                background: color,
                                border: '2px solid var(--color-gray-300)',
                            }} />
                        </button>

                        {showColorPicker && (
                            <div
                                className="ann-color-picker"
                                onPointerDown={e => e.stopPropagation()}
                            >
                                {PRESET_COLORS.map(c => (
                                    <button
                                        key={c}
                                        onClick={() => { setColor(c); setShowColorPicker(false) }}
                                        className={color === c ? 'active' : ''}
                                        style={{
                                            width: 28,
                                            height: 28,
                                            background: c,
                                            border: color === c
                                                ? '3px solid var(--color-gray-900)'
                                                : '2px solid var(--color-gray-300)',
                                            borderRadius: 4,
                                            padding: 0,
                                        }}
                                        title={c}
                                    />
                                ))}
                                {/* Native color picker for custom color */}
                                <label title="Màu tùy chỉnh" style={{
                                    width: 28, height: 28, display: 'flex',
                                    alignItems: 'center', justifyContent: 'center',
                                    border: '2px dashed var(--color-gray-300)',
                                    borderRadius: 4, cursor: 'pointer', fontSize: 14,
                                }}>
                                    🎨
                                    <input
                                        type="color"
                                        value={color}
                                        onChange={e => setColor(e.target.value)}
                                        style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }}
                                    />
                                </label>
                            </div>
                        )}
                    </div>
                )}

                <span className="ann-divider" />

                {/* Save as image */}
                <button onClick={saveAsImage} title="Lưu bản sao ảnh">
                    💾
                </button>

                {/* Clear */}
                <button onClick={clearAll} title="Xóa tất cả">🗑️</button>
            </div>

            {/* Canvas – allow scrolling by leaving touch-action as auto or missing */}
            <canvas
                ref={canvasRef}
                className={`annotation-canvas active ${tool === 'eraser' ? 'eraser' : ''}`}
                style={{ touchAction: 'auto' }}
                onPointerDown={startDraw}
                onPointerMove={draw}
                onPointerUp={endDraw}
                onPointerCancel={endDraw}
            />

            {/* Click-outside to close color picker */}
            {showColorPicker && (
                <div
                    style={{ position: 'fixed', inset: 0, zIndex: 0 }}
                    onClick={() => setShowColorPicker(false)}
                />
            )}
        </>
    )
}
