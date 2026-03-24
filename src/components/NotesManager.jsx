import { useState, useEffect, useCallback } from 'react'
import { getAllAnnotations, deleteAnnotation, updateAnnotation } from '../store/projectStore'

/**
 * NotesManager – Dark themed annotation management panel.
 */
export default function NotesManager({ projects, onJumpToDocument }) {
    const [annotations, setAnnotations] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [filterType, setFilterType] = useState('')
    const [editingId, setEditingId] = useState(null)
    const [editNote, setEditNote] = useState('')
    const [editColor, setEditColor] = useState('')

    const COLORS = [
        { name: 'Vàng', value: '#fde047' },
        { name: 'Xanh', value: '#86efac' },
        { name: 'Hồng', value: '#fda4af' },
        { name: 'Xanh dương', value: '#93c5fd' },
        { name: 'Cam', value: '#fdba74' },
    ]

    const loadAnnotations = useCallback(async () => {
        setLoading(true)
        try {
            const data = await getAllAnnotations()
            const enriched = data.map(a => {
                let docName = a.fileName || ''
                let projName = ''
                for (const p of projects) {
                    const doc = p.documents?.find(d => d.id === a.document_id)
                    if (doc) {
                        docName = doc.fileName
                        projName = p.name
                        break
                    }
                }
                return { ...a, docName, projName }
            })
            setAnnotations(enriched)
        } catch (err) {
            console.error('Load annotations failed:', err)
        } finally {
            setLoading(false)
        }
    }, [projects])

    useEffect(() => {
        loadAnnotations()
    }, [loadAnnotations])

    const filtered = annotations.filter(a => {
        if (filterType && a.type !== filterType) return false
        if (search) {
            const q = search.toLowerCase()
            const matchText = (a.text || '').toLowerCase().includes(q)
            const matchNote = (a.note || '').toLowerCase().includes(q)
            const matchDoc = (a.docName || '').toLowerCase().includes(q)
            if (!matchText && !matchNote && !matchDoc) return false
        }
        return true
    })

    const handleDelete = useCallback(async (id) => {
        if (!confirm('Xóa ghi chú này?')) return
        await deleteAnnotation(id)
        setAnnotations(prev => prev.filter(a => a.id !== id))
    }, [])

    const handleStartEdit = useCallback((ann) => {
        setEditingId(ann.id)
        setEditNote(ann.note || '')
        setEditColor(ann.color || '#fde047')
    }, [])

    const handleSaveEdit = useCallback(async () => {
        if (!editingId) return
        await updateAnnotation(editingId, { note: editNote, color: editColor })
        setAnnotations(prev => prev.map(a =>
            a.id === editingId ? { ...a, note: editNote, color: editColor } : a
        ))
        setEditingId(null)
        setEditNote('')
    }, [editingId, editNote, editColor])

    const handleBulkDelete = useCallback(async () => {
        if (!confirm(`Xóa tất cả ${filtered.length} ghi chú đang hiển thị?`)) return
        for (const a of filtered) {
            await deleteAnnotation(a.id)
        }
        setAnnotations(prev => prev.filter(a => !filtered.find(f => f.id === a.id)))
    }, [filtered])

    const getTypeIcon = (type) => {
        switch (type) {
            case 'highlight': return '🖍️'
            case 'drawing': return '✏️'
            case 'note': return '📝'
            default: return '📌'
        }
    }

    const getTypeLabel = (type) => {
        switch (type) {
            case 'highlight': return 'Highlight'
            case 'drawing': return 'Vẽ tay'
            case 'note': return 'Ghi chú'
            default: return type
        }
    }

    const inputStyle = {
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
    }

    const selectStyle = {
        padding: '10px 14px',
        fontSize: '13px',
        border: '1px solid var(--color-border)',
        outline: 'none',
        background: 'var(--color-surface)',
        color: 'var(--color-text)',
        cursor: 'pointer',
        borderRadius: '10px',
        fontFamily: 'var(--font-sans)',
    }

    const actionBtnStyle = {
        padding: '6px 10px',
        fontSize: '12px',
        border: '1px solid var(--color-border)',
        background: 'var(--color-surface-2)',
        color: 'var(--color-text-secondary)',
        cursor: 'pointer',
        borderRadius: '6px',
        transition: 'all 0.15s',
    }

    return (
        <div style={{ width: '100%', maxWidth: '900px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 700, letterSpacing: '-0.01em', fontFamily: 'var(--font-sans)', color: 'var(--color-text)', margin: 0 }}>
                    📝 Quản lý ghi chú
                </h2>
                <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', background: 'var(--color-surface-2)', padding: '4px 10px', borderRadius: '12px' }}>
                    {filtered.length} mục
                </span>
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="🔍 Tìm ghi chú..."
                    style={inputStyle}
                />
                <select value={filterType} onChange={(e) => setFilterType(e.target.value)} style={selectStyle}>
                    <option value="">Tất cả loại</option>
                    <option value="highlight">🖍️ Highlight</option>
                    <option value="drawing">✏️ Vẽ tay</option>
                    <option value="note">📝 Ghi chú</option>
                </select>
                {filtered.length > 0 && (
                    <button
                        onClick={handleBulkDelete}
                        style={{
                            padding: '10px 14px',
                            fontSize: '13px',
                            fontWeight: 500,
                            border: '1px solid var(--color-danger)',
                            color: 'var(--color-danger)',
                            background: 'transparent',
                            cursor: 'pointer',
                            borderRadius: '10px',
                            transition: 'all 0.15s',
                        }}
                    >🗑 Xóa tất cả</button>
                )}
            </div>

            {/* List */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: '64px 0', color: 'var(--color-text-muted)' }}>
                    <p style={{ fontSize: '14px' }}>Đang tải ghi chú...</p>
                </div>
            ) : filtered.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '64px 0', color: 'var(--color-text-muted)' }}>
                    <p style={{ fontSize: '48px', marginBottom: '12px' }}>📭</p>
                    <p style={{ fontSize: '14px' }}>Chưa có ghi chú nào</p>
                    <p style={{ fontSize: '12px', marginTop: '4px', color: 'var(--color-text-muted)' }}>Mở tài liệu → bật Ghi chú → chọn text để highlight hoặc vẽ tay</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {filtered.map((ann) => (
                        <div
                            key={ann.id}
                            style={{
                                border: '1px solid var(--color-border)',
                                background: 'var(--color-surface)',
                                padding: '12px',
                                borderRadius: '10px',
                                transition: 'border-color 0.2s',
                            }}
                            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--color-border-light)'}
                            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--color-border)'}
                        >
                            {editingId === ann.id ? (
                                /* Edit mode */
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)' }}>Màu:</span>
                                        {COLORS.map((c) => (
                                            <button
                                                key={c.value}
                                                onClick={() => setEditColor(c.value)}
                                                style={{
                                                    width: '24px',
                                                    height: '24px',
                                                    border: editColor === c.value ? '2px solid var(--color-text)' : '2px solid transparent',
                                                    borderRadius: '6px',
                                                    backgroundColor: c.value,
                                                    cursor: 'pointer',
                                                }}
                                            />
                                        ))}
                                    </div>
                                    <input
                                        type="text"
                                        value={editNote}
                                        onChange={(e) => setEditNote(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}
                                        placeholder="Nội dung ghi chú..."
                                        style={{
                                            ...inputStyle,
                                            minWidth: 'auto',
                                            width: '100%',
                                        }}
                                        autoFocus
                                    />
                                    <div style={{ display: 'flex', gap: '6px' }}>
                                        <button
                                            onClick={handleSaveEdit}
                                            style={{
                                                padding: '7px 14px',
                                                fontSize: '12px',
                                                background: 'var(--color-accent)',
                                                color: 'white',
                                                border: 'none',
                                                cursor: 'pointer',
                                                borderRadius: '8px',
                                            }}
                                        >✓ Lưu</button>
                                        <button
                                            onClick={() => setEditingId(null)}
                                            style={{
                                                padding: '7px 14px',
                                                fontSize: '12px',
                                                border: '1px solid var(--color-border)',
                                                background: 'transparent',
                                                color: 'var(--color-text-muted)',
                                                cursor: 'pointer',
                                                borderRadius: '8px',
                                            }}
                                        >Hủy</button>
                                    </div>
                                </div>
                            ) : (
                                /* View mode */
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                                    {/* Color indicator */}
                                    <div style={{
                                        width: '3px',
                                        alignSelf: 'stretch',
                                        flexShrink: 0,
                                        borderRadius: '3px',
                                        backgroundColor: ann.color || '#fde047',
                                    }} />

                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        {/* Header row */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px', flexWrap: 'wrap' }}>
                                            <span>{getTypeIcon(ann.type)}</span>
                                            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text)' }}>
                                                {getTypeLabel(ann.type)}
                                            </span>
                                            <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>•</span>
                                            <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {ann.docName || 'Không rõ'}
                                            </span>
                                            {ann.projName && (
                                                <>
                                                    <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>•</span>
                                                    <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                        📂 {ann.projName}
                                                    </span>
                                                </>
                                            )}
                                        </div>

                                        {/* Text content */}
                                        {ann.text && (
                                            <p style={{
                                                fontSize: '13px',
                                                padding: '6px 10px',
                                                marginBottom: '4px',
                                                borderRadius: '6px',
                                                backgroundColor: (ann.color || '#fde047') + '25',
                                                color: 'var(--color-text)',
                                                margin: '0 0 4px',
                                            }}>
                                                "{ann.text}"
                                            </p>
                                        )}

                                        {/* Note */}
                                        {ann.note && (
                                            <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', fontStyle: 'italic', margin: '0 0 2px' }}>
                                                💬 {ann.note}
                                            </p>
                                        )}

                                        {/* Date */}
                                        <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '4px', margin: '4px 0 0' }}>
                                            {ann.createdAt ? new Date(ann.createdAt).toLocaleString('vi-VN') : ''}
                                        </p>
                                    </div>

                                    {/* Actions */}
                                    <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                                        {ann.document_id && (
                                            <button
                                                onClick={() => onJumpToDocument?.(ann.document_id, ann.project_id, ann.scrollPosition)}
                                                style={actionBtnStyle}
                                                title={ann.scrollPosition ? `Mở tài liệu (vị trí ${Math.round(ann.scrollPosition)}px)` : 'Mở tài liệu'}
                                                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-accent)'; e.currentTarget.style.color = 'var(--color-accent-light)' }}
                                                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.color = 'var(--color-text-secondary)' }}
                                            >📄</button>
                                        )}
                                        <button
                                            onClick={() => handleStartEdit(ann)}
                                            style={actionBtnStyle}
                                            title="Sửa"
                                            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-accent)'; e.currentTarget.style.color = 'var(--color-accent-light)' }}
                                            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.color = 'var(--color-text-secondary)' }}
                                        >✏️</button>
                                        <button
                                            onClick={() => handleDelete(ann.id)}
                                            style={actionBtnStyle}
                                            title="Xóa"
                                            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-danger)'; e.currentTarget.style.color = 'var(--color-danger)' }}
                                            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.color = 'var(--color-text-secondary)' }}
                                        >🗑</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
