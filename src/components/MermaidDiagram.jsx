import { useEffect, useRef, useState } from 'react'
import mermaid from 'mermaid'

// Init mermaid once
mermaid.initialize({
    startOnLoad: false,
    theme: 'default',
    securityLevel: 'loose',
    fontFamily: 'Calibri, Georgia, serif',
    fontSize: 14,
    flowchart: { useMaxWidth: true, htmlLabels: true },
    sequence: { useMaxWidth: true },
    gantt: { useMaxWidth: true },
})

let mermaidId = 0

/**
 * Renders a mermaid diagram from raw code string.
 * Shows raw code on error with a message.
 */
export default function MermaidDiagram({ code }) {
    const containerRef = useRef(null)
    const [error, setError] = useState(null)
    const id = useRef(`mermaid-${++mermaidId}`).current

    useEffect(() => {
        if (!containerRef.current || !code) return

        setError(null)
        containerRef.current.innerHTML = ''

        mermaid.render(id, code.trim())
            .then(({ svg }) => {
                if (containerRef.current) {
                    containerRef.current.innerHTML = svg
                    // Make SVG responsive
                    const svgEl = containerRef.current.querySelector('svg')
                    if (svgEl) {
                        svgEl.style.maxWidth = '100%'
                        svgEl.style.height = 'auto'
                        svgEl.removeAttribute('height')
                    }
                }
            })
            .catch(err => {
                setError(err?.message || 'Lỗi render diagram')
            })
    }, [code, id])

    if (error) {
        return (
            <div style={{
                border: '1px dashed #ef4444',
                borderRadius: 6,
                padding: '12px 16px',
                marginBottom: 16,
                background: 'rgba(239,68,68,0.05)',
            }}>
                <div style={{ fontSize: 11, color: '#ef4444', marginBottom: 6, fontFamily: 'monospace' }}>
                    ⚠️ Mermaid render error: {error}
                </div>
                <pre style={{ fontSize: 12, color: '#666', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                    {code}
                </pre>
            </div>
        )
    }

    return (
        <div
            ref={containerRef}
            style={{
                margin: '16px 0',
                textAlign: 'center',
                overflow: 'auto',
            }}
        />
    )
}
