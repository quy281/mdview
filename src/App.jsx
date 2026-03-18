import { useState, useCallback, useRef, useEffect } from 'react'
import Sidebar from './components/Sidebar'
import Toolbar from './components/Toolbar'
import Paper from './components/Paper'
import FileDropper from './components/FileDropper'
import BottomNav from './components/BottomNav'
import LoginScreen from './components/LoginScreen'
import pb from './store/pb'
import {
    getProjects,
    createProject,
    deleteProject as deleteProjectFromStore,
    saveDocument,
    deleteDocument as deleteDocFromStore,
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

export default function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(pb.authStore.isValid)
    const [projects, setProjects] = useState([])
    const [selectedProject, setSelectedProject] = useState(null)
    const [document, setDocument] = useState(null)
    const [showDropper, setShowDropper] = useState(true)
    const [annotationActive, setAnnotationActive] = useState(false)
    const [loading, setLoading] = useState(true)
    const [recentDocs, setRecentDocs] = useState(getRecentDocs())
    const dropperRef = useRef(null)

    const refreshProjects = useCallback(async () => {
        if (!isAuthenticated) return
        try {
            const data = await getProjects()
            setProjects(data || [])
        } catch (err) {
            console.error('refreshProjects error:', err)
        } finally {
            setLoading(false)
        }
    }, [isAuthenticated])

    // Validate token on mount — if stale, force re-login
    useEffect(() => {
        if (!pb.authStore.isValid) return
        // Try to verify the token by refreshing auth
        pb.collection('_superusers').authRefresh().then(() => {
            setIsAuthenticated(true)
            refreshProjects()
        }).catch(() => {
            console.warn('Stale auth token, logging out...')
            pb.authStore.clear()
            setIsAuthenticated(false)
            setLoading(false)
        })
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (isAuthenticated) refreshProjects()
    }, [isAuthenticated, refreshProjects])

    useEffect(() => {
        if (!isAuthenticated) return
        const unsubscribe = subscribeToChanges(() => refreshProjects())
        return () => unsubscribe()
    }, [isAuthenticated, refreshProjects])

    // — Project CRUD —

    const handleCreateProject = useCallback(async (name) => {
        const project = await createProject(name)
        await refreshProjects()
        if (project) setSelectedProject(project.id)
    }, [refreshProjects])

    const handleDeleteProject = useCallback(async (id) => {
        await deleteProjectFromStore(id)
        if (selectedProject === id) {
            setSelectedProject(null)
            setDocument(null)
        }
        await refreshProjects()
    }, [selectedProject, refreshProjects])

    // — Multi-file upload (files go into selected project) —

    const handleFilesProcessed = useCallback(async (results) => {
        if (!selectedProject) {
            alert('Vui lòng chọn 1 dự án trước khi tải file!')
            return
        }

        for (const result of results) {
            await saveDocument(selectedProject, result.fileName, result.content, result.type)
        }
        await refreshProjects()

        // Open the last uploaded file
        const last = results[results.length - 1]
        setDocument({ type: last.type, content: last.content, fileName: last.fileName })
        setShowDropper(false)
        setAnnotationActive(false)
    }, [selectedProject, refreshProjects])

    // — Document selection —

    const handleSelectDocument = useCallback((doc, projectId, projectName) => {
        setDocument({ type: doc.type, content: doc.content, fileName: doc.fileName })
        setShowDropper(false)
        setAnnotationActive(false)

        // Track in recent
        addRecentDoc({ id: doc.id, fileName: doc.fileName, type: doc.type, projectId, projectName })
        setRecentDocs(getRecentDocs())
    }, [])

    const handleOpenRecent = useCallback((recent) => {
        // Find the document in projects
        for (const proj of projects) {
            const doc = proj.documents.find(d => d.id === recent.id)
            if (doc) {
                setSelectedProject(proj.id)
                setDocument({ type: doc.type, content: doc.content, fileName: doc.fileName })
                setShowDropper(false)
                setAnnotationActive(false)
                return
            }
        }
        alert('Tài liệu không còn tồn tại.')
    }, [projects])

    const handleDeleteDocument = useCallback(async (projectId, docId) => {
        await deleteDocFromStore(projectId, docId)
        await refreshProjects()
    }, [refreshProjects])

    const handleUploadClick = useCallback(() => {
        setShowDropper(true)
        setTimeout(() => dropperRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    }, [])

    const handlePrint = useCallback(() => { window.print() }, [])

    const handleLogout = useCallback(() => {
        pb.authStore.clear()
        setIsAuthenticated(false)
        setProjects([])
        setDocument(null)
    }, [])

    const handleSaveHtml = useCallback(() => {
        if (!document) return
        const paperEl = window.document.getElementById('paper-content')
        if (!paperEl) return

        const html = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${document.fileName} – HoSo Reader</title>
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
    @media print { @page { size: A4; margin: 20mm; } body { padding: 0; } }
  </style>
</head>
<body>${paperEl.innerHTML}</body>
</html>`

        const blob = new Blob([html], { type: 'text/html' })
        const url = URL.createObjectURL(blob)
        const a = window.document.createElement('a')
        a.href = url
        a.download = document.fileName.replace(/\.(md|docx)$/i, '') + '.html'
        a.click()
        URL.revokeObjectURL(url)
    }, [document])

    const selectedProjectData = projects.find((p) => p.id === selectedProject)
    const selectedProjectName = selectedProjectData?.name || null

    if (!isAuthenticated) {
        return <LoginScreen onLoginSuccess={() => setIsAuthenticated(true)} />
    }

    return (
        <div className="flex min-h-screen min-h-dvh">
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
                    onLogout={handleLogout}
                    currentFile={document?.fileName}
                    isOpen={true}
                    onClose={() => { }}
                    loading={loading}
                    recentDocs={recentDocs}
                    onOpenRecent={handleOpenRecent}
                />
            </div>

            {/* Main content */}
            <main className="flex-1 flex flex-col min-h-screen min-h-dvh bg-gray-100">
                {/* Desktop toolbar */}
                <div className="hidden md:block">
                    <Toolbar
                        fileName={document?.fileName}
                        onPrint={handlePrint}
                        onSaveHtml={handleSaveHtml}
                        onMenuToggle={() => { }}
                        annotationActive={annotationActive}
                        onAnnotationToggle={() => setAnnotationActive((v) => !v)}
                    />
                </div>

                {/* Mobile top bar */}
                <div className="md:hidden flex items-center px-4 py-2 border-b border-gray-300 bg-white no-print">
                    <span className="text-sm font-semibold truncate" style={{ fontFamily: 'var(--font-doc)' }}>
                        {document?.fileName || 'HoSo Reader'}
                    </span>
                </div>

                {/* Preview area */}
                <div className="flex-1 overflow-auto p-4 md:p-8 pb-20 md:pb-8 flex flex-col items-center">
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
                                        <span className="text-lg">{r.type === 'md' ? '📝' : '📄'}</span>
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

                    <Paper document={document} annotationActive={annotationActive} />
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
                onLogout={handleLogout}
                currentFile={document?.fileName}
                annotationActive={annotationActive}
                onAnnotationToggle={() => setAnnotationActive((v) => !v)}
                onPrint={handlePrint}
                onSaveHtml={handleSaveHtml}
                hasDocument={!!document}
                recentDocs={recentDocs}
                onOpenRecent={handleOpenRecent}
            />
        </div>
    )
}
