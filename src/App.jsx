import { useState, useCallback, useRef, useEffect } from 'react'
import Sidebar from './components/Sidebar'
import Toolbar from './components/Toolbar'
import Paper from './components/Paper'
import FileDropper from './components/FileDropper'
import FileManager from './components/FileManager'
import NotesManager from './components/NotesManager'
import BottomNav from './components/BottomNav'
import FocusReader from './components/FocusReader'
import {
    getProjects,
    createProject,
    deleteProject as deleteProjectFromStore,
    saveDocument,
    deleteDocument as deleteDocFromStore,
    saveAnnotation,
    subscribeToChanges,
} from './store/projectStore'

const RECENT_KEY = 'hoso_recent_docs'
const MAX_RECENT = 10

function getRecentDocs() {
    try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]') } catch { return [] }
}
function addRecentDoc(doc) {
    const recent = getRecentDocs().filter(d => d.id !== doc.id)
    recent.unshift({ id: doc.id, fileName: doc.fileName, type: doc.type, projectId: doc.projectId, projectName: doc.projectName, viewedAt: Date.now() })
    localStorage.setItem(RECENT_KEY, JSON.stringify(recent.slice(0, MAX_RECENT)))
}

// View modes
const VIEW = { READER: 'reader', FILES: 'files', NOTES: 'notes', FOCUS: 'focus' }

