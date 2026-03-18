import { useState, useRef } from 'react'

/**
 * Sidebar – Project navigation with CRUD, document list, file upload.
 * Responsive: drawer overlay on mobile, fixed panel on desktop.
 */
export default function Sidebar({
    projects,
    selectedProject,
    onSelectProject,
    onCreateProject,
    onDeleteProject,
    onSelectDocument,
    onDeleteDocument,
    onUploadClick,
    currentFile,
    isOpen,
    onClose,
    onLogout,
    loading,
    recentDocs,
    onOpenRecent,
}) {
    const [newProjectName, setNewProjectName] = useState('')
    const [showNewProject, setShowNewProject] = useState(false)
    const inputRef = useRef(null)

    const handleCreateProject = () => {
        if (newProjectName.trim()) {
            onCreateProject(newProjectName.trim())
            setNewProjectName('')
            setShowNewProject(false)
        }
    }

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') handleCreateProject()
        if (e.key === 'Escape') {
            setShowNewProject(false)
            setNewProjectName('')
        }
    }

    const selectedDocs = selectedProject
        ? projects.find((p) => p.id === selectedProject)?.documents || []
        : []

    return (
        <>
            {/* Mobile backdrop */}
            {isOpen && (
                <div className="sidebar-backdrop md:hidden" onClick={onClose} />
            )}

            <aside className={`sidebar no-print ${isOpen ? 'open' : ''}`}>
                {/* Logo / Brand */}
                <div className="px-5 py-4 border-b border-gray-300 flex items-center justify-between">
                    <div>
                        <h1
                            className="text-xl font-bold tracking-tight"
                            style={{ fontFamily: 'var(--font-doc)' }}
                        >
                            HoSo Reader
                        </h1>
                        <p className="text-xs text-gray-500 mt-0.5">Document Viewer & Print</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="md:hidden p-2 border border-gray-300 cursor-pointer hover:bg-gray-100"
                        aria-label="Đóng menu"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                {/* Upload button */}
                <div className="px-4 py-3">
                    <button
                        onClick={() => { onUploadClick(); onClose?.(); }}
                        className="w-full py-3 px-4 border-2 border-ink text-ink font-semibold text-sm
                       hover:bg-ink hover:text-paper cursor-pointer
                       flex items-center justify-center gap-2"
                        style={{ transition: 'all 0.15s' }}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="17 8 12 3 7 8" />
                            <line x1="12" y1="3" x2="12" y2="15" />
                        </svg>
                        {selectedProject ? 'Tải file vào dự án' : 'Tải file lên'}
                    </button>
                </div>

                {/* Project list */}
                <div className="flex-1 overflow-auto px-4">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Dự án
                        </p>
                        <button
                            onClick={() => {
                                setShowNewProject(true)
                                setTimeout(() => inputRef.current?.focus(), 50)
                            }}
                            className="p-1 text-gray-500 hover:text-ink cursor-pointer border border-transparent hover:border-gray-300"
                            title="Thêm dự án"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                            </svg>
                        </button>
                    </div>

                    {/* New project input */}
                    {showNewProject && (
                        <div className="flex gap-1 mb-2">
                            <input
                                ref={inputRef}
                                type="text"
                                value={newProjectName}
                                onChange={(e) => setNewProjectName(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Tên dự án..."
                                className="flex-1 px-2 py-1.5 text-sm border border-gray-300 outline-none
                           focus:border-ink"
                                style={{ fontFamily: 'var(--font-sans)' }}
                            />
                            <button
                                onClick={handleCreateProject}
                                className="px-2 py-1.5 text-sm border border-ink bg-ink text-paper cursor-pointer"
                            >
                                ✓
                            </button>
                            <button
                                onClick={() => { setShowNewProject(false); setNewProjectName('') }}
                                className="px-2 py-1.5 text-sm border border-gray-300 cursor-pointer hover:bg-gray-100"
                            >
                                ✕
                            </button>
                        </div>
                    )}

                    {/* Projects */}
                    <ul className="space-y-0.5">
                        {projects.map((project) => (
                            <li key={project.id}>
                                {/* Project header */}
                                <div className="group flex items-center">
                                    <button
                                        onClick={() => onSelectProject(project.id === selectedProject ? null : project.id)}
                                        className={`flex-1 text-left px-3 py-2.5 text-sm font-medium
                               cursor-pointer flex items-center gap-2 border border-transparent
                               ${project.id === selectedProject
                                                ? 'bg-ink text-paper'
                                                : 'hover:bg-gray-100 hover:border-gray-300'
                                            }`}
                                    >
                                        <span>{project.id === selectedProject ? '📂' : '📁'}</span>
                                        <span className="truncate">{project.name}</span>
                                        <span className="ml-auto text-xs opacity-60">
                                            {project.documents.length}
                                        </span>
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            if (confirm(`Xóa dự án "${project.name}" và tất cả tài liệu?`)) {
                                                onDeleteProject(project.id)
                                            }
                                        }}
                                        className="p-1.5 text-gray-500 hover:text-red-600 cursor-pointer
                               opacity-0 group-hover:opacity-100 border border-transparent
                               hover:border-gray-300 flex-shrink-0"
                                        title="Xóa dự án"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                        </svg>
                                    </button>
                                </div>

                                {/* Documents in selected project */}
                                {project.id === selectedProject && project.documents.length > 0 && (
                                    <ul className="ml-4 mt-0.5 mb-1 border-l-2 border-gray-200 pl-2">
                                        {project.documents.map((doc) => (
                                            <li key={doc.id} className="group/doc flex items-center">
                                                <button
                                                    onClick={() => {
                                                        onSelectDocument(doc)
                                                        onClose?.()
                                                    }}
                                                    className={`flex-1 text-left px-2 py-1.5 text-xs cursor-pointer
                                     flex items-center gap-1.5 truncate
                                     ${currentFile === doc.fileName
                                                            ? 'font-bold'
                                                            : 'text-gray-700 hover:text-ink hover:bg-gray-50'
                                                        }`}
                                                >
                                                    <span>{doc.type === 'md' ? '📝' : '📄'}</span>
                                                    <span className="truncate">{doc.fileName}</span>
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        onDeleteDocument(project.id, doc.id)
                                                    }}
                                                    className="p-1 text-gray-400 hover:text-red-600 cursor-pointer
                                     opacity-0 group-hover/doc:opacity-100 flex-shrink-0"
                                                    title="Xóa tài liệu"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                                                    </svg>
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </li>
                        ))}
                    </ul>

                    {projects.length === 0 && !showNewProject && (
                        <p className="text-xs text-gray-500 text-center py-6">
                            Chưa có dự án nào.<br />
                            Nhấn + để tạo dự án mới.
                        </p>
                    )}
                </div>

                {/* Recent Documents */}
                {recentDocs && recentDocs.length > 0 && (
                    <div className="px-4 py-3 border-t border-gray-200">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                            Gần đây
                        </p>
                        <ul className="space-y-0.5">
                            {recentDocs.slice(0, 5).map((r) => (
                                <li key={r.id}>
                                    <button
                                        onClick={() => onOpenRecent && onOpenRecent(r)}
                                        className="w-full text-left px-2 py-1.5 text-xs hover:bg-gray-100 cursor-pointer flex items-center gap-2 truncate"
                                    >
                                        <span>{r.type === 'md' ? '📝' : '📄'}</span>
                                        <span className="truncate">{r.fileName}</span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Footer */}
                <div className="px-4 py-3 border-t border-gray-300 flex items-center justify-between">
                    <p className="text-xs text-gray-500">
                        HoSo Reader v1.0 • {projects.length} dự án
                    </p>
                    <button
                        onClick={onLogout}
                        className="text-xs text-red-600 hover:text-red-800 font-medium cursor-pointer"
                    >
                        Đăng xuất
                    </button>
                </div>
            </aside>
        </>
    )
}
