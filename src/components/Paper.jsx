import { useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import DOMPurify from 'dompurify'
import AnnotationCanvas from './AnnotationCanvas'
import TextHighlighter from './TextHighlighter'

/**
 * Paper – A4 sheet simulator with annotation overlay + text highlighting.
 * Renders document content in a print-ready, Calibri-typography container.
 * Supports: md, docx, html types.
 */
export default function Paper({ document, annotationActive, onHighlight }) {
    const paperRef = useRef(null)

    if (!document) {
        return (
            <div className="paper flex items-center justify-center" style={{ minHeight: '60vh' }}>
                <div className="text-center opacity-40" style={{ fontFamily: 'var(--font-sans)' }}>
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="64"
                        height="64"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="mx-auto mb-4"
                    >
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

    // Sanitize HTML content for docx & html types
    const sanitizedHtml = (document.type === 'docx' || document.type === 'html')
        ? DOMPurify.sanitize(document.content, { ADD_TAGS: ['style'], ADD_ATTR: ['style', 'class'] })
        : ''

    return (
        <div className="paper-wrapper" ref={paperRef}>
            <div className="paper" id="paper-content">
                {document.type === 'md' ? (
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {document.content}
                    </ReactMarkdown>
                ) : (
                    <div dangerouslySetInnerHTML={{ __html: sanitizedHtml }} />
                )}
            </div>

            {/* Text highlighting toolbar (shows on text selection) */}
            <TextHighlighter
                paperId="paper-content"
                isActive={annotationActive}
                onHighlight={onHighlight}
            />

            {/* Drawing canvas overlay */}
            <AnnotationCanvas
                fileName={document.fileName}
                containerRef={paperRef}
                isActive={annotationActive}
            />
        </div>
    )
}
