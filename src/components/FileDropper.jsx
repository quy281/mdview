import { useCallback, useRef, useState } from 'react'
import { processFile } from '../utils/fileProcessor'

/**
 * FileDropper – Drag-and-drop zone for .md and .docx files.
 * Shows which project the file will be uploaded to.
 */
export default function FileDropper({ onFileProcessed, projectName, className = '' }) {
    const [isDragging, setIsDragging] = useState(false)
    const [error, setError] = useState(null)
    const [loading, setLoading] = useState(false)
    const inputRef = useRef(null)

    const handleFile = useCallback(async (file) => {
        setError(null)
        setLoading(true)
        try {
            const result = await processFile(file)
            onFileProcessed(result)
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }, [onFileProcessed])

    const handleDrop = useCallback((e) => {
        e.preventDefault()
        setIsDragging(false)
        const file = e.dataTransfer.files[0]
        if (file) handleFile(file)
    }, [handleFile])

    const handleDragOver = useCallback((e) => {
        e.preventDefault()
        setIsDragging(true)
    }, [])

    const handleDragLeave = useCallback(() => {
        setIsDragging(false)
    }, [])

    const handleClick = useCallback(() => {
        inputRef.current?.click()
    }, [])

    const handleInputChange = useCallback((e) => {
        const file = e.target.files[0]
        if (file) handleFile(file)
        e.target.value = ''
    }, [handleFile])

    return (
        <div
            className={`dropper ${isDragging ? 'active' : ''} ${className}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={handleClick}
            role="button"
            tabIndex={0}
            aria-label="Drop a file here or click to upload"
        >
            <input
                ref={inputRef}
                type="file"
                accept=".md,.markdown,.docx"
                onChange={handleInputChange}
                className="hidden"
                aria-hidden="true"
            />

            <div className="flex flex-col items-center gap-3">
                {loading ? (
                    <div className="text-base font-medium">Đang xử lý...</div>
                ) : (
                    <>
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="40"
                            height="40"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="17 8 12 3 7 8" />
                            <line x1="12" y1="3" x2="12" y2="15" />
                        </svg>

                        <div>
                            <p className="text-base font-medium">
                                {isDragging ? 'Thả file vào đây...' : 'Kéo thả file hoặc nhấn để chọn'}
                            </p>
                            {projectName && (
                                <p className="text-sm mt-1 font-semibold">
                                    📂 Tải vào: {projectName}
                                </p>
                            )}
                            <p className="text-sm mt-1 opacity-60">
                                Hỗ trợ: .md, .docx
                            </p>
                        </div>
                    </>
                )}
            </div>

            {error && (
                <p className="text-sm mt-3 text-red-600 font-medium">{error}</p>
            )}
        </div>
    )
}
