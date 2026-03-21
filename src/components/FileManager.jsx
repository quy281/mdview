import { useState, useCallback } from 'react'

/**
 * FileManager – Grid view of all documents with thumbnails.
 * Shows all files across projects with preview cards, search, and actions.
 */
export default function FileManager({
    projects,
    onSelectDocument,
    onDeleteDocument,
    onExportHtml,
}) {
    const [search, setSearch] = useState('')
    const [filterProject, setFilterProject] = useState('')

    // Flatten all documents with project info
    const allDocs = projects.flatMap((p) =>
        (p.documents || []).map((d) => ({
            ...d,
            projectId: p.id,
            projectName: p.name,
        }))
    )

    // Filter
    const filtered = allDocs.filter((d) => {
        if (search && !d.fileName.toLowerCase().includes(search.toLowerCase())) return false
        if (filterProject && d.projectId !== filterProject) return false
        return true
    })

    // Sort by date (newest first)
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

    const getTypeColor = (type) => {
        switch (type) {
            case 'md': return '#3b82f6'
            case 'docx': return '#2563eb'
            case 'html': return '#f59e0b'
            default: return '#6b7280'
        }
    }

    const generateThumbnail = (doc) => {
        // Generate text preview from content
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

    return (
        <div className="w-full max-w-[900px] mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold tracking-tight" style={{ fontFamily: 'var(--font-sans)' }}>
                    📂 Quản lý tài liệu
                </h2>
                <span className="text-xs text-gray-500">{filtered.length} file</span>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2 mb-4">
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="🔍 Tìm file..."
                    className="flex-1 min-w-[200px] px-3 py-2 text-sm border border-gray-300 outline-none focus:border-gray-800"
                />
                <select
                    value={filterProject}
                    onChange={(e) => setFilterProject(e.target.value)}
                    className="px-3 py-2 text-sm border border-gray-300 outline-none focus:border-gray-800 bg-white cursor-pointer"
                >
                    <option value="">Tất cả dự án</option>
                    {projects.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                </select>
            </div>

            {/* Grid */}
            {filtered.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                    <p className="text-4xl mb-3">📭</p>
                    <p className="text-sm">Chưa có tài liệu nào</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {filtered.map((doc) => (
                        <div
                            key={doc.id}
                            className="group border border-gray-200 bg-white hover:border-gray-800 transition-colors cursor-pointer flex flex-col"
                            onClick={() => onSelectDocument(doc, doc.projectId, doc.projectName)}
                        >
                            {/* Thumbnail preview */}
                            <div className="relative h-32 overflow-hidden border-b border-gray-100 bg-gray-50 p-3">
                                <div
                                    className="text-xs text-gray-500 leading-relaxed overflow-hidden"
                                    style={{
                                        fontFamily: 'var(--font-doc)',
                                        fontSize: '7pt',
                                        lineHeight: '1.4',
                                        display: '-webkit-box',
                                        WebkitLineClamp: 8,
                                        WebkitBoxOrient: 'vertical',
                                    }}
                                >
                                    {generateThumbnail(doc)}
                                </div>
                                {/* Type badge */}
                                <span
                                    className="absolute top-2 right-2 text-white text-xs px-1.5 py-0.5 font-semibold"
                                    style={{ backgroundColor: getTypeColor(doc.type), fontSize: '9px' }}
                                >
                                    {getTypeLabel(doc.type)}
                                </span>
                            </div>

                            {/* Info */}
                            <div className="p-3 flex-1 flex flex-col">
                                <div className="flex items-start gap-2">
                                    <span className="text-lg flex-shrink-0">{getTypeIcon(doc.type)}</span>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold truncate">{doc.fileName}</p>
                                        <p className="text-xs text-gray-500 truncate">📂 {doc.projectName}</p>
                                    </div>
                                </div>

                                {/* Date + Actions */}
                                <div className="mt-auto pt-2 flex items-center justify-between">
                                    <span className="text-xs text-gray-400">
                                        {doc.createdAt
                                            ? new Date(doc.createdAt).toLocaleDateString('vi-VN')
                                            : ''}
                                    </span>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                onExportHtml?.(doc)
                                            }}
                                            className="p-1.5 text-xs border border-gray-300 hover:bg-gray-800 hover:text-white hover:border-gray-800 cursor-pointer"
                                            title="Xuất HTML"
                                        >
                                            ⬇
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                if (confirm(`Xóa "${doc.fileName}"?`)) {
                                                    onDeleteDocument(doc.projectId, doc.id)
                                                }
                                            }}
                                            className="p-1.5 text-xs border border-gray-300 hover:bg-red-600 hover:text-white hover:border-red-600 cursor-pointer"
                                            title="Xóa"
                                        >
                                            🗑
                                        </button>
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