export default function App() {
    const [projects, setProjects] = useState([])
    const [selectedProject, setSelectedProject] = useState(null)
    const [currentDoc, setCurrentDoc] = useState(null) // FIX #1: renamed from 'document' to avoid shadowing window.document
    const [showDropper, setShowDropper] = useState(true)
    const [annotationMode, setAnnotationMode] = useState('off') // 'off' | 'draw' | 'highlight'
    const [loading, setLoading] = useState(true)
    const [recentDocs, setRecentDocs] = useState(getRecentDocs())
    const [currentView, setCurrentView] = useState(VIEW.READER)
    const dropperRef = useRef(null)

    // Alias for readability in handlers (avoid window.document confusion)
    const document = currentDoc
    const setDocument = setCurrentDoc

    const isFetchingRef = useRef(false)

    const refreshProjects = useCallback(async () => {
        // FIX: prevent concurrent fetches
        if (isFetchingRef.current) return
        isFetchingRef.current = true
        try {
            const data = await getProjects()
            setProjects(data || [])
        } catch (err) {
            console.error('refreshProjects error:', err)
        } finally {
            setLoading(false)
            isFetchingRef.current = false
        }
    }, [])

    // Load projects on mount (no auth needed)
    useEffect(() => {
        refreshProjects()
    }, [refreshProjects])

    // Keyboard shortcut: F = enter focus mode
    useEffect(() => {
        const onKey = (e) => {
            if (e.key === 'f' || e.key === 'F') {
                const tag = e.target.tagName
                if (tag === 'INPUT' || tag === 'TEXTAREA') return
                if (currentDoc && currentView === VIEW.READER) {
                    setCurrentView(VIEW.FOCUS)
                } else if (currentView === VIEW.FOCUS) {
                    setCurrentView(VIEW.READER)
                }
            }
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [currentDoc, currentView])

    // Real-time subscriptions
    useEffect(() => {
        const cleanup = subscribeToChanges(() => {
            refreshProjects()
        })
        return cleanup
    }, [refreshProjects])

    // — Project CRUD (optimistic) —

    const handleCreateProject = useCallback(async (name) => {
        const tempId = 'temp_' + Date.now()
        const optimistic = { id: tempId, name: name.trim(), createdAt: new Date().toISOString(), documents: [] }

        setProjects(prev => [optimistic, ...prev])
        setSelectedProject(tempId)

        const project = await createProject(name)
        if (project) {
            setProjects(prev => prev.map(p => p.id === tempId ? { ...optimistic, id: project.id } : p))
            setSelectedProject(project.id)
        }
        refreshProjects()
    }, [refreshProjects])

    const handleDeleteProject = useCallback(async (id) => {
        setProjects(prev => prev.filter(p => p.id !== id))
        if (selectedProject === id) {
            setSelectedProject(null)
            setDocument(null)
        }

        deleteProjectFromStore(id).then(() => refreshProjects())
    }, [selectedProject, refreshProjects])

    // — Multi-file upload (optimistic) —

    const handleFilesProcessed = useCallback(async (results) => {
        if (!selectedProject) {
            alert('Vui lòng chọn 1 dự án trước khi tải file!')
            return
        }

        const newDocs = results.map((r, i) => ({
            id: 'temp_' + Date.now() + '_' + i,
            fileName: r.fileName,
            content: r.content,
            type: r.type,
            createdAt: new Date().toISOString(),
        }))
        setProjects(prev => prev.map(p =>
            p.id === selectedProject
                ? { ...p, documents: [...newDocs, ...p.documents] }
                : p
        ))

        const last = results[results.length - 1]
        setCurrentDoc({ type: last.type, content: last.content, fileName: last.fileName })
        setShowDropper(false)
        setAnnotationMode('off')
        setCurrentView(VIEW.READER)

        // FIX #2: save files sequentially to prevent PocketBase SDK auto-canceling parallel requests
        for (const r of results) {
            await saveDocument(selectedProject, r.fileName, r.content, r.type)
        }
        await refreshProjects()
    }, [selectedProject, refreshProjects])

    // — Document selection —

    const handleSelectDocument = useCallback((doc, projectId, projectName) => {
        setCurrentDoc({ type: doc.type, content: doc.content, fileName: doc.fileName })
        setShowDropper(false)
        setAnnotationMode('off')
        // Auto-enter focus mode on mobile
        if (window.innerWidth < 768) {
            setCurrentView(VIEW.FOCUS)
        } else {
            setCurrentView(VIEW.READER)
        }

        addRecentDoc({ id: doc.id, fileName: doc.fileName, type: doc.type, projectId, projectName })
        setRecentDocs(getRecentDocs())
    }, [])

    const handleOpenRecent = useCallback((recent) => {
        for (const proj of projects) {
            const doc = proj.documents.find(d => d.id === recent.id)
            if (doc) {
                setSelectedProject(proj.id)
                setCurrentDoc({ type: doc.type, content: doc.content, fileName: doc.fileName })
                setShowDropper(false)
                setAnnotationMode('off')
                // Auto-enter focus mode on mobile
                if (window.innerWidth < 768) {
                    setCurrentView(VIEW.FOCUS)
                } else {
                    setCurrentView(VIEW.READER)
                }
                return
            }
        }
        alert('Tài liệu không còn tồn tại.')
    }, [projects])

    const handleDeleteDocument = useCallback(async (projectId, docId) => {
        // FIX: if the deleted doc is currently open, clear the reader
        const currentProj = projects.find(p => p.id === projectId)
        const deletedDoc = currentProj?.documents?.find(d => d.id === docId)
        if (deletedDoc && deletedDoc.fileName === currentDoc?.fileName) {
            setCurrentDoc(null)
            setShowDropper(true)
        }
        await deleteDocFromStore(projectId, docId)
        await refreshProjects()
    }, [refreshProjects, projects, currentDoc])

    const handleUploadClick = useCallback(() => {
        setCurrentView(VIEW.READER)
        setShowDropper(true)
        setTimeout(() => dropperRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    }, [])

    const handleEnterFocus = useCallback(() => {
        if (currentDoc) setCurrentView(VIEW.FOCUS)
    }, [currentDoc])

    const handlePrint = useCallback(() => { window.print() }, [])

    // — Highlight / Note handler (shared) —
    const handleHighlight = useCallback((data) => {
        if (!currentDoc) return
        const proj = projects.find(p => p.id === selectedProject)
        // FIX #3: guard against null/undefined doc_id (doc may not be saved to PB yet)
        const docId = proj?.documents?.find(d => d.fileName === currentDoc.fileName)?.id ?? null
        if (!docId) {
            console.warn('handleHighlight: document_id not found, annotation will be saved without PB link')
        }
        saveAnnotation({
            document_id: docId,
            project_id: selectedProject,
            type: data.type || 'highlight',
            text: data.text,
            color: data.color || '#fde047',
            note: data.note || '',
            fileName: data.fileName || currentDoc.fileName,
            scrollPosition: data.scrollPosition || 0,
        })
    }, [currentDoc, projects, selectedProject])

    // — Export HTML —
    const handleExportHtml = useCallback((doc) => {
        const content = doc?.content || ''
        const fileName = doc?.fileName || currentDoc?.fileName || 'document'

        // For MD, render to simple HTML; for HTML/docx, use content directly
        let bodyHtml = content
        if (doc?.type === 'md' || (!doc && currentDoc?.type === 'md')) {
            // Use rendered DOM content for accurate MD export
            const paperEl = window.document.getElementById('paper-content')
            if (paperEl) bodyHtml = paperEl.innerHTML
        }

        const html = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${fileName} – HoSo Reader</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Calibri','Carlito',Arial,sans-serif; font-size: 12pt; line-height: 1.8; color: #000; background: #fff; max-width: 210mm; margin: 0 auto; padding: 25mm; }
    h1 { font-size: 28pt; font-weight: 700; margin: 0 0 16pt; border-bottom: 2px solid #000; padding-bottom: 8pt; }
    h2 { font-size: 20pt; font-weight: 600; margin: 24pt 0 12pt; }
    h3 { font-size: 16pt; font-weight: 600; margin: 20pt 0 8pt; }
    p { margin: 0 0 10pt; text-align: justify; }
    ul, ol { margin: 0 0 10pt; padding-left: 20pt; }
    li { margin-bottom: 4pt; }
    blockquote { margin: 12pt 0; padding: 8pt 16pt; border-left: 3px solid #000; font-style: italic; }
    code { font-family: Consolas,monospace; font-size: 10pt; background: #f5f5f5; padding: 1pt 4pt; border: 1px solid #d4d4d4; }
    pre { margin: 12pt 0; padding: 12pt; background: #f5f5f5; border: 1px solid #d4d4d4; overflow-x: auto; }
    pre code { background: none; padding: 0; border: none; }
    table { width: 100%; border-collapse: collapse; margin: 12pt 0; }
    th, td { border: 1px solid #000; padding: 6pt 10pt; }
    th { font-weight: 700; background: #f5f5f5; }
    a { color: #000; text-decoration: underline; }
    img { max-width: 100%; }
    mark { padding: 1px 2px; border-radius: 2px; }
    @media print { @page { size: A4; margin: 20mm; } body { padding: 0; } }
  </style>
</head>
<body>${bodyHtml}</body>
</html>`

        const blob = new Blob([html], { type: 'text/html' })
        const url = URL.createObjectURL(blob)
        const a = window.document.createElement('a')
        a.href = url
        a.download = fileName.replace(/\.(md|docx|html|htm)$/i, '') + '.html'
        a.click()
        URL.revokeObjectURL(url)
    }, [currentDoc])

    // — Jump to document from NotesManager —
    const handleJumpToDocument = useCallback((docId, projectId, scrollPosition) => {
        for (const proj of projects) {
            const doc = proj.documents.find(d => d.id === docId)
            if (doc) {
                setSelectedProject(proj.id)
                handleSelectDocument(doc, proj.id, proj.name)
                // Scroll to saved position after render
                if (scrollPosition) {
                    setTimeout(() => {
                        const container = window.document.querySelector('.flex-1.overflow-auto')
                        if (container) container.scrollTop = scrollPosition
                    }, 300)
                }
                return
            }
        }
    }, [projects, handleSelectDocument])

    const selectedProjectData = projects.find((p) => p.id === selectedProject)
    const selectedProjectName = selectedProjectData?.name || null
    // Use currentDoc in JSX (note: 'document' alias above still works for handlers)

    return (
        <div className="flex min-h-screen min-h-dvh overflow-x-hidden max-w-[100vw]">
            {/* FOCUS READING MODE – full screen overlay */}
            {currentView === VIEW.FOCUS && (
                <FocusReader
                    document={document}
                    onExit={() => setCurrentView(VIEW.READER)}
                    onSaveNote={handleHighlight}
                />
            )}
            {/* Desktop sidebar */}
            <div className="hidden md:block">
                <Sidebar
                    projects={projects}
                    selectedProject={selectedProject}
                    onSelectProject={setSelectedProject}
                    onCreateProject={handleCreateProject}
                    onDeleteProject={handleDeleteProject}
                    onSelectDocument={(doc) => {
                        const proj = projects.find(p => p.documents.some(d => d.id === doc.id))
                        handleSelectDocument(doc, proj?.id, proj?.name)
                    }}

                    onDeleteDocument={handleDeleteDocument}
                    onUploadClick={handleUploadClick}
                    currentFile={document?.fileName}
                    isOpen={true}
                    onClose={() => { }}
                    loading={loading}
                    recentDocs={recentDocs}
                    onOpenRecent={handleOpenRecent}
                    currentView={currentView}
                    onChangeView={setCurrentView}
                />
            </div>

            {/* Main content */}
            <main className="flex-1 flex flex-col min-h-screen min-h-dvh bg-gray-100">
                {/* Desktop toolbar */}
                <div className="hidden md:block">
                    <Toolbar
                        fileName={currentDoc?.fileName}
                        projectName={selectedProjectName}
                        onPrint={handlePrint}
                        onSaveHtml={() => handleExportHtml(currentDoc)}
                        annotationMode={annotationMode}
                        onSetAnnotationMode={setAnnotationMode}
                        currentView={currentView}
                        onEnterFocus={handleEnterFocus}
                    />
                </div>

                {/* Mobile top bar */}
                <div className="md:hidden flex items-center px-4 py-2 border-b border-gray-300 bg-white no-print">
                    <span className="text-sm font-semibold truncate" style={{ fontFamily: 'var(--font-doc)' }}>
                        {currentView === VIEW.FILES ? '📂 Quản lý file'
                            : currentView === VIEW.NOTES ? '📝 Ghi chú'
                                : currentDoc?.fileName || 'HoSo Reader'}
                    </span>
                </div>

                {/* Preview area */}
                <div className="flex-1 overflow-auto p-4 md:p-8 pb-20 md:pb-8 flex flex-col items-center">
                    {/* VIEW: File Manager */}
                    {currentView === VIEW.FILES && (
                        <FileManager
                            projects={projects}
                            onSelectDocument={handleSelectDocument}
                            onDeleteDocument={handleDeleteDocument}
                            onExportHtml={handleExportHtml}
                        />
                    )}

                    {/* VIEW: Notes Manager */}
                    {currentView === VIEW.NOTES && (
                        <NotesManager
                            projects={projects}
                            onJumpToDocument={handleJumpToDocument}
                        />
                    )}

                    {/* VIEW: Reader */}
                    {currentView === VIEW.READER && (
                        <>
                            {showDropper && (
                                <div ref={dropperRef} className="w-full max-w-[210mm] mb-6">
                                    <FileDropper
                                        onFilesProcessed={handleFilesProcessed}
                                        projectName={selectedProjectName}
                                    />
                                </div>
                            )}

                            {/* Recent Documents (when no document is open) */}
                            {!document && recentDocs.length > 0 && (
                                <div className="w-full max-w-[210mm] mb-6">
                                    <h3 className="text-sm font-bold uppercase tracking-wider mb-3 text-gray-600">
                                        📋 Tài liệu gần đây
                                    </h3>
                                    <div className="grid gap-2">
                                        {recentDocs.map((r) => (
                                            <button
                                                key={r.id}
                                                onClick={() => handleOpenRecent(r)}
                                                className="flex items-center gap-3 px-4 py-3 bg-white border border-gray-200 hover:border-ink text-left cursor-pointer transition-colors"
                                            >
                                                <span className="text-lg">{r.type === 'md' ? '📝' : r.type === 'html' ? '🌐' : '📄'}</span>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium truncate">{r.fileName}</p>
                                                    {r.projectName && (
                                                        <p className="text-xs text-gray-500 truncate">📂 {r.projectName}</p>
                                                    )}
                                                </div>
                                                <span className="text-xs text-gray-400">
                                                    {new Date(r.viewedAt).toLocaleDateString('vi-VN')}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <Paper
                                document={currentDoc}
                                annotationMode={annotationMode}
                                onHighlight={handleHighlight}
                            />
                        </>
                    )}
                </div>
            </main>

            {/* Mobile bottom nav */}
            <BottomNav
                projects={projects}
                selectedProject={selectedProject}
                onSelectProject={setSelectedProject}
                onCreateProject={handleCreateProject}
                onDeleteProject={handleDeleteProject}
                onSelectDocument={(doc) => {
                    const proj = projects.find(p => p.documents.some(d => d.id === doc.id))
                    handleSelectDocument(doc, proj?.id, proj?.name)
                }}
                onDeleteDocument={handleDeleteDocument}
                onUploadClick={handleUploadClick}
                currentFile={currentDoc?.fileName}
                annotationMode={annotationMode}
                onSetAnnotationMode={setAnnotationMode}
                onPrint={handlePrint}
                onSaveHtml={() => handleExportHtml(currentDoc)}
                hasDocument={!!currentDoc}
                recentDocs={recentDocs}
                onOpenRecent={handleOpenRecent}
                currentView={currentView}
                onChangeView={setCurrentView}
            />
        </div>
    )
}
