import { useState, useRef } from 'react'

/**
 * BottomNav – Mobile/Tablet bottom navigation bar.
 * Tabs: Document view, Projects, Upload, Files, Notes, Tools.
 * No login/logout — public access.
 */
export default function BottomNav({
    projects,
    selectedProject,
    onSelectProject,
    onCreateProject,
    onDeleteProject,
    onSelectDocument,
    onDeleteDocument,
    onUploadClick,
    currentFile,
    annotationActive,
    onAnnotationToggle,
    onPrint,
    onSaveHtml,
    hasDocument,
    recentDocs,
    onOpenRecent,
    currentView,
    onChangeView,
}) {
    const [activeTab, setActiveTab] = useState('doc')
    const [showPanel, setShowPanel] = useState(false)
    const [newProjectName, setNewProjectName] = useState('')
    const [showNewProject, setShowNewProject] = useState(false)
    const inputRef = useRef(null)

    const handleTabClick = (tab) => {
        if (tab === 'doc') {
            setShowPanel(false)
            setActiveTab('doc')
            onChangeView?.('reader')
            return
        }
        if (tab === 'focus') {
            setShowPanel(false)
            setActiveTab('focus')
            onChangeView?.('focus')
            return
        }
        if (tab === 'files') {
            setShowPanel(false)
            setActiveTab('files')
            onChangeView?.('files')
            return
        }
        if (tab === 'notes') {
            setShowPanel(false)
            setActiveTab('notes')
            onChangeView?.('notes')
            return
        }
        if (activeTab === tab && showPanel) {
            setShowPanel(false)
        } else {
            setActiveTab(tab)
            setShowPanel(true)
        }
    }

    const handleCreateProject = () => {
        if (newProjectName.trim()) {
            onCreateProject(newProjectName.trim())
            setNewProjectName('')
            setShowNewProject(false)
        }
    }

    return (
        <div className="md:hidden no-print">
            {/* Slide-up panel */}
            {showPanel && (
                <>
                    <div
                        className="fixed inset-0 bg-black/30 z-40"
                        onClick={() => setShowPanel(false)}
                    />
                    <div className="fixed bottom-[56px] left-0 right-0 z-50 bg-white border-t border-gray-300
                          max-h-[60vh] overflow-auto">
                        {/* Projects tab panel */}
                        {activeTab === 'projects' && (
                            <div className="p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <p className="text-sm font-bold uppercase tracking-wider">Dự án</p>
                                    <button
                                        onClick={() => {
                                            setShowNewProject(true)
                                            setTimeout(() => inputRef.current?.focus(), 50)
                                        }}
                                        className="px-3 py-1.5 text-sm border border-ink bg-ink text-paper cursor-pointer"
                                    >
                                        + Thêm
                                    </button>
                                </div>

                                {showNewProject && (
                                    <div className="flex gap-2 mb-3">
                                        <input
                                            ref={inputRef}
                                            type="text"
                                            value={newProjectName}
                                            onChange={(e) => setNewProjectName(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') handleCreateProject()
                                                if (e.key === 'Escape') { setShowNewProject(false); setNewProjectName('') }
                                            }}
                                            placeholder="Tên dự án..."
                                            className="flex-1 px-3 py-2 text-sm border border-gray-300 outline-none focus:border-ink"
                                        />
                                        <button onClick={handleCreateProject} className="px-3 py-2 text-sm bg-ink text-paper cursor-pointer">✓</button>
                                        <button onClick={() => { setShowNewProject(false); setNewProjectName('') }} className="px-3 py-2 text-sm border border-gray-300 cursor-pointer">✕</button>
                                    </div>
                                )}

                                {projects.length === 0 && !showNewProject && (
                                    <p className="text-sm text-gray-500 text-center py-8">Chưa có dự án. Nhấn "+ Thêm" để tạo.</p>
                                )}

                                <ul className="space-y-1">
                                    {projects.map((project) => (
                                        <li key={project.id}>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => onSelectProject(project.id === selectedProject ? null : project.id)}
                                                    className={`flex-1 text-left px-3 py-3 text-sm font-medium cursor-pointer
                                     flex items-center gap-2 border
                                     ${project.id === selectedProject
                                                            ? 'bg-ink text-paper border-ink'
                                                            : 'border-gray-200 active:bg-gray-100'
                                                        }`}
                                                >
                                                    <span>{project.id === selectedProject ? '📂' : '📁'}</span>
                                                    <span className="flex-1 truncate">{project.name}</span>
                                                    <span className="text-xs opacity-60">{project.documents?.length || 0}</span>
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        if (confirm(`Xóa "${project.name}"?`)) onDeleteProject(project.id)
                                                    }}
                                                    className="p-2 text-gray-400 active:text-red-600 cursor-pointer border border-gray-200"
                                                >
                                                    🗑️
                                                </button>
                                            </div>

                                            {project.id === selectedProject && project.documents?.length > 0 && (
                                                <ul className="ml-4 mt-1 mb-2 border-l-2 border-gray-200 pl-3">
                                                    {project.documents.map((doc) => (
                                                        <li key={doc.id} className="flex items-center gap-1">
                                                            <button
                                                                onClick={() => {
                                                                    onSelectDocument(doc)
                                                                    setShowPanel(false)
                                                                    setActiveTab('doc')
                                                                    onChangeView?.('reader')
                                                                }}
                                                                className={`flex-1 text-left px-2 py-2.5 text-sm cursor-pointer truncate
                                           ${currentFile === doc.fileName ? 'font-bold' : 'text-gray-600'}`}
                                                            >
                                                                {doc.type === 'md' ? '📝' : doc.type === 'html' ? '🌐' : '📄'} {doc.fileName}
                                                            </button>
                                                            <button
                                                                onClick={() => onDeleteDocument(project.id, doc.id)}
                                                                className="p-1 text-gray-400 active:text-red-600 cursor-pointer text-xs"
                                                            >
                                                                ✕
                                                            </button>
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Tools tab panel */}
                        {activeTab === 'tools' && (
                            <div className="p-4 space-y-2">
                                <p className="text-sm font-bold uppercase tracking-wider mb-3">Công cụ</p>

                                <button
                                    onClick={() => { onAnnotationToggle(); setShowPanel(false); }}
                                    disabled={!hasDocument}
                                    className={`w-full py-3 px-4 text-sm font-medium flex items-center gap-3 border cursor-pointer
                             disabled:opacity-30
                             ${annotationActive ? 'bg-ink text-paper border-ink' : 'border-gray-300 active:bg-gray-100'}`}
                                >
                                    ✏️ {annotationActive ? 'Tắt ghi chú / highlight' : 'Bật ghi chú / highlight'}
                                </button>

                                <button
                                    onClick={() => { onPrint(); setShowPanel(false); }}
                                    disabled={!hasDocument}
                                    className="w-full py-3 px-4 text-sm font-medium flex items-center gap-3 border border-gray-300
                             active:bg-gray-100 cursor-pointer disabled:opacity-30"
                                >
                                    🖨️ In PDF
                                </button>

                                <button
                                    onClick={() => { onSaveHtml(); setShowPanel(false); }}
                                    disabled={!hasDocument}
                                    className="w-full py-3 px-4 text-sm font-medium flex items-center gap-3 border border-gray-300
                             active:bg-gray-100 cursor-pointer disabled:opacity-30"
                                >
                                    💾 Lưu HTML
                                </button>
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* Bottom tab bar */}
            <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-300
                      flex items-stretch h-[56px]">
                <button
                    onClick={() => handleTabClick('doc')}
                    className={`flex-1 flex flex-col items-center justify-center gap-0.5 text-xs cursor-pointer
                     ${currentView === 'reader' && !showPanel ? 'text-ink font-bold' : 'text-gray-500'}`}
                >
                    <span className="text-lg">📄</span>
                    <span>Tài liệu</span>
                </button>

                <button
                    onClick={() => handleTabClick('projects')}
                    className={`flex-1 flex flex-col items-center justify-center gap-0.5 text-xs cursor-pointer
                     ${activeTab === 'projects' && showPanel ? 'text-ink font-bold' : 'text-gray-500'}`}
                >
                    <span className="text-lg">📁</span>
                    <span>Dự án</span>
                </button>

                {/* Center: Upload or Focus (context-aware) */}
                {hasDocument ? (
                    <button
                        onClick={() => handleTabClick('focus')}
                        className={`flex-1 flex flex-col items-center justify-center gap-0.5 text-xs cursor-pointer
                         ${currentView === 'focus' ? 'text-ink font-bold' : 'text-gray-500'}`}
                    >
                        <span className="text-xl">📖</span>
                        <span>Đọc</span>
                    </button>
                ) : (
                    <button
                        onClick={() => { onUploadClick(); setShowPanel(false); setActiveTab('doc'); }}
                        className="flex-1 flex flex-col items-center justify-center gap-0.5 text-xs cursor-pointer text-gray-500"
                    >
                        <span className="text-lg">⬆️</span>
                        <span>Tải lên</span>
                    </button>
                )}

                <button
                    onClick={() => handleTabClick('files')}
                    className={`flex-1 flex flex-col items-center justify-center gap-0.5 text-xs cursor-pointer
                     ${currentView === 'files' ? 'text-ink font-bold' : 'text-gray-500'}`}
                >
                    <span className="text-lg">📂</span>
                    <span>File</span>
                </button>

                <button
                    onClick={() => handleTabClick('notes')}
                    className={`flex-1 flex flex-col items-center justify-center gap-0.5 text-xs cursor-pointer
                     ${currentView === 'notes' ? 'text-ink font-bold' : 'text-gray-500'}`}
                >
                    <span className="text-lg">📝</span>
                    <span>Ghi chú</span>
                </button>
            </nav>
        </div>
    )
}
