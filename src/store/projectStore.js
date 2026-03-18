/**
 * Project Store – PocketBase-backed data layer with real-time sync.
 * Collections: hoso_projects, hoso_documents on db.mkg.vn
 */
import pb from './pb'

const PROJECTS_COLLECTION = 'hoso_projects'
const DOCS_COLLECTION = 'hoso_documents'

// Debounce refresh to avoid race conditions
let refreshTimer = null
function debouncedCallback(callback, delay = 500) {
    clearTimeout(refreshTimer)
    refreshTimer = setTimeout(callback, delay)
}

// ── Projects ──────────────────────────────────────

export async function getProjects() {
    try {
        const projects = await pb.collection(PROJECTS_COLLECTION).getFullList({
            sort: '-created',
        })

        const docs = await pb.collection(DOCS_COLLECTION).getFullList({
            sort: '-created',
        })

        return projects.map((p) => ({
            id: p.id,
            name: p.name,
            createdAt: p.created,
            documents: docs
                .filter((d) => d.project_id === p.id)
                .map((d) => ({
                    id: d.id,
                    fileName: d.fileName,
                    content: d.content,
                    type: d.type,
                    createdAt: d.created,
                })),
        }))
    } catch (err) {
        console.error('Failed to load projects:', err)
        return []
    }
}

export async function createProject(name) {
    try {
        const record = await pb.collection(PROJECTS_COLLECTION).create({
            name: name.trim(),
        })
        return {
            id: record.id,
            name: record.name,
            createdAt: record.created,
            documents: [],
        }
    } catch (err) {
        console.error('Failed to create project:', err)
        return null
    }
}

export async function deleteProject(id) {
    try {
        // Delete all documents in the project first
        const docs = await pb.collection(DOCS_COLLECTION).getFullList({
            filter: `project_id = "${id}"`,
        })
        for (const doc of docs) {
            await pb.collection(DOCS_COLLECTION).delete(doc.id)
        }
        // Delete the project
        await pb.collection(PROJECTS_COLLECTION).delete(id)
    } catch (err) {
        console.error('Failed to delete project:', err)
    }
}

// ── Documents ─────────────────────────────────────

export async function saveDocument(projectId, fileName, content, type) {
    try {
        const record = await pb.collection(DOCS_COLLECTION).create({
            project_id: projectId,
            fileName,
            content,
            type,
        })
        return {
            id: record.id,
            fileName: record.fileName,
            content: record.content,
            type: record.type,
            createdAt: record.created,
        }
    } catch (err) {
        console.error('Failed to save document:', err)
        return null
    }
}

export async function deleteDocument(projectId, docId) {
    try {
        await pb.collection(DOCS_COLLECTION).delete(docId)
    } catch (err) {
        console.error('Failed to delete document:', err)
    }
}

// ── Real-time Subscriptions ───────────────────────

export function subscribeToChanges(onUpdate) {
    const handler = () => debouncedCallback(onUpdate)

    pb.collection(PROJECTS_COLLECTION).subscribe('*', handler)
    pb.collection(DOCS_COLLECTION).subscribe('*', handler)

    return () => {
        pb.collection(PROJECTS_COLLECTION).unsubscribe('*')
        pb.collection(DOCS_COLLECTION).unsubscribe('*')
    }
}
