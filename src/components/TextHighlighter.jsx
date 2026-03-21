import { useState, useRef, useEffect, useCallback } from 'react'
import DOMPurify from 'dompurify'

/**
 * TextHighlighter – Floating toolbar for text highlighting on selected content.
 * Shows color picker on text selection, applies <mark> tags.
 */

const COLORS = [
    { name: 'Vàng', value: '#fde047' },
    { name: 'Xanh', value: '#86efac' },
    { name: 'Hồng', value: '#fda4af' },
    { name: 'Xanh dương', value: '#93c5fd' },
    { name: 'Cam', value: '#fdba74' },
]

export default function TextHighlighter({ paperId, onHighlight, isActive }) {
    const [toolbar, setToolbar] = useState(null)
    const [selectedText, setSelectedText] = useState('')
    const [noteText, setNoteText] = useState('')
    const [showNote, setShowNote] = useState(false)
    const [selectedColor, setSelectedColor] = useState(COLORS[0].value)
    const toolbarRef = useRef(null)

    const handleMouseUp = useCallback(() => {
        if (!isActive) return

        const selection = window.getSelection()
        const text = selection?.toString()?.trim()
        if (!text || text.length < 2) {
            setToolbar(null)
            setSelectedText('')
            return
        }

        // Check if selection is within the paper
        const paperEl = document.getElementById(paperId)
        if (!paperEl) return
        const anchorNode = selection.anchorNode
        if (!paperEl.contains(anchorNode)) return

        const range = selection.getRangeAt(0)
        const rect = range.getBoundingClientRect()

        setSelectedText(text)
        setToolbar({
            top: rect.top + window.scrollY - 50,
            left: rect.left + window.scrollX + rect.width / 2,
        })
    }, [isActive, paperId])

    useEffect(() => {
        document.addEventListener('mouseup', handleMouseUp)
        return () => document.removeEventListener('mouseup', handleMouseUp)
    }, [handleMouseUp])

    // Close toolbar on click outside
    useEffect(() => {
        const handler = (e) => {
            if (toolbarRef.current && !toolbarRef.current.contains(e.target)) {
                setToolbar(null)
                setShowNote(false)
                setNoteText('')
            }
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

    const applyHighlight = useCallback((color, note = '') => {
        const selection = window.getSelection()
        if (!selection || selection.rangeCount === 0) return

        const range = selection.getRangeAt(0)

        // Create highlight mark
        const mark = document.createElement('mark')
        mark.style.backgroundColor = color
        mark.style.padding = '1px 2px'
        mark.style.borderRadius = '2px'
        mark.style.cursor = 'pointer'
        mark.dataset.highlightId = Date.now().toString()
        if (note) mark.title = note

        try {
            range.surroundContents(mark)
        } catch {
            // If selection spans multiple elements, wrap text nodes individually
            const fragment = range.extractContents()
            mark.appendChild(fragment)
            range.insertNode(mark)
        }

        selection.removeAllRanges()
        setToolbar(null)
        setShowNote(false)
        setNoteText('')

        // Notify parent
        if (onHighlight) {
            onHighlight({
                text: selectedText,
                color,
                note,
                highlightId: mark.dataset.highlightId,
            })
        }
    }, [selectedText, onHighlight])

    if (!toolbar || !isActive) return null

    return (
        <div
            ref={toolbarRef}
            className="fixed z-50 no-print"
            style={{
                top: toolbar.top,
                left: toolbar.left,
                transform: 'translateX(-50%)',
            }}
        >
            <div className="bg-white border-2 border-gray-800 shadow-lg p-2 flex flex-col gap-2"
                style={{ minWidth: '200px' }}>
                {/* Color buttons */}
                <div className="flex items-center gap-1">
                    <span className="text-xs font-semibold text-gray-600 mr-1">🖍️</span>
                    {COLORS.map((c) => (
                        <button
                            key={c.value}
                            onClick={() => {
                                if (showNote) {
                                    setSelectedColor(c.value)
                                } else {
                                    applyHighlight(c.value)
                                }
                            }}
                            className="w-7 h-7 border-2 cursor-pointer hover:scale-110 transition-transform"
                            style={{
                                backgroundColor: c.value,
                                borderColor: selectedColor === c.value && showNote ? '#000' : 'transparent',
                            }}
                            title={c.name}
                        />
                    ))}
                    <span className="mx-1 text-gray-300">|</span>
                    <button
                        onClick={() => setShowNote(!showNote)}
                        className={`px-2 py-1 text-xs font-medium border cursor-pointer
                            ${showNote ? 'bg-gray-800 text-white border-gray-800' : 'border-gray-300 hover:border-gray-800'}`}
                        title="Thêm ghi chú"
                    >
                        📝
                    </button>
                </div>

                {/* Note input */}
                {showNote && (
                    <div className="flex gap-1">
                        <input
                            type="text"
                            value={noteText}
                            onChange={(e) => setNoteText(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') applyHighlight(selectedColor, noteText)
                            }}
                            placeholder="Nhập ghi chú..."
                            className="flex-1 text-xs px-2 py-1.5 border border-gray-300 outline-none focus:border-gray-800"
                            autoFocus
                        />
                        <button
                            onClick={() => applyHighlight(selectedColor, noteText)}
                            className="px-2 py-1 text-xs bg-gray-800 text-white border border-gray-800 cursor-pointer"
                        >
                            ✓
                        </button>
                    </div>
                )}

                {/* Selected text preview */}
                <p className="text-xs text-gray-500 truncate max-w-[200px]">
                    "{selectedText.slice(0, 40)}{selectedText.length > 40 ? '...' : ''}"
                </p>
            </div>
        </div>
    )
}
