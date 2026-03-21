import { useState, useEffect, useCallback } from 'react'
import { getAllAnnotations, deleteAnnotation, updateAnnotation } from '../store/projectStore'

/**
 * NotesManager – Full CRUD panel for all annotations (highlights, drawings, text notes).
 * List view with search, filter, edit, and delete capabilities.
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
            // Enrich with document/project info
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

    return (
        <div className="w-full max-w-[900px] mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold tracking-tight" style={{ fontFamily: 'var(--font-sans)' }}>
                    📝 Quản lý ghi chú
                </h2>
                <span className="text-xs text-gray-500">{filtered.length} mục</span>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2 mb-4">
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="🔍 Tìm ghi chú..."
                    className="flex-1 min-w-[200px] px-3 py-2 text-sm border border-gray-300 outline-none focus:border-gray-800"
                />
                <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="px-3 py-2 text-sm border border-gray-300 outline-none focus:border-gray-800 bg-white cursor-pointer"
                >
                    <option value="">Tất cả loại</option>
                    <option value="highlight">🖍️ Highlight</option>
                    <option value="drawing">✏️ Vẽ tay</option>
                    <option value="note">📝 Ghi chú</option>
                </select>
                {filtered.length > 0 && (
                    <button
                        onClick={handleBulkDelete}
                        className="px-3 py-2 text-sm font-medium border border-red-300 text-red-600 hover:bg-red-600 hover:text-white hover:border-red-600 cursor-pointer transition-colors"
                    >
                        🗑 Xóa tất cả
                    </button>
                )}
            </div>

            {/* List */}
            {loading ? (
                <div className="text-center py-16 text-gray-400">
                    <p className="text-sm">Đang tải ghi chú...</p>
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                    <p className="text-4xl mb-3">📭</p>
                    <p className="text-sm">Chưa có ghi chú nào</p>
                    <p className="text-xs mt-1 text-gray-300">Mở tài liệu → bật Ghi chú → chọn text để highlight hoặc vẽ tay</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {filtered.map((ann) => (
                        <div
                            key={ann.id}
                            className="group border border-gray-200 bg-white hover:border-gray-400 transition-colors p-3"
                        >
                            {editingId === ann.id ? (
                                /* Edit mode */
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-semibold text-gray-500">Màu:</span>
                                        {COLORS.map((c) => (
                                            <button
                                                key={c.value}
                                                onClick={() => setEditColor(c.value)}
                                                className="w-6 h-6 border-2 cursor-pointer"
                                                style={{
                                                    backgroundColor: c.value,
                                                    borderColor: editColor === c.value ? '#000' : 'transparent',
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
                                        className="w-full px-2 py-1.5 text-sm border border-gray-300 outline-none focus:border-gray-800"
                                        autoFocus
                                    />
                                    <div className="flex gap-1">
                                        <button
                                            onClick={handleSaveEdit}
                                            className="px-3 py-1.5 text-xs bg-gray-800 text-white cursor-pointer"
                                        >
                                            ✓ Lưu
                                        </button>
                                        <button
                                            onClick={() => setEditingId(null)}
                                            className="px-3 py-1.5 text-xs border border-gray-300 cursor-pointer hover:bg-gray-100"
                                        >
                                            Hủy
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                /* View mode */
                                <div className="flex items-start gap-3">
                                    {/* Color indicator */}
                                    <div
                                        className="w-1 self-stretch flex-shrink-0 rounded-full"
                                        style={{ backgroundColor: ann.color || '#fde047' }}
                                    />

                                    <div className="flex-1 min-w-0">
                                        {/* Header row */}
                                        <div className="flex items-center gap-2 mb-1">
                                            <span>{getTypeIcon(ann.type)}</span>
                                            <span className="text-xs font-semibold text-gray-800">
                                                {getTypeLabel(ann.type)}
                                            </span>
                                            <span className="text-xs text-gray-400">•</span>
                                            <span className="text-xs text-gray-500 truncate">
                                                {ann.docName || 'Không rõ'}
                                            </span>
                                            {ann.projName && (
                                                <>
                                                    <span className="text-xs text-gray-400">•</span>
                                                    <span className="text-xs text-gray-400 truncate">
                                                        📂 {ann.projName}
                                                    </span>
                                                </>
                                            )}
                                        </div>

                                        {/* Text content */}
                                        {ann.text && (
                                            <p
                                                className="text-sm px-2 py-1 mb-1 rounded"
                                                style={{ backgroundColor: (ann.color || '#fde047') + '40' }}
                                            >
                                                "{ann.text}"
                                            </p>
                                        )}

                                        {/* Note */}
                                        {ann.note && (
                                            <p className="text-xs text-gray-600 italic">
                                                💬 {ann.note}
                                            </p>
                                        )}

                                        {/* Date */}
                                        <p className="text-xs text-gray-400 mt-1">
                                            {ann.createdAt
                                                ? new Date(ann.createdAt).toLocaleString('vi-VN')
                                                : ''}
                                        </p>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {ann.document_id && (
                                            <button
                                                onClick={() => onJumpToDocument?.(ann.document_id, ann.project_id)}
                                                className="p-1.5 text-xs border border-gray-300 hover:bg-gray-800 hover:text-white hover:border-gray-800 cursor-pointer"
                                                title="Mở tài liệu"
                                            >
                                                📄
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleStartEdit(ann)}
                                            className="p-1.5 text-xs border border-gray-300 hover:bg-gray-800 hover:text-white hover:border-gray-800 cursor-pointer"
                                            title="Sửa"
                                        >
                                            ✏️
                                        </button>
                                        <button
                                            onClick={() => handleDelete(ann.id)}
                                            className="p-1.5 text-xs border border-gray-300 hover:bg-red-600 hover:text-white hover:border-red-600 cursor-pointer"
                                            title="Xóa"
                                        >
                                            🗑
                                        </button>
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
