import { useRef, useState, useEffect, useCallback } from 'react'

/**
 * AnnotationCanvas – Smooth drawing overlay.
 * - Pointer capture → no missed strokes even when moving fast
 * - requestAnimationFrame render loop → zero lag
 * - touch-action: pan-y → finger scrolls, pen/mouse draws
 * - Tools: pencil (pressure-sensitive), highlighter, eraser
 * - Color picker for pencil & highlighter
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
    const pendingRaf = useRef(null)
    const pendingSegment = useRef(null) // { prev, point, toolSnap, colorSnap, sizeIdxSnap }

    const strokesKey = `hoso-annotations-${fileName || 'untitled'}`

    // ── Canvas sizing ──────────────────────────────────────────────────────
    const resizeCanvas = useCallback(() => {
        const canvas = canvasRef.current
        const container = containerRef?.current
        if (!canvas || !container) return

        const rect = container.getBoundingClientRect()
        const dpr = window.devicePixelRatio || 1

        // Save current drawing before resize
        const imageData = canvas.width > 0 ? canvas.toDataURL() : null

        canvas.width = Math.round(rect.width * dpr)
        canvas.height = Math.round(rect.height * dpr)
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

    // Load saved image
    useEffect(() => {
        if (!isActive || !fileName) return
        const saved = localStorage.getItem(strokesKey)
        if (saved && canvasRef.current) {
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
        try { localStorage.setItem(strokesKey, canvas.toDataURL()) } catch { /* full */ }
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

    // ── RAF render ────────────────────────────────────────────────────────
    const flushSegment = useCallback(() => {
        pendingRaf.current = null
        const seg = pendingSegment.current
        if (!seg) return
        pendingSegment.current = null

        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        const { prev, point, toolConfig, colorVal, width } = seg

        ctx.save()
        ctx.globalCompositeOperation = toolConfig.composite
        ctx.globalAlpha = toolConfig.opacity
        ctx.strokeStyle = toolConfig.composite === 'destination-out' ? 'rgba(0,0,0,1)' : colorVal
        ctx.lineWidth = width
        ctx.lineCap = toolConfig.lineCap
        ctx.lineJoin = 'round'

        ctx.beginPath()
        ctx.moveTo(prev.x, prev.y)
        // Smooth curve through midpoint
        const mx = (prev.x + point.x) / 2
        const my = (prev.y + point.y) / 2
        ctx.quadraticCurveTo(prev.x, prev.y, mx, my)
        ctx.stroke()
        ctx.restore()
    }, [])

    // ── Pointer events ────────────────────────────────────────────────────
    const startDraw = useCallback((e) => {
        // Finger touch → let browser scroll
        if (e.pointerType === 'touch') return

        e.preventDefault()
        e.currentTarget.setPointerCapture(e.pointerId)

        isDrawing.current = true
        lastPoint.current = getPoint(e)
    }, [getPoint])

    const draw = useCallback((e) => {
        if (!isDrawing.current || e.pointerType === 'touch') return
        e.preventDefault()

        const point = getPoint(e)
        const prev = lastPoint.current
        if (!point || !prev) return

        const toolConfig = TOOLS[tool]
        const pressure = toolConfig.pressureSensitive ? point.pressure : 0.5
        const width = TOOLS[tool].baseWidth * SIZE_MULTIPLIERS[sizeIdx] * (pressure * 1.2 + 0.4)

        // Queue RAF render
        pendingSegment.current = { prev, point, toolConfig, colorVal: color, width }
        lastPoint.current = point

        if (!pendingRaf.current) {
            pendingRaf.current = requestAnimationFrame(flushSegment)
        }
    }, [tool, sizeIdx, color, getPoint, flushSegment])

    const endDraw = useCallback((e) => {
        if (!isDrawing.current) return
        isDrawing.current = false
        lastPoint.current = null

        // Flush any pending segment
        if (pendingRaf.current) {
            cancelAnimationFrame(pendingRaf.current)
            pendingRaf.current = null
            flushSegment()
        }
        pendingSegment.current = null

        saveAnnotations()
    }, [saveAnnotations, flushSegment])

    // ── Clear all ──────────────────────────────────────────────────────────
    const clearAll = useCallback(() => {
        if (!confirm('Xóa toàn bộ ghi chú tay?')) return
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        localStorage.removeItem(strokesKey)
    }, [strokesKey])

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

                {/* Clear */}
                <button onClick={clearAll} title="Xóa tất cả">🗑️</button>
            </div>

            {/* Canvas – touch-action pan-y lets finger scroll, pen/mouse draws */}
            <canvas
                ref={canvasRef}
                className={`annotation-canvas ${tool === 'eraser' ? 'eraser' : ''}`}
                style={{ touchAction: 'pan-y' }}
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
