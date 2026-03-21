/**
 * Toolbar – Top bar for the document preview area.
 * Shows file name, action buttons, and view mode tabs.
 */
export default function Toolbar({ fileName, onPrint, onSaveHtml, onMenuToggle, annotationActive, onAnnotationToggle, currentView, onChangeView }) {
    return (
        <div className="flex items-center justify-between px-4 md:px-6 py-3 border-b border-gray-300 bg-white no-print gap-2">
            {/* Left: Menu + File info */}
            <div className="flex items-center gap-3 min-w-0">
                {/* Hamburger – mobile only */}
                <button
                    onClick={onMenuToggle}
                    className="md:hidden p-2 border border-gray-300 cursor-pointer hover:bg-gray-100 flex-shrink-0"
                    aria-label="Mở menu"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="3" y1="12" x2="21" y2="12" />
                        <line x1="3" y1="6" x2="21" y2="6" />
                        <line x1="3" y1="18" x2="21" y2="18" />
                    </svg>
                </button>

                {/* View tabs */}
                <div className="flex items-center gap-0.5">
                    {[
                        { key: 'reader', label: '📖 Đọc' },
                        { key: 'files', label: '📂 File' },
                        { key: 'notes', label: '📝 Ghi chú' },
                    ].map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => onChangeView?.(tab.key)}
                            className={`px-3 py-1.5 text-xs font-semibold cursor-pointer border
                                ${currentView === tab.key
                                    ? 'bg-gray-800 text-white border-gray-800'
                                    : 'border-gray-200 text-gray-600 hover:border-gray-400 hover:text-gray-800'
                                }`}
                            style={{ transition: 'all 0.15s' }}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {currentView === 'reader' && fileName ? (
                    <div className="flex items-center gap-2 min-w-0 ml-2">
                        <svg className="flex-shrink-0" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                        </svg>
                        <span className="text-sm font-semibold truncate">{fileName}</span>
                    </div>
                ) : currentView === 'reader' ? (
                    <span className="text-sm text-gray-500 ml-2">Chưa mở file</span>
                ) : null}
            </div>

            {/* Right: Actions (only in reader mode) */}
            {currentView === 'reader' && (
                <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
                    {/* Annotation toggle */}
                    <button
                        onClick={onAnnotationToggle}
                        disabled={!fileName}
                        className={`px-3 py-2 text-sm font-medium border cursor-pointer
                         flex items-center gap-1.5
                         disabled:opacity-30 disabled:cursor-not-allowed
                         ${annotationActive
                                ? 'border-ink bg-ink text-paper'
                                : 'border-gray-300 hover:border-ink hover:bg-ink hover:text-paper'
                            }`}
                        style={{ transition: 'all 0.15s' }}
                        title="Ghi chú / Highlight"
                    >
                        <span className="text-base">✏️</span>
                        <span className="hidden sm:inline">Ghi chú</span>
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
