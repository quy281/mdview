import { useState, useRef, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import DOMPurify from 'dompurify'
import AnnotationCanvas from './AnnotationCanvas'

/**
 * FocusReader – Full-screen focused reading mode.
 * Shows only document content + a minimal bottom bar.
 * Bottom bar: ← Back | ✏️ Ghi chú tay | 📝 Quick note
 * Drawing canvas is positioned over the scrollable content area.
 */
export default function FocusReader({ document, onExit, onSaveNote }) {
    const [annotationActive, setAnnotationActive] = useState(false)
    const [showNoteInput, setShowNoteInput] = useState(false)
    const [noteText, setNoteText] = useState('')
    const contentRef = useRef(null)

    const handleSaveNote = useCallback(() => {
        if (!noteText.trim()) {
            setShowNoteInput(false)
            return
        }
        onSaveNote?.({
            type: 'note',
            text: noteText.trim(),
            color: '#fde047',
            note: noteText.trim(),
            fileName: document?.fileName,
        })
        setNoteText('')
        setShowNoteInput(false)
    }, [noteText, onSaveNote, document])

    if (!document) return null

    const sanitizedHtml = (document.type === 'docx' || document.type === 'html')
        ? DOMPurify.sanitize(document.content, { ADD_TAGS: ['style'], ADD_ATTR: ['style', 'class'] })
        : ''

    return (
        <div className="focus-mode">
            {/* Scrollable content area — canvas container */}
            <div
                className="focus-content"
                ref={contentRef}
                id="focus-paper-content"
                style={{ position: 'relative' }}
            >
                <div className="focus-paper">
                    {document.type === 'md' ? (
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {document.content || ''}
                        </ReactMarkdown>
                    ) : (
                        <div dangerouslySetInnerHTML={{ __html: sanitizedHtml }} />
                    )}
                </div>

                {/* Canvas overlay for handwriting — always mounted when active,
                    positioned over the entire scrollable content area */}
                <AnnotationCanvas
                    fileName={`focus-${document.fileName}`}
                    containerRef={contentRef}
                    isActive={annotationActive}
                />
            </div>

            {/* Quick note input (above bottom bar) */}
            {showNoteInput && (
                <div className="focus-note-input">
                    <textarea
                        autoFocus
                        value={noteText}
                        onChange={e => setNoteText(e.target.value)}
                        onKeyDown={e => {
                            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSaveNote() }
                            if (e.key === 'Escape') { setShowNoteInput(false); setNoteText('') }
                        }}
                        placeholder="Ghi chú nhanh... (Enter để lưu, Esc để hủy)"
                        rows={3}
                        className="focus-note-textarea"
                    />
                    <div className="focus-note-actions">
                        <button onClick={handleSaveNote} className="focus-note-btn-save">
                            ✓ Lưu
                        </button>
                        <button onClick={() => { setShowNoteInput(false); setNoteText('') }} className="focus-note-btn-cancel">
                            ✕ Hủy
                        </button>
                    </div>
                </div>
            )}

            {/* Bottom bar */}
            <nav className="focus-bottom-bar">
                <button
                    className="focus-nav-btn"
                    onClick={onExit}
                >
                    <span className="focus-nav-icon">←</span>
                    <span className="focus-nav-label">Quay lại</span>
                </button>

                <button
                    className={`focus-nav-btn ${annotationActive ? 'focus-nav-btn--active' : ''}`}
                    onClick={() => {
                        setAnnotationActive(v => !v)
                        if (showNoteInput) setShowNoteInput(false)
                    }}
                >
                    <span className="focus-nav-icon">✏️</span>
                    <span className="focus-nav-label">{annotationActive ? 'Đang vẽ' : 'Ghi tay'}</span>
                </button>

                <button
                    className={`focus-nav-btn ${showNoteInput ? 'focus-nav-btn--active' : ''}`}
                    onClick={() => {
                        setShowNoteInput(v => !v)
                        if (annotationActive) setAnnotationActive(false)
                    }}
                >
                    <span className="focus-nav-icon">📝</span>
                    <span className="focus-nav-label">Ghi chú</span>
                </button>

                {/* File name indicator */}
                <div className="focus-filename" title={document.fileName}>
                    <span className="focus-filename-text">{document.fileName}</span>
                </div>
            </nav>
        </div>
    )
}
