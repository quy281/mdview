import { useState, useRef } from 'react'

/**
 * BottomNav – Modern dark glass mobile bottom navigation.
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
    annotationMode,
    onSetAnnotationMode,
    onPrint,
    onSaveHtml,
    hasDocument,
    recentDocs,
    onOpenRecent,
    currentView,
    onChangeView,
    onSync,
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

    const s = {
        panel: {
            position: 'fixed',
            bottom: '56px',
            left: 0,
            right: 0,
            zIndex: 50,
            background: 'var(--color-surface)',
            borderTop: '1px solid var(--color-border)',
            maxHeight: '60vh',
            overflowY: 'auto',
        },
        navBtn: (active) => ({
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '2px',
            fontSize: '10px',
            cursor: 'pointer',
            color: active ? 'var(--color-accent-light)' : 'var(--color-text-muted)',
            fontWeight: active ? 700 : 400,
            background: 'transparent',
            border: 'none',
            fontFamily: 'var(--font-sans)',
            transition: 'color 0.15s',
            position: 'relative',
        }),
        projectBtn: (active) => ({
            flex: 1,
            textAlign: 'left',
            padding: '12px',
            fontSize: '13px',
            fontWeight: 500,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            border: '1px solid ' + (active ? 'var(--color-accent)' : 'var(--color-border)'),
            borderRadius: '10px',
            background: active ? 'linear-gradient(135deg, var(--color-accent), #818cf8)' : 'var(--color-surface-2)',
            color: active ? 'white' : 'var(--color-text)',
            fontFamily: 'var(--font-sans)',
        }),
        toolBtn: (active) => ({
            width: '100%',
            padding: '14px 16px',
            fontSize: '13px',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            border: '1px solid ' + (active ? 'var(--color-accent)' : 'var(--color-border)'),
            borderRadius: '10px',
            cursor: 'pointer',
            background: active ? 'var(--color-accent)' : 'var(--color-surface-2)',
            color: active ? 'white' : 'var(--color-text)',
            fontFamily: 'var(--font-sans)',
            opacity: 1,
        }),
    }

    return (
        <div className="md:hidden no-print">
            {/* Slide-up panel */}
            {showPanel && (
                <>
                    <div
                        style={{
                            position: 'fixed',
                            inset: 0,
                            background: 'rgba(0,0,0,0.2)',
                            backdropFilter: 'blur(4px)',
                            zIndex: 40,
                        }}
                        onClick={() => setShowPanel(false)}
                    />
                    <div style={s.panel}>
                        {/* Projects tab panel */}
                        {activeTab === 'projects' && (
                            <div style={{ padding: '16px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                                    <p style={{ fontSize: '14px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text)' }}>Dự án</p>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button
                                            onClick={onSync}
                                            style={{
                                                padding: '8px 14px',
                                                fontSize: '13px',
                                                border: '1px solid var(--color-border)',
                                                background: 'var(--color-surface-2)',
                                                color: 'var(--color-text)',
                                                cursor: 'pointer',
                                                borderRadius: '8px',
                                            }}
                                        >🔄 Sync</button>
                                        <button
                                            onClick={() => {
                                                setShowNewProject(true)
                                                setTimeout(() => inputRef.current?.focus(), 50)
                                            }}
                                            style={{
                                                padding: '8px 14px',
                                                fontSize: '13px',
                                                border: 'none',
                                                background: 'var(--color-accent)',
                                                color: 'white',
                                                cursor: 'pointer',
                                                borderRadius: '8px',
                                            }}
                                        >+ Thêm</button>
                                    </div>
                                </div>

                                {showNewProject && (
                                    <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
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
                                            style={{
                                                flex: 1,
                                                padding: '10px 14px',
                                                fontSize: '13px',
                                                border: '1px solid var(--color-border)',
                                                borderRadius: '8px',
                                                outline: 'none',
                                                background: 'var(--color-surface-2)',
                                                color: 'var(--color-text)',
                                                fontFamily: 'var(--font-sans)',
                                            }}
                                        />
                                        <button onClick={handleCreateProject} style={{ padding: '10px 14px', fontSize: '13px', background: 'var(--color-accent)', color: 'white', border: 'none', cursor: 'pointer', borderRadius: '8px' }}>✓</button>
                                        <button onClick={() => { setShowNewProject(false); setNewProjectName('') }} style={{ padding: '10px 14px', fontSize: '13px', border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-text-muted)', cursor: 'pointer', borderRadius: '8px' }}>✕</button>
                                    </div>
                                )}

                                {projects.length === 0 && !showNewProject && (
                                    <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', textAlign: 'center', padding: '32px 0' }}>Chưa có dự án. Nhấn "+ Thêm" để tạo.</p>
                                )}

                                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    {projects.map((project) => (
                                        <li key={project.id}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <button
                                                    onClick={() => onSelectProject(project.id === selectedProject ? null : project.id)}
                                                    style={s.projectBtn(project.id === selectedProject)}
                                                >
                                                    <span>{project.id === selectedProject ? '📂' : '📁'}</span>
                                                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{project.name}</span>
                                                    <span style={{ fontSize: '11px', opacity: 0.6 }}>{project.documents?.length || 0}</span>
                                                </button>
                                                <button
                                                    onClick={() => { if (confirm(`Xóa "${project.name}"?`)) onDeleteProject(project.id) }}
                                                    style={{
                                                        padding: '10px',
                                                        background: 'transparent',
                                                        border: '1px solid var(--color-border)',
                                                        color: 'var(--color-text-muted)',
                                                        cursor: 'pointer',
                                                        borderRadius: '8px',
                                                    }}
                                                >🗑️</button>
                                            </div>

                                            {project.id === selectedProject && project.documents?.length > 0 && (
                                                <ul style={{
                                                    listStyle: 'none',
                                                    margin: '6px 0 6px 16px',
                                                    padding: '0 0 0 12px',
                                                    borderLeft: '2px solid var(--color-border)',
                                                }}>
                                                    {project.documents.map((doc) => (
                                                        <li key={doc.id} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                            <button
                                                                onClick={() => {
                                                                    onSelectDocument(doc)
                                                                    setShowPanel(false)
                                                                    setActiveTab('doc')
                                                                    onChangeView?.('reader')
                                                                }}
                                                                style={{
                                                                    flex: 1,
                                                                    textAlign: 'left',
                                                                    padding: '10px 8px',
                                                                    fontSize: '13px',
                                                                    cursor: 'pointer',
                                                                    border: 'none',
                                                                    background: 'transparent',
                                                                    overflow: 'hidden',
                                                                    textOverflow: 'ellipsis',
                                                                    whiteSpace: 'nowrap',
                                                                    fontWeight: currentFile === doc.fileName ? 700 : 400,
                                                                    color: currentFile === doc.fileName ? 'var(--color-accent-light)' : 'var(--color-text-secondary)',
                                                                    fontFamily: 'var(--font-sans)',
                                                                }}
                                                            >
                                                                {doc.type === 'md' ? '📝' : doc.type === 'html' ? '🌐' : '📄'} {doc.fileName}
                                                            </button>
                                                            <button
                                                                onClick={() => onDeleteDocument(project.id, doc.id)}
                                                                style={{
                                                                    padding: '6px',
                                                                    background: 'transparent',
                                                                    border: 'none',
                                                                    color: 'var(--color-text-muted)',
                                                                    cursor: 'pointer',
                                                                    fontSize: '12px',
                                                                }}
                                                            >✕</button>
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
                            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <p style={{ fontSize: '14px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text)', marginBottom: '4px' }}>Công cụ</p>

                                <button
                                    onClick={() => { onSetAnnotationMode(annotationMode === 'highlight' ? 'off' : 'highlight'); setShowPanel(false); }}
                                    disabled={!hasDocument}
                                    style={{ ...s.toolBtn(annotationMode === 'highlight'), opacity: hasDocument ? 1 : 0.3 }}
                                >🖍️ {annotationMode === 'highlight' ? 'Tắt highlight' : 'Bật highlight'}</button>

                                <button
                                    onClick={() => { onPrint(); setShowPanel(false); }}
                                    disabled={!hasDocument}
                                    style={{ ...s.toolBtn(false), opacity: hasDocument ? 1 : 0.3 }}
                                >🖨️ In PDF</button>

                                <button
                                    onClick={() => { onSaveHtml(); setShowPanel(false); }}
                                    disabled={!hasDocument}
                                    style={{ ...s.toolBtn(false), opacity: hasDocument ? 1 : 0.3 }}
                                >💾 Lưu HTML</button>
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* Bottom tab bar */}
            <nav style={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                zIndex: 50,
                background: 'var(--color-surface)',
                borderTop: '1px solid var(--color-border)',
                display: 'flex',
                alignItems: 'stretch',
                height: '56px',
                backdropFilter: 'blur(12px)',
            }}>
                {hasDocument ? (
                    <button onClick={() => handleTabClick('focus')} style={s.navBtn(currentView === 'focus')}>
                        <span style={{ fontSize: '20px' }}>📖</span>
                        <span>Đọc</span>
                        {currentView === 'focus' && <div style={{ position: 'absolute', top: 0, left: '25%', right: '25%', height: '2px', background: 'var(--color-accent)', borderRadius: '0 0 2px 2px' }} />}
                    </button>
                ) : (
                    <button onClick={() => { onUploadClick(); setShowPanel(false); setActiveTab('doc'); }} style={s.navBtn(false)}>
                        <span style={{ fontSize: '18px' }}>⬆️</span>
                        <span>Tải lên</span>
                    </button>
                )}

                <button onClick={() => handleTabClick('doc')} style={s.navBtn(currentView === 'reader' && !showPanel)}>
                    <span style={{ fontSize: '18px' }}>📄</span>
                    <span>Tài liệu</span>
                    {currentView === 'reader' && !showPanel && <div style={{ position: 'absolute', top: 0, left: '25%', right: '25%', height: '2px', background: 'var(--color-accent)', borderRadius: '0 0 2px 2px' }} />}
                </button>

                <button onClick={() => handleTabClick('projects')} style={s.navBtn(activeTab === 'projects' && showPanel)}>
                    <span style={{ fontSize: '18px' }}>📁</span>
                    <span>Dự án</span>
                    {activeTab === 'projects' && showPanel && <div style={{ position: 'absolute', top: 0, left: '25%', right: '25%', height: '2px', background: 'var(--color-accent)', borderRadius: '0 0 2px 2px' }} />}
                </button>

                <button onClick={() => handleTabClick('files')} style={s.navBtn(currentView === 'files')}>
                    <span style={{ fontSize: '18px' }}>📂</span>
                    <span>File</span>
                    {currentView === 'files' && <div style={{ position: 'absolute', top: 0, left: '25%', right: '25%', height: '2px', background: 'var(--color-accent)', borderRadius: '0 0 2px 2px' }} />}
                </button>

                <button onClick={() => handleTabClick('notes')} style={s.navBtn(currentView === 'notes')}>
                    <span style={{ fontSize: '18px' }}>📝</span>
                    <span>Ghi chú</span>
                    {currentView === 'notes' && <div style={{ position: 'absolute', top: 0, left: '25%', right: '25%', height: '2px', background: 'var(--color-accent)', borderRadius: '0 0 2px 2px' }} />}
                </button>
            </nav>
        </div>
    )
}
