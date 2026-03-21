import { useCallback, useRef, useState } from 'react'
import { processFile } from '../utils/fileProcessor'

/**
 * FileDropper – Drag-and-drop zone for .md, .docx, and .html files.
 * Supports multi-file selection. Requires a project to be selected.
 */
export default function FileDropper({ onFilesProcessed, projectName, className = '' }) {
    const [isDragging, setIsDragging] = useState(false)
    const [error, setError] = useState(null)
    const [loading, setLoading] = useState(false)
    const [progress, setProgress] = useState('')
    const inputRef = useRef(null)

    const handleFiles = useCallback(async (fileList) => {
        if (!fileList || fileList.length === 0) return
        setError(null)
        setLoading(true)

        const results = []
        for (let i = 0; i < fileList.length; i++) {
            const file = fileList[i]
            setProgress(`Đang xử lý ${i + 1}/${fileList.length}: ${file.name}`)
            try {
                const result = await processFile(file)
                results.push(result)
            } catch (err) {
                setError(`Lỗi file "${file.name}": ${err.message}`)
            }
        }

        setLoading(false)
        setProgress('')
        if (results.length > 0) {
            onFilesProcessed(results)
        }
    }, [onFilesProcessed])

    const handleDrop = useCallback((e) => {
        e.preventDefault()
        setIsDragging(false)
        handleFiles(e.dataTransfer.files)
    }, [handleFiles])

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
        handleFiles(e.target.files)
        e.target.value = ''
    }, [handleFiles])

    return (
        <div
            className={`dropper ${isDragging ? 'active' : ''} ${className}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={handleClick}
            role="button"
            tabIndex={0}
            aria-label="Drop files here or click to upload"
        >
            <input
                ref={inputRef}
                type="file"
                accept=".md,.markdown,.docx,.html,.htm"
                multiple
                onChange={handleInputChange}
                className="hidden"
                aria-hidden="true"
            />

            <div className="flex flex-col items-center gap-3">
                {loading ? (
                    <div className="text-base font-medium">{progress || 'Đang xử lý...'}</div>
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
                            {!projectName && (
                                <p className="text-sm mt-1 text-orange-600 font-medium">
                                    ⚠️ Chọn 1 dự án trước khi tải file
                                </p>
                            )}
                            <p className="text-sm mt-1 opacity-60">
                                Hỗ trợ: .md, .docx, .html (chọn nhiều file cùng lúc)
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
