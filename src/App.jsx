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

/**
 * App – Main layout for HoSo Reader.
 * Requires admin authentication to sync with PocketBase.
 */
export default function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(pb.authStore.isValid)
    const [projects, setProjects] = useState([])
    const [selectedProject, setSelectedProject] = useState(null)
    const [document, setDocument] = useState(null)
    const [showDropper, setShowDropper] = useState(true)
    const [annotationActive, setAnnotationActive] = useState(false)
    const [loading, setLoading] = useState(true)
    const dropperRef = useRef(null)

    // Load projects from PocketBase
    const refreshProjects = useCallback(async () => {
        if (!isAuthenticated) return
        try {
            const data = await getProjects()
            setProjects(data || [])
        } finally {
            setLoading(false)
        }
    }, [isAuthenticated])

    useEffect(() => {
        if (isAuthenticated) refreshProjects()
    }, [isAuthenticated, refreshProjects])

    // Real-time sync
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

    // — Document management —

    const handleFileProcessed = useCallback(async (result) => {
        if (selectedProject) {
            await saveDocument(selectedProject, result.fileName, result.content, result.type)
            await refreshProjects()
        }
        setDocument({ type: result.type, content: result.content, fileName: result.fileName })
        setShowDropper(false)
        setAnnotationActive(false)
    }, [selectedProject, refreshProjects])

    const handleSelectDocument = useCallback((doc) => {
        setDocument({ type: doc.type, content: doc.content, fileName: doc.fileName })
        setShowDropper(false)
        setAnnotationActive(false)
    }, [])

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

    const selectedProjectName = selectedProject
        ? projects.find((p) => p.id === selectedProject)?.name
        : null

    if (!isAuthenticated) {
        return <LoginScreen onLoginSuccess={() => setIsAuthenticated(true)} />
    }

    return (
        <div className="flex min-h-screen min-h-dvh">
            {/* Desktop sidebar – hidden on mobile */}
            <div className="hidden md:block">
                <Sidebar
                    projects={projects}
                    selectedProject={selectedProject}
                    onSelectProject={setSelectedProject}
                    onCreateProject={handleCreateProject}
                    onDeleteProject={handleDeleteProject}
                    onSelectDocument={handleSelectDocument}
                    onDeleteDocument={handleDeleteDocument}
                    onUploadClick={handleUploadClick}
                    onLogout={handleLogout}
                    currentFile={document?.fileName}
                    isOpen={true}
                    onClose={() => { }}
                    loading={loading}
                />
            </div>

            {/* Main content */}
            <main className="flex-1 flex flex-col min-h-screen min-h-dvh bg-gray-100">
                {/* Desktop toolbar – hidden on mobile */}
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

                {/* Mobile top bar – minimal file name only */}
                <div className="md:hidden flex items-center px-4 py-2 border-b border-gray-300 bg-white no-print">
                    <span className="text-sm font-semibold truncate" style={{ fontFamily: 'var(--font-doc)' }}>
                        {document?.fileName || 'HoSo Reader'}
                    </span>
                </div>

                {/* Preview area – extra bottom padding on mobile for nav bar */}
                <div className="flex-1 overflow-auto p-4 md:p-8 pb-20 md:pb-8 flex flex-col items-center">
                    {showDropper && (
                        <div ref={dropperRef} className="w-full max-w-[210mm] mb-6">
                            <FileDropper
                                onFileProcessed={handleFileProcessed}
                                projectName={selectedProjectName}
                            />
                        </div>
                    )}

                    <Paper document={document} annotationActive={annotationActive} />
                </div>
            </main>

            {/* Mobile bottom nav – hidden on desktop */}
            <BottomNav
                projects={projects}
                selectedProject={selectedProject}
                onSelectProject={setSelectedProject}
                onCreateProject={handleCreateProject}
                onDeleteProject={handleDeleteProject}
                onSelectDocument={handleSelectDocument}
                onDeleteDocument={handleDeleteDocument}
                onUploadClick={handleUploadClick}
                onLogout={handleLogout}
                currentFile={document?.fileName}
                annotationActive={annotationActive}
                onAnnotationToggle={() => setAnnotationActive((v) => !v)}
                onPrint={handlePrint}
                onSaveHtml={handleSaveHtml}
                hasDocument={!!document}
            />
        </div>
    )
}
