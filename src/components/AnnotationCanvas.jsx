import { useRef, useState, useEffect, useCallback } from 'react'

/**
 * AnnotationCanvas – Transparent overlay for handwritten notes on Paper.
 * Supports pen, highlighter, eraser with pressure sensitivity.
 * Persists strokes to localStorage keyed by fileName.
 */

const TOOLS = {
    pen: { color: '#000000', width: 2, opacity: 1, composite: 'source-over' },
    highlighter: { color: '#fde047', width: 16, opacity: 0.35, composite: 'source-over' },
    eraser: { color: '#ffffff', width: 20, opacity: 1, composite: 'destination-out' },
}

const SIZES = [2, 4, 8]

export default function AnnotationCanvas({ fileName, containerRef, isActive }) {
    const canvasRef = useRef(null)
    const [tool, setTool] = useState('pen')
    const [sizeIdx, setSizeIdx] = useState(0)
    const isDrawing = useRef(false)
    const lastPoint = useRef(null)
    const strokesKey = `hoso-annotations-${fileName || 'untitled'}`

    // Resize canvas to match container
    const resizeCanvas = useCallback(() => {
        const canvas = canvasRef.current
        const container = containerRef?.current
        if (!canvas || !container) return

        const rect = container.getBoundingClientRect()
        const dpr = window.devicePixelRatio || 1

        // Save current drawing
        const imageData = canvas.width > 0 ? canvas.toDataURL() : null

        canvas.width = rect.width * dpr
        canvas.height = rect.height * dpr
        canvas.style.width = rect.width + 'px'
        canvas.style.height = rect.height + 'px'

        const ctx = canvas.getContext('2d')
        ctx.scale(dpr, dpr)

        // Restore drawing
        if (imageData) {
            const img = new Image()
            img.onload = () => {
                ctx.drawImage(img, 0, 0, rect.width, rect.height)
            }
            img.src = imageData
        }
    }, [containerRef])

    // Load saved annotations
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

        const handleResize = () => resizeCanvas()
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [isActive, resizeCanvas])

    // Save to localStorage
    const saveAnnotations = useCallback(() => {
        const canvas = canvasRef.current
        if (!canvas || !fileName) return
        try {
            localStorage.setItem(strokesKey, canvas.toDataURL())
        } catch {
            // localStorage full — silently fail
        }
    }, [fileName, strokesKey])

    // Drawing handlers
    const getPoint = useCallback((e) => {
        const canvas = canvasRef.current
        if (!canvas) return null
        const rect = canvas.getBoundingClientRect()
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
            pressure: e.pressure || 0.5,
        }
    }, [])

    const startDraw = useCallback((e) => {
        e.preventDefault()
        isDrawing.current = true
        lastPoint.current = getPoint(e)
    }, [getPoint])

    const draw = useCallback((e) => {
        if (!isDrawing.current) return
        e.preventDefault()

        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        const point = getPoint(e)
        const prev = lastPoint.current
        if (!point || !prev) return

        const toolConfig = TOOLS[tool]
        const pressureMultiplier = tool === 'pen' ? (point.pressure * 1.5 + 0.5) : 1
        const strokeWidth = SIZES[sizeIdx] * pressureMultiplier

        ctx.globalCompositeOperation = toolConfig.composite
        ctx.globalAlpha = toolConfig.opacity
        ctx.strokeStyle = toolConfig.color
        ctx.lineWidth = tool === 'eraser' ? SIZES[sizeIdx] * 3 : strokeWidth
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'

        ctx.beginPath()
        ctx.moveTo(prev.x, prev.y)
        ctx.lineTo(point.x, point.y)
        ctx.stroke()

        // Reset compositing
        ctx.globalCompositeOperation = 'source-over'
        ctx.globalAlpha = 1

        lastPoint.current = point
    }, [tool, sizeIdx, getPoint])

    const endDraw = useCallback(() => {
        if (isDrawing.current) {
            isDrawing.current = false
            lastPoint.current = null
            saveAnnotations()
        }
    }, [saveAnnotations])

    const clearAll = useCallback(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        localStorage.removeItem(strokesKey)
    }, [strokesKey])

    if (!isActive) return null

    return (
        <>
            {/* Annotation toolbar */}
            <div className="annotation-toolbar no-print">
                <button
                    className={tool === 'pen' ? 'active' : ''}
                    onClick={() => setTool('pen')}
                    title="Bút vẽ"
                >
                    ✏️
                </button>
                <button
                    className={tool === 'highlighter' ? 'active' : ''}
                    onClick={() => setTool('highlighter')}
                    title="Bút highlight"
                >
                    🖍️
                </button>
                <button
                    className={tool === 'eraser' ? 'active' : ''}
                    onClick={() => setTool('eraser')}
                    title="Tẩy"
                >
                    🧹
                </button>

                <span className="mx-1 text-gray-300">|</span>

                {SIZES.map((size, idx) => (
                    <button
                        key={size}
                        className={sizeIdx === idx ? 'active' : ''}
                        onClick={() => setSizeIdx(idx)}
                        title={`${size}px`}
                    >
                        <span style={{
                            display: 'inline-block',
                            width: Math.max(size * 2, 6),
                            height: Math.max(size * 2, 6),
                            borderRadius: '50%',
                            background: sizeIdx === idx ? 'var(--color-paper)' : 'var(--color-ink)',
                        }} />
                    </button>
                ))}

                <span className="mx-1 text-gray-300">|</span>

                <button onClick={clearAll} title="Xoá tất cả">
                    🗑️
                </button>
            </div>

            {/* Canvas overlay */}
            <canvas
                ref={canvasRef}
                className={`annotation-canvas ${tool === 'eraser' ? 'eraser' : ''}`}
                onPointerDown={startDraw}
                onPointerMove={draw}
                onPointerUp={endDraw}
                onPointerLeave={endDraw}
                onPointerCancel={endDraw}
            />
        </>
    )
}
