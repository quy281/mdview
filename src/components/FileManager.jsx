import { useState } from 'react'

/**
 * FileManager – Modern dark card grid view of all documents.
 */
export default function FileManager({
    projects,
    onSelectDocument,
    onDeleteDocument,
    onExportHtml,
}) {
    const [search, setSearch] = useState('')
    const [filterProject, setFilterProject] = useState('')

    const allDocs = projects.flatMap((p) =>
        (p.documents || []).map((d) => ({
            ...d,
            projectId: p.id,
            projectName: p.name,
        }))
    )

    const filtered = allDocs.filter((d) => {
        if (search && !d.fileName.toLowerCase().includes(search.toLowerCase())) return false
        if (filterProject && d.projectId !== filterProject) return false
        return true
    })

    filtered.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))

    const getTypeIcon = (type) => {
        switch (type) {
            case 'md': return '📝'
            case 'docx': return '📄'
            case 'html': return '🌐'
            default: return '📃'
        }
    }

    const getTypeLabel = (type) => {
        switch (type) {
            case 'md': return 'Markdown'
            case 'docx': return 'Word'
            case 'html': return 'HTML'
            default: return type
        }
    }

    const getTypeGradient = (type) => {
        switch (type) {
            case 'md': return 'linear-gradient(135deg, #6366f1, #818cf8)'
            case 'docx': return 'linear-gradient(135deg, #3b82f6, #60a5fa)'
            case 'html': return 'linear-gradient(135deg, #f59e0b, #fbbf24)'
            default: return 'linear-gradient(135deg, #6b7280, #9ca3af)'
        }
    }

    const generateThumbnail = (doc) => {
        let preview = ''
        if (doc.type === 'md') {
            preview = doc.content
                ?.replace(/#{1,6}\s/g, '')
                ?.replace(/\*\*/g, '')
                ?.replace(/[*_~`]/g, '')
                ?.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
                ?.slice(0, 200) || ''
        } else {
            preview = doc.content
                ?.replace(/<[^>]+>/g, '')
                ?.replace(/&[a-z]+;/gi, ' ')
                ?.slice(0, 200) || ''
        }
        return preview
    }

    const s = {
        input: {
            flex: 1,
            minWidth: '200px',
            padding: '10px 14px',
            fontSize: '13px',
            border: '1px solid var(--color-border)',
            outline: 'none',
            background: 'var(--color-surface)',
            color: 'var(--color-text)',
            borderRadius: '10px',
            fontFamily: 'var(--font-sans)',
        },
        select: {
            padding: '10px 14px',
            fontSize: '13px',
            border: '1px solid var(--color-border)',
            outline: 'none',
            background: 'var(--color-surface)',
            color: 'var(--color-text)',
            cursor: 'pointer',
            borderRadius: '10px',
            fontFamily: 'var(--font-sans)',
        },
        card: {
            border: '1px solid var(--color-border)',
            background: 'var(--color-surface)',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            borderRadius: '12px',
            overflow: 'hidden',
            transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        },
        actionBtn: {
            padding: '6px 10px',
            fontSize: '12px',
            border: '1px solid var(--color-border)',
            background: 'var(--color-surface-2)',
            color: 'var(--color-text-secondary)',
            cursor: 'pointer',
            borderRadius: '6px',
            transition: 'all 0.15s',
        },
    }

    return (
        <div style={{ width: '100%', maxWidth: '900px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <h2 style={{
                    fontSize: '18px',
                    fontWeight: 700,
                    letterSpacing: '-0.01em',
                    fontFamily: 'var(--font-sans)',
                    color: 'var(--color-text)',
                    margin: 0,
                }}>
                    📂 Quản lý tài liệu
                </h2>
                <span style={{
                    fontSize: '12px',
                    color: 'var(--color-text-muted)',
                    background: 'var(--color-surface-2)',
                    padding: '4px 10px',
                    borderRadius: '12px',
                }}>
                    {filtered.length} file
                </span>
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="🔍 Tìm file..."
                    style={s.input}
                />
                <select
                    value={filterProject}
                    onChange={(e) => setFilterProject(e.target.value)}
                    style={s.select}
                >
                    <option value="">Tất cả dự án</option>
                    {projects.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                </select>
            </div>

            {/* Grid */}
            {filtered.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '64px 0', color: 'var(--color-text-muted)' }}>
                    <p style={{ fontSize: '48px', marginBottom: '12px' }}>📭</p>
                    <p style={{ fontSize: '14px' }}>Chưa có tài liệu nào</p>
                </div>
            ) : (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                    gap: '12px',
                }}>
                    {filtered.map((doc) => (
                        <div
                            key={doc.id}
                            style={s.card}
                            onClick={() => onSelectDocument(doc, doc.projectId, doc.projectName)}
                            onMouseEnter={e => {
                                e.currentTarget.style.borderColor = 'var(--color-accent)'
                                e.currentTarget.style.transform = 'translateY(-2px)'
                                e.currentTarget.style.boxShadow = '0 8px 24px rgba(99, 102, 241, 0.15)'
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.borderColor = 'var(--color-border)'
                                e.currentTarget.style.transform = 'translateY(0)'
                                e.currentTarget.style.boxShadow = 'none'
                            }}
                        >
                            {/* Thumbnail preview */}
                            <div style={{
                                position: 'relative',
                                height: '120px',
                                overflow: 'hidden',
                                borderBottom: '1px solid var(--color-border)',
                                background: 'var(--color-surface-2)',
                                padding: '12px',
                            }}>
                                <div style={{
                                    fontSize: '10px',
                                    color: 'var(--color-text-muted)',
                                    lineHeight: '1.5',
                                    overflow: 'hidden',
                                    display: '-webkit-box',
                                    WebkitLineClamp: 7,
                                    WebkitBoxOrient: 'vertical',
                                    fontFamily: 'var(--font-doc)',
                                }}>
                                    {generateThumbnail(doc)}
                                </div>
                                {/* Type badge */}
                                <span style={{
                                    position: 'absolute',
                                    top: '8px',
                                    right: '8px',
                                    color: 'white',
                                    fontSize: '10px',
                                    padding: '3px 8px',
                                    fontWeight: 600,
                                    borderRadius: '6px',
                                    background: getTypeGradient(doc.type),
                                }}>
                                    {getTypeLabel(doc.type)}
                                </span>
                            </div>

                            {/* Info */}
                            <div style={{ padding: '12px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                                    <span style={{ fontSize: '18px', flexShrink: 0 }}>{getTypeIcon(doc.type)}</span>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <p style={{
                                            fontSize: '13px',
                                            fontWeight: 600,
                                            color: 'var(--color-text)',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                            margin: 0,
                                        }}>{doc.fileName}</p>
                                        <p style={{
                                            fontSize: '11px',
                                            color: 'var(--color-text-muted)',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                            margin: '2px 0 0',
                                        }}>📂 {doc.projectName}</p>
                                    </div>
                                </div>

                                {/* Date + Actions */}
                                <div style={{
                                    marginTop: 'auto',
                                    paddingTop: '10px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                }}>
                                    <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                                        {doc.createdAt ? new Date(doc.createdAt).toLocaleDateString('vi-VN') : ''}
                                    </span>
                                    <div style={{ display: 'flex', gap: '4px' }}>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onExportHtml?.(doc) }}
                                            style={s.actionBtn}
                                            title="Xuất HTML"
                                            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-accent)'; e.currentTarget.style.color = 'var(--color-accent-light)' }}
                                            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.color = 'var(--color-text-secondary)' }}
                                        >⬇</button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                if (confirm(`Xóa "${doc.fileName}"?`)) {
                                                    onDeleteDocument(doc.projectId, doc.id)
                                                }
                                            }}
                                            style={s.actionBtn}
                                            title="Xóa"
                                            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-danger)'; e.currentTarget.style.color = 'var(--color-danger)' }}
                                            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.color = 'var(--color-text-secondary)' }}
                                        >🗑</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
