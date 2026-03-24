/**
 * Toolbar – Top bar for the document preview area.
 * Shows breadcrumb (project › file) + action buttons only.
 * View tabs are in Sidebar — not here (to avoid duplication).
 */
export default function Toolbar({ fileName, projectName, onPrint, onSaveHtml, annotationMode, onSetAnnotationMode, currentView, onEnterFocus }) {
    return (
        <div className="flex items-center justify-between px-4 md:px-6 py-3 border-b border-gray-300 bg-white no-print gap-2">
            {/* Left: breadcrumb / context label */}
            <div className="flex items-center gap-2 min-w-0">
                {currentView === 'reader' && fileName ? (
                    <div className="flex items-center gap-1.5 min-w-0 text-sm">
                        {projectName && (
                            <>
                                <span className="text-gray-400 truncate max-w-[100px]">{projectName}</span>
                                <span className="text-gray-300 mx-0.5">›</span>
                            </>
                        )}
                        <svg className="flex-shrink-0 text-gray-500" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                        </svg>
                        <span className="font-semibold truncate">{fileName}</span>
                    </div>
                ) : currentView === 'reader' ? (
                    <span className="text-sm text-gray-400">Chưa mở file</span>
                ) : currentView === 'files' ? (
                    <span className="text-sm font-semibold text-gray-700">📂 Quản lý file</span>
                ) : currentView === 'notes' ? (
                    <span className="text-sm font-semibold text-gray-700">📝 Ghi chú</span>
                ) : null}
            </div>

            {/* Right: Actions (reader mode only) */}
            {currentView === 'reader' && (
                <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
                    {/* Focus Mode — only when doc is open */}
                    {fileName && (
                        <button
                            onClick={onEnterFocus}
                            className="px-3 py-2 text-sm font-medium border border-gray-300
                             hover:border-ink hover:bg-ink hover:text-paper cursor-pointer
                             flex items-center gap-1.5"
                            style={{ transition: 'all 0.15s' }}
                            title="Chế độ đọc tập trung (F)"
                        >
                            <span className="text-base">📖</span>
                            <span className="hidden sm:inline">Tập trung</span>
                        </button>
                    )}

                    {/* Draw Mode */}
                    <button
                        onClick={() => onSetAnnotationMode(annotationMode === 'draw' ? 'off' : 'draw')}
                        disabled={!fileName}
                        className={`px-3 py-2 text-sm font-medium border cursor-pointer
                         flex items-center gap-1.5
                         disabled:opacity-30 disabled:cursor-not-allowed
                         ${annotationMode === 'draw'
                                ? 'border-ink bg-ink text-paper'
                                : 'border-gray-300 hover:border-ink hover:bg-ink hover:text-paper'
                            }`}
                        style={{ transition: 'all 0.15s' }}
                        title="Ghi chú tay / Vẽ"
                    >
                        <span className="text-base">✏️</span>
                        <span className="hidden sm:inline">Vẽ tay</span>
                    </button>

                    {/* Highlight Mode */}
                    <button
                        onClick={() => onSetAnnotationMode(annotationMode === 'highlight' ? 'off' : 'highlight')}
                        disabled={!fileName}
                        className={`px-3 py-2 text-sm font-medium border cursor-pointer
                         flex items-center gap-1.5
                         disabled:opacity-30 disabled:cursor-not-allowed
                         ${annotationMode === 'highlight'
                                ? 'border-ink bg-ink text-paper'
                                : 'border-gray-300 hover:border-ink hover:bg-ink hover:text-paper'
                            }`}
                        style={{ transition: 'all 0.15s' }}
                        title="Highlight văn bản"
                    >
                        <span className="text-base">🖍️</span>
                        <span className="hidden sm:inline">Highlight</span>
                    </button>

                    <button
                        onClick={onPrint}
                        disabled={!fileName}
                        className="px-3 py-2 text-sm font-medium border border-gray-300
                         hover:border-ink hover:bg-ink hover:text-paper
                         disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer
                         flex items-center gap-1.5"
                        style={{ transition: 'all 0.15s' }}
                    >
                        <svg className="flex-shrink-0" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="6 9 6 2 18 2 18 9" />
                            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                            <rect x="6" y="14" width="12" height="8" />
                        </svg>
                        <span className="hidden sm:inline">In PDF</span>
                    </button>

                    <button
                        onClick={onSaveHtml}
                        disabled={!fileName}
                        className="px-3 py-2 text-sm font-medium border border-gray-300
                         hover:border-ink hover:bg-ink hover:text-paper
                         disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer
                         flex items-center gap-1.5"
                        style={{ transition: 'all 0.15s' }}
                    >
                        <svg className="flex-shrink-0" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="7 10 12 15 17 10" />
                            <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                        <span className="hidden sm:inline">Lưu HTML</span>
                    </button>
                </div>
            )}
        </div>
    )
}
