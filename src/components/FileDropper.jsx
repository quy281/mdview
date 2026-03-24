import { useCallback, useRef, useState } from 'react'
import { processFile } from '../utils/fileProcessor'

/**
 * FileDropper – Modern animated drag-and-drop zone.
 * Dark theme with accent glow effects.
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

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', position: 'relative', zIndex: 1 }}>
                {loading ? (
                    <div>
                        <div style={{
                            width: '48px',
                            height: '48px',
                            border: '3px solid var(--color-border)',
                            borderTopColor: 'var(--color-accent)',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite',
                            margin: '0 auto 12px',
                        }} />
                        <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text)' }}>
                            {progress || 'Đang xử lý...'}
                        </div>
                        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                    </div>
                ) : (
                    <>
                        <div style={{
                            width: '64px',
                            height: '64px',
                            borderRadius: '16px',
                            background: 'var(--color-accent-dim)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}>
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="28"
                                height="28"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="var(--color-accent-light)"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="17 8 12 3 7 8" />
                                <line x1="12" y1="3" x2="12" y2="15" />
                            </svg>
                        </div>

                        <div style={{ textAlign: 'center' }}>
                            <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-text)' }}>
                                {isDragging ? 'Thả file vào đây...' : 'Kéo thả file hoặc nhấn để chọn'}
                            </p>
                            {projectName && (
                                <p style={{ fontSize: '13px', marginTop: '6px', fontWeight: 600, color: 'var(--color-accent-light)' }}>
                                    📂 Tải vào: {projectName}
                                </p>
                            )}
                            {!projectName && (
                                <p style={{ fontSize: '13px', marginTop: '6px', fontWeight: 500, color: 'var(--color-warning)' }}>
                                    ⚠️ Chọn 1 dự án trước khi tải file
                                </p>
                            )}
                            <p style={{ fontSize: '12px', marginTop: '8px', color: 'var(--color-text-muted)' }}>
                                Hỗ trợ: .md, .docx, .html (chọn nhiều file cùng lúc)
                            </p>
                        </div>
                    </>
                )}
            </div>

            {error && (
                <p style={{ fontSize: '13px', marginTop: '12px', color: 'var(--color-danger)', fontWeight: 500 }}>{error}</p>
            )}
        </div>
    )
}
