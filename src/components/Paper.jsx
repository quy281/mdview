import { useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import DOMPurify from 'dompurify'
import MermaidDiagram from './MermaidDiagram'
import AnnotationCanvas from './AnnotationCanvas'
import TextHighlighter from './TextHighlighter'

/**
 * Paper – A4 sheet simulator with annotation overlay + text highlighting.
 * Renders document content in a print-ready, Calibri-typography container.
 * Supports: md (with Mermaid diagrams, images, GFM), docx, html types.
 */
export default function Paper({ document, annotationMode, onHighlight }) {
    const paperRef = useRef(null)

    if (!document) {
        return (
            <div className="paper flex items-center justify-center" style={{ minHeight: '60vh' }}>
                <div className="text-center opacity-40" style={{ fontFamily: 'var(--font-sans)' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24"
                        fill="none" stroke="currentColor" strokeWidth="1"
                        strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-4">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="16" y1="13" x2="8" y2="13" />
                        <line x1="16" y1="17" x2="8" y2="17" />
                        <polyline points="10 9 9 9 8 9" />
                    </svg>
                    <p className="text-lg">Chưa có tài liệu</p>
                    <p className="text-sm mt-1">Kéo thả file .md, .docx hoặc .html vào đây</p>
                </div>
            </div>
        )
    }

    // Sanitize HTML content for docx & html types — allow images + style tags
    const sanitizedHtml = (document.type === 'docx' || document.type === 'html')
        ? DOMPurify.sanitize(document.content, {
            ADD_TAGS: ['style', 'img'],
            ADD_ATTR: ['style', 'class', 'src', 'alt', 'width', 'height'],
            ALLOW_DATA_ATTR: true,
        })
        : ''

    return (
        <div className="paper-wrapper" ref={paperRef}>
            <div className="paper" id="paper-content">
                {document.type === 'md' ? (
                    <div className="markdown-body">
                        <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            rehypePlugins={[rehypeRaw]}
                            components={markdownComponents}
                        >
                            {document.content}
                        </ReactMarkdown>
                    </div>
                ) : (
                    <div dangerouslySetInnerHTML={{ __html: sanitizedHtml }} />
                )}
            </div>

            {/* Text highlighting toolbar (shows on text selection) */}
            <TextHighlighter
                paperId="paper-content"
                isActive={annotationMode === 'highlight'}
                onHighlight={onHighlight}
            />

            {/* Drawing canvas overlay */}
            <AnnotationCanvas
                fileName={document.fileName}
                containerRef={paperRef}
                isActive={annotationMode === 'draw'}
            />
        </div>
    )
}

// ─── Custom ReactMarkdown components ───────────────────────────

const markdownComponents = {
    // Code blocks — detect mermaid and render as diagram
    code({ node, inline, className, children, ...props }) {
        const lang = (className || '').replace('language-', '').trim()
        const raw = String(children).replace(/\n$/, '')

        if (!inline && lang === 'mermaid') {
            return <MermaidDiagram code={raw} />
        }

        // Regular code block with syntax highlighting
        if (!inline && lang) {
            return (
                <div style={{ position: 'relative', margin: '12px 0' }}>
                    <span style={{
                        position: 'absolute', top: 8, right: 12,
                        fontSize: 10, color: '#94a3b8', fontFamily: 'monospace',
                        textTransform: 'uppercase', letterSpacing: '0.05em',
                    }}>
                        {lang}
                    </span>
                    <pre style={{
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: 8,
                        padding: '16px 14px',
                        overflowX: 'auto',
                        fontSize: 13,
                        lineHeight: 1.6,
                        fontFamily: "'Fira Code', 'Consolas', 'Monaco', monospace",
                    }}>
                        <code className={className} {...props}>{children}</code>
                    </pre>
                </div>
            )
        }

        // Inline code
        return (
            <code style={{
                background: '#f1f5f9',
                border: '1px solid #e2e8f0',
                borderRadius: 4,
                padding: '1px 6px',
                fontSize: '0.88em',
                fontFamily: "'Fira Code', 'Consolas', monospace",
                color: '#6366f1',
            }} {...props}>
                {children}
            </code>
        )
    },

    // Images — full width, rounded, with alt caption
    img({ src, alt, ...props }) {
        return (
            <figure style={{ margin: '16px 0', textAlign: 'center' }}>
                <img
                    src={src}
                    alt={alt || ''}
                    style={{
                        maxWidth: '100%',
                        height: 'auto',
                        borderRadius: 8,
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                        display: 'block',
                        margin: '0 auto',
                    }}
                    loading="lazy"
                    onError={e => {
                        e.target.style.display = 'none'
                        e.target.nextSibling && (e.target.nextSibling.style.display = 'block')
                    }}
                    {...props}
                />
                <div style={{ display: 'none', color: '#94a3b8', fontSize: 12, marginTop: 4 }}>
                    ⚠️ Không tải được ảnh: {alt || src}
                </div>
                {alt && (
                    <figcaption style={{
                        marginTop: 6,
                        fontSize: 12,
                        color: '#64748b',
                        fontStyle: 'italic',
                    }}>
                        {alt}
                    </figcaption>
                )}
            </figure>
        )
    },

    // Tables — styled
    table({ children, ...props }) {
        return (
            <div style={{ overflowX: 'auto', margin: '16px 0' }}>
                <table style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    fontSize: 13.5,
                    lineHeight: 1.5,
                }} {...props}>
                    {children}
                </table>
            </div>
        )
    },
    th({ children, ...props }) {
        return (
            <th style={{
                background: '#f1f5f9',
                border: '1px solid #e2e8f0',
                padding: '8px 12px',
                fontWeight: 700,
                textAlign: 'left',
                fontSize: 12.5,
                color: '#475569',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
            }} {...props}>
                {children}
            </th>
        )
    },
    td({ children, ...props }) {
        return (
            <td style={{
                border: '1px solid #e2e8f0',
                padding: '8px 12px',
                color: '#334155',
            }} {...props}>
                {children}
            </td>
        )
    },

    // Blockquote
    blockquote({ children, ...props }) {
        return (
            <blockquote style={{
                borderLeft: '4px solid #6366f1',
                margin: '16px 0',
                padding: '10px 16px',
                background: 'rgba(99,102,241,0.05)',
                borderRadius: '0 8px 8px 0',
                color: '#475569',
                fontStyle: 'italic',
            }} {...props}>
                {children}
            </blockquote>
        )
    },

    // Headings with anchors
    h1: ({ children }) => <h1 style={{ borderBottom: '2px solid #e2e8f0', paddingBottom: 8, marginBottom: 16 }}>{children}</h1>,
    h2: ({ children }) => <h2 style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: 6, marginBottom: 12 }}>{children}</h2>,

    // Horizontal rule
    hr: () => <hr style={{ border: 'none', borderTop: '2px solid #f1f5f9', margin: '24px 0' }} />,

    // Links — open in new tab
    a({ href, children, ...props }) {
        return (
            <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#6366f1', textDecoration: 'underline' }}
                {...props}
            >
                {children}
            </a>
        )
    },
}
