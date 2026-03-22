/**
 * Project Store – PocketBase + localStorage hybrid data layer.
 * Collections: hoso_projects, hoso_documents, hoso_annotations on db.mkg.vn
 * Falls back to localStorage if PocketBase is unavailable.
 * NOTE: Does NOT permanently lock to fallback – retries PB on every call.
 */
import pb from './pb'

const PROJECTS_COLLECTION = 'hoso_projects'
const DOCS_COLLECTION = 'hoso_documents'
const ANNOTATIONS_COLLECTION = 'hoso_annotations'

// localStorage keys
const LS_PROJECTS = 'hoso_ls_projects'
const LS_DOCS = 'hoso_ls_documents'
const LS_ANNOTATIONS = 'hoso_ls_annotations'

// ── Helpers ───────────────────────────────────────

function lsGet(key) {
    try { return JSON.parse(localStorage.getItem(key) || '[]') } catch { return [] }
}
function lsSet(key, data) {
    try { localStorage.setItem(key, JSON.stringify(data)) } catch { /* full */ }
}
function generateId() {
    return 'ls_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8)
}

// Debounce for real-time subscriptions
let refreshTimer = null
function debouncedCallback(callback, delay = 100) {
    clearTimeout(refreshTimer)
    refreshTimer = setTimeout(callback, delay)
}

// Check if PocketBase is reachable (lightweight)
async function isPBAvailable() {
    try {
        await pb.health.check()
        return true
    } catch {
        return false
    }
}

// ── Projects ──────────────────────────────────────

