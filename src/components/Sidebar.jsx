import { useState, useRef } from 'react'

/**
 * Sidebar – Modern dark panel with project navigation.
 * Glassmorphism, smooth transitions, accent highlights.
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
    loading,
    recentDocs,
    onOpenRecent,
    currentView,
    onChangeView,
    onSync,
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

    const totalDocs = projects.reduce((sum, p) => sum + (p.documents?.length || 0), 0)

    const s = {
        viewTab: (active) => ({
            flex: 1,
            padding: '10px 0',
            fontSize: '12px',
            fontWeight: active ? 700 : 500,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            background: active ? 'var(--color-accent)' : 'transparent',
            color: active ? 'white' : 'var(--color-text-muted)',
            border: 'none',
            fontFamily: 'var(--font-sans)',
        }),
        uploadBtn: {
            width: '100%',
            padding: '12px 16px',
            border: '1px solid var(--color-accent)',
            background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(129,140,248,0.08))',
            color: 'var(--color-accent-light)',
            fontWeight: 600,
            fontSize: '13px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            borderRadius: '10px',
            transition: 'all 0.2s ease',
            fontFamily: 'var(--font-sans)',
        },
        projectBtn: (active) => ({
            flex: 1,
            textAlign: 'left',
            padding: '10px 12px',
            fontSize: '13px',
            fontWeight: 500,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            border: '1px solid transparent',
            borderRadius: '8px',
            transition: 'all 0.2s ease',
            background: active ? 'linear-gradient(135deg, var(--color-accent), #818cf8)' : 'transparent',
            color: active ? 'white' : 'var(--color-text)',
            fontFamily: 'var(--font-sans)',
        }),
        docBtn: (active) => ({
            flex: 1,
            textAlign: 'left',
            padding: '7px 10px',
            fontSize: '12px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            border: 'none',
            background: 'transparent',
            transition: 'all 0.15s ease',
            fontWeight: active ? 700 : 400,
            color: active ? 'var(--color-accent-light)' : 'var(--color-text-secondary)',
            fontFamily: 'var(--font-sans)',
            borderRadius: '6px',
        }),
    }

    return (
        <>
            {/* Mobile backdrop */}
            {isOpen && (
                <div className="sidebar-backdrop md:hidden" onClick={onClose} />
            )}

            <aside className={`sidebar no-print ${isOpen ? 'open' : ''}`}>
                {/* Logo / Brand */}
                <div style={{
                    padding: '20px',
                    borderBottom: '1px solid var(--color-border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}>
                    <div>
                        <h1 style={{
                            fontSize: '20px',
                            fontWeight: 800,
                            letterSpacing: '-0.02em',
                            fontFamily: 'var(--font-sans)',
                            color: 'var(--color-text)',
                            margin: 0,
                            background: 'linear-gradient(135deg, var(--color-accent), var(--color-accent-light))',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                        }}>
                            HoSo Reader
                        </h1>
                        <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                            Document Viewer & Manager
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="md:hidden"
                        style={{
                            padding: '8px',
                            border: '1px solid var(--color-border)',
                            cursor: 'pointer',
                            background: 'var(--color-surface-2)',
                            color: 'var(--color-text)',
                            borderRadius: '8px',
                        }}
                        aria-label="Đóng menu"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                {/* View Tabs */}
                <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)' }}>
                    {[
                        { key: 'reader', icon: '📖', label: 'Đọc' },
                        { key: 'files', icon: '📂', label: 'File' },
                        { key: 'notes', icon: '📝', label: 'Ghi chú' },
                    ].map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => { onChangeView?.(tab.key); onClose?.() }}
                            style={s.viewTab(currentView === tab.key)}
                        >
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </div>

                {/* Upload button */}
                <div style={{ padding: '12px 16px' }}>
                    <button
                        onClick={() => { onUploadClick(); onClose?.(); }}
                        style={s.uploadBtn}
                        onMouseEnter={e => {
                            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(99,102,241,0.3), rgba(129,140,248,0.15))'
                            e.currentTarget.style.transform = 'translateY(-1px)'
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(129,140,248,0.08))'
                            e.currentTarget.style.transform = 'translateY(0)'
                        }}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="17 8 12 3 7 8" />
                            <line x1="12" y1="3" x2="12" y2="15" />
                        </svg>
                        {selectedProject ? 'Tải file vào dự án' : 'Tải file lên'}
                    </button>
                </div>

                {/* Project list */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                            Dự án
                        </p>
                        <div style={{ display: 'flex', gap: '4px' }}>
                            <button
                                onClick={onSync}
                                style={{
                                    padding: '4px 8px',
                                    background: 'transparent',
                                    border: '1px solid transparent',
                                    color: 'var(--color-text-muted)',
                                    cursor: 'pointer',
                                    borderRadius: '6px',
                                    fontSize: '14px',
                                    opacity: loading ? 0.5 : 1,
                                    transition: 'all 0.15s',
                                }}
                                title="Đồng bộ dữ liệu"
                                onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-surface-3)'; e.currentTarget.style.borderColor = 'var(--color-border)' }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent' }}
                            >
                                🔄
                            </button>
                            <button
                                onClick={() => {
                                    setShowNewProject(true)
                                    setTimeout(() => inputRef.current?.focus(), 50)
                                }}
                                style={{
                                    padding: '4px 8px',
                                    background: 'transparent',
                                    border: '1px solid transparent',
                                    color: 'var(--color-text-muted)',
                                    cursor: 'pointer',
                                    borderRadius: '6px',
                                    transition: 'all 0.15s',
                                }}
                                title="Thêm dự án"
                                onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-surface-3)'; e.currentTarget.style.borderColor = 'var(--color-border)' }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent' }}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* New project input */}
                    {showNewProject && (
                        <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
                            <input
                                ref={inputRef}
                                type="text"
                                value={newProjectName}
                                onChange={(e) => setNewProjectName(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Tên dự án..."
                                style={{
                                    flex: 1,
                                    padding: '8px 10px',
                                    fontSize: '13px',
                                    border: '1px solid var(--color-border)',
                                    outline: 'none',
                                    background: 'var(--color-surface-2)',
                                    color: 'var(--color-text)',
                                    borderRadius: '8px',
                                    fontFamily: 'var(--font-sans)',
                                }}
                            />
                            <button onClick={handleCreateProject} style={{
                                padding: '8px 12px', fontSize: '13px', border: 'none',
                                background: 'var(--color-accent)', color: 'white', cursor: 'pointer', borderRadius: '8px',
                            }}>✓</button>
                            <button onClick={() => { setShowNewProject(false); setNewProjectName('') }} style={{
                                padding: '8px 12px', fontSize: '13px', border: '1px solid var(--color-border)',
                                background: 'transparent', color: 'var(--color-text-muted)', cursor: 'pointer', borderRadius: '8px',
                            }}>✕</button>
                        </div>
                    )}

                    {/* Projects */}
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        {projects.map((project) => (
                            <li key={project.id}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                                    <button
                                        onClick={() => onSelectProject(project.id === selectedProject ? null : project.id)}
                                        style={s.projectBtn(project.id === selectedProject)}
                                        onMouseEnter={e => {
                                            if (project.id !== selectedProject) {
                                                e.currentTarget.style.background = 'var(--color-surface-3)'
                                                e.currentTarget.style.borderColor = 'var(--color-border)'
                                            }
                                        }}
                                        onMouseLeave={e => {
                                            if (project.id !== selectedProject) {
                                                e.currentTarget.style.background = 'transparent'
                                                e.currentTarget.style.borderColor = 'transparent'
                                            }
                                        }}
                                    >
                                        <span>{project.id === selectedProject ? '📂' : '📁'}</span>
                                        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{project.name}</span>
                                        <span style={{ fontSize: '11px', opacity: 0.5 }}>{project.documents?.length || 0}</span>
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            if (confirm(`Xóa dự án "${project.name}" và tất cả tài liệu?`)) {
                                                onDeleteProject(project.id)
                                            }
                                        }}
                                        style={{
                                            padding: '6px',
                                            background: 'transparent',
                                            border: 'none',
                                            color: 'var(--color-text-muted)',
                                            cursor: 'pointer',
                                            borderRadius: '6px',
                                            opacity: 0,
                                            transition: 'opacity 0.15s',
                                            flexShrink: 0,
                                        }}
                                        title="Xóa dự án"
                                        className="group-hover-show"
                                        onMouseEnter={e => { e.currentTarget.style.opacity = 1; e.currentTarget.style.color = 'var(--color-danger)' }}
                                        onMouseLeave={e => { e.currentTarget.style.opacity = 0; e.currentTarget.style.color = 'var(--color-text-muted)' }}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                        </svg>
                                    </button>
                                </div>

                                {/* Documents in selected project */}
                                {project.id === selectedProject && project.documents?.length > 0 && (
                                    <ul style={{
                                        listStyle: 'none',
                                        margin: '4px 0 4px 20px',
                                        padding: '0 0 0 12px',
                                        borderLeft: '2px solid var(--color-border)',
                                    }}>
                                        {project.documents.map((doc) => (
                                            <li key={doc.id} style={{ display: 'flex', alignItems: 'center' }}>
                                                <button
                                                    onClick={() => { onSelectDocument(doc); onClose?.() }}
                                                    style={s.docBtn(currentFile === doc.fileName)}
                                                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-surface-3)' }}
                                                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                                                >
                                                    <span>{doc.type === 'md' ? '📝' : doc.type === 'html' ? '🌐' : '📄'}</span>
                                                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.fileName}</span>
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); onDeleteDocument(project.id, doc.id) }}
                                                    style={{
                                                        padding: '4px',
                                                        background: 'transparent',
                                                        border: 'none',
                                                        color: 'var(--color-text-muted)',
                                                        cursor: 'pointer',
                                                        borderRadius: '4px',
                                                        opacity: 0,
                                                        transition: 'opacity 0.15s',
                                                        flexShrink: 0,
                                                    }}
                                                    title="Xóa tài liệu"
                                                    onMouseEnter={e => { e.currentTarget.style.opacity = 1; e.currentTarget.style.color = 'var(--color-danger)' }}
                                                    onMouseLeave={e => { e.currentTarget.style.opacity = 0; e.currentTarget.style.color = 'var(--color-text-muted)' }}
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
                        <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', textAlign: 'center', padding: '32px 0' }}>
                            Chưa có dự án nào.<br />
                            Nhấn + để tạo dự án mới.
                        </p>
                    )}
                </div>

                {/* Recent Documents */}
                {recentDocs && recentDocs.length > 0 && (
                    <div style={{ padding: '12px 16px', borderTop: '1px solid var(--color-border)' }}>
                        <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
                            Gần đây
                        </p>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            {recentDocs.slice(0, 5).map((r) => (
                                <li key={r.id}>
                                    <button
                                        onClick={() => onOpenRecent && onOpenRecent(r)}
                                        style={{
                                            width: '100%',
                                            textAlign: 'left',
                                            padding: '7px 10px',
                                            fontSize: '12px',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            border: 'none',
                                            background: 'transparent',
                                            color: 'var(--color-text-secondary)',
                                            borderRadius: '6px',
                                            transition: 'all 0.15s',
                                            fontFamily: 'var(--font-sans)',
                                        }}
                                        onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-surface-3)' }}
                                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                                    >
                                        <span>{r.type === 'md' ? '📝' : r.type === 'html' ? '🌐' : '📄'}</span>
                                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.fileName}</span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Footer */}
                <div style={{ padding: '12px 16px', borderTop: '1px solid var(--color-border)' }}>
                    <p style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                        HoSo Reader v3.0 • {projects.length} dự án • {totalDocs} file
                    </p>
                </div>
            </aside>
        </>
    )
}