export async function getProjects() {
    // Always try PocketBase first (no permanent lock)
    try {
        const projects = await pb.collection(PROJECTS_COLLECTION).getFullList()
        const docs = await pb.collection(DOCS_COLLECTION).getFullList()

        projects.sort((a, b) => (b.created || '').localeCompare(a.created || ''))
        docs.sort((a, b) => (b.created || '').localeCompare(a.created || ''))

        const result = projects.map((p) => ({
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

        // Sync to localStorage as backup — including document content
        lsSet(LS_PROJECTS, result.map(p => ({ id: p.id, name: p.name, createdAt: p.createdAt })))
        lsSet(LS_DOCS, result.flatMap(p =>
            p.documents.map(d => ({ ...d, project_id: p.id }))
        ))

        return result
    } catch (err) {
        console.warn('PocketBase unavailable, using localStorage fallback:', err.message)
    }

    // localStorage fallback
    const projects = lsGet(LS_PROJECTS)
    const docs = lsGet(LS_DOCS)
    return projects.map(p => ({
        ...p,
        documents: docs.filter(d => d.project_id === p.id),
    }))
}

export async function createProject(name) {
    const trimmed = name.trim()
    try {
        const record = await pb.collection(PROJECTS_COLLECTION).create({ name: trimmed })
        return { id: record.id, name: record.name, createdAt: record.created, documents: [] }
    } catch (err) {
        console.warn('PB create project failed, using localStorage:', err.message)
    }

    // localStorage
    const project = { id: generateId(), name: trimmed, createdAt: new Date().toISOString() }
    const projects = lsGet(LS_PROJECTS)
    projects.unshift(project)
    lsSet(LS_PROJECTS, projects)
    return { ...project, documents: [] }
}

export async function deleteProject(id) {
    try {
        const docs = await pb.collection(DOCS_COLLECTION).getFullList({
            filter: `project_id = "${id}"`,
        })
        for (const doc of docs) {
            await pb.collection(DOCS_COLLECTION).delete(doc.id)
        }
        await pb.collection(PROJECTS_COLLECTION).delete(id)
        return
    } catch (err) {
        console.warn('PB delete project failed, deleting from localStorage:', err.message)
    }

    // localStorage
    lsSet(LS_PROJECTS, lsGet(LS_PROJECTS).filter(p => p.id !== id))
    lsSet(LS_DOCS, lsGet(LS_DOCS).filter(d => d.project_id !== id))
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
        // Also cache to localStorage
        const doc = {
            id: record.id,
            project_id: projectId,
            fileName: record.fileName,
            content: record.content,
            type: record.type,
            createdAt: record.created,
        }
        const docs = lsGet(LS_DOCS)
        docs.unshift(doc)
        lsSet(LS_DOCS, docs)
        return { id: record.id, fileName: record.fileName, content: record.content, type: record.type, createdAt: record.created }
    } catch (err) {
        console.warn('PB save document failed, using localStorage:', err.message)
    }

    // localStorage
    const doc = { id: generateId(), project_id: projectId, fileName, content, type, createdAt: new Date().toISOString() }
    const docs = lsGet(LS_DOCS)
    docs.unshift(doc)
    lsSet(LS_DOCS, docs)
    return doc
}

export async function deleteDocument(projectId, docId) {
    try {
        await pb.collection(DOCS_COLLECTION).delete(docId)
    } catch (err) {
        console.warn('PB delete doc failed:', err.message)
    }
    // Always clean localStorage too
    lsSet(LS_DOCS, lsGet(LS_DOCS).filter(d => d.id !== docId))
}

// ── Annotations ───────────────────────────────────

export async function getAnnotations(docId) {
    try {
        const records = await pb.collection(ANNOTATIONS_COLLECTION).getFullList({
            filter: `document_id = "${docId}"`,
            sort: '-created',
        })
        return records.map(r => ({
            id: r.id,
            document_id: r.document_id,
            project_id: r.project_id,
            type: r.type,
            text: r.text,
            color: r.color,
            note: r.note,
            range: r.range,
            data: r.data,
            createdAt: r.created,
        }))
    } catch {
        // fall through to localStorage
    }

    return lsGet(LS_ANNOTATIONS).filter(a => a.document_id === docId)
}

export async function getAllAnnotations() {
    try {
        const records = await pb.collection(ANNOTATIONS_COLLECTION).getFullList({ sort: '-created' })
        return records.map(r => ({
            id: r.id,
            document_id: r.document_id,
            project_id: r.project_id,
            type: r.type,
            text: r.text,
            color: r.color,
            note: r.note,
            range: r.range,
            data: r.data,
            fileName: r.fileName,
            createdAt: r.created,
        }))
    } catch {
        // fall through
    }

    return lsGet(LS_ANNOTATIONS)
}

export async function saveAnnotation(data) {
    try {
        const record = await pb.collection(ANNOTATIONS_COLLECTION).create(data)
        return { ...data, id: record.id, createdAt: record.created }
    } catch (err) {
        console.warn('PB save annotation failed:', err.message)
    }

    const annotation = { ...data, id: generateId(), createdAt: new Date().toISOString() }
    const all = lsGet(LS_ANNOTATIONS)
    all.unshift(annotation)
    lsSet(LS_ANNOTATIONS, all)
    return annotation
}

export async function updateAnnotation(id, data) {
    try {
        await pb.collection(ANNOTATIONS_COLLECTION).update(id, data)
        return
    } catch (err) {
        console.warn('PB update annotation failed:', err.message)
    }

    const all = lsGet(LS_ANNOTATIONS)
    const idx = all.findIndex(a => a.id === id)
    if (idx >= 0) {
        all[idx] = { ...all[idx], ...data }
        lsSet(LS_ANNOTATIONS, all)
    }
}

export async function deleteAnnotation(id) {
    try {
        await pb.collection(ANNOTATIONS_COLLECTION).delete(id)
    } catch (err) {
        console.warn('PB delete annotation failed:', err.message)
    }
    lsSet(LS_ANNOTATIONS, lsGet(LS_ANNOTATIONS).filter(a => a.id !== id))
}

// ── Real-time Subscriptions ───────────────────────

export function subscribeToChanges(onUpdate) {
    let cancelled = false
    const handler = () => {
        if (!cancelled) debouncedCallback(onUpdate)
    }

    pb.collection(PROJECTS_COLLECTION).subscribe('*', handler)
        .catch(err => console.warn('Subscribe projects failed:', err.message))
    pb.collection(DOCS_COLLECTION).subscribe('*', handler)
        .catch(err => console.warn('Subscribe docs failed:', err.message))

    return () => {
        cancelled = true
        pb.collection(PROJECTS_COLLECTION).unsubscribe('*').catch(() => { })
        pb.collection(DOCS_COLLECTION).unsubscribe('*').catch(() => { })
    }
}
