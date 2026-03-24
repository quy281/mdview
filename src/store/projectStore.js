/**
 * Project Store – PocketBase + IndexedDB hybrid data layer.
 * Collections: hoso_projects, hoso_documents, hoso_annotations on db.mkg.vn
 * Falls back to IndexedDB if PocketBase is unavailable or hanging.
 */
import pb from './pb'
import { idbGet, idbSet } from './idb'

const PROJECTS_COLLECTION = 'hoso_projects'
const DOCS_COLLECTION = 'hoso_documents'
const ANNOTATIONS_COLLECTION = 'hoso_annotations'

// localStorage keys (now used for IndexedDB)
const LS_PROJECTS = 'hoso_ls_projects'
const LS_DOCS = 'hoso_ls_documents'
const LS_ANNOTATIONS = 'hoso_ls_annotations'

// ── Helpers ───────────────────────────────────────

function generateId() {
    return 'ls_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8)
}

let _lastPBSuccess = 0

function withTimeout(promise, ms) {
    // If PB was reachable recently, give it more time to avoid false timeouts
    const timeout = (Date.now() - _lastPBSuccess < 15000) ? ms * 2 : ms
    return Promise.race([
        promise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('PocketBase timeout')), timeout))
    ])
}

// Per-call debounce (no global timer leak)
function makeDebounced(delay = 100) {
    let timer = null
    return (fn) => {
        clearTimeout(timer)
        timer = setTimeout(fn, delay)
    }
}

// ── Projects ──────────────────────────────────────

export async function getProjects() {
    try {
        // Fetch projects + docs in parallel with timeout 8s to prevent UI hanging
        const [projects, docs] = await withTimeout(Promise.all([
            pb.collection(PROJECTS_COLLECTION).getFullList(),
            pb.collection(DOCS_COLLECTION).getFullList(),
        ]), 8000)

        _lastPBSuccess = Date.now()

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

        // Sync to IndexedDB as backup (no 5MB storage limit)
        await idbSet(LS_PROJECTS, result.map(p => ({ id: p.id, name: p.name, createdAt: p.createdAt })))
        await idbSet(LS_DOCS, result.flatMap(p =>
            p.documents.map(d => ({ ...d, project_id: p.id }))
        ))

        return result
    } catch (err) {
        console.warn('PocketBase unavailable, using idb fallback:', err.message)
    }

    // fallback
    const projects = (await idbGet(LS_PROJECTS)) || []
    const docs = (await idbGet(LS_DOCS)) || []
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
        console.warn('PB create project failed, using idb:', err.message)
    }

    const project = { id: generateId(), name: trimmed, createdAt: new Date().toISOString() }
    const projects = (await idbGet(LS_PROJECTS)) || []
    projects.unshift(project)
    await idbSet(LS_PROJECTS, projects)
    return { ...project, documents: [] }
}

export async function deleteProject(id) {
    try {
        // Also delete annotations for this project
        const [docs, annotations] = await Promise.all([
            pb.collection(DOCS_COLLECTION).getFullList({ filter: `project_id = "${id}"` }),
            pb.collection(ANNOTATIONS_COLLECTION).getFullList({ filter: `project_id = "${id}"` }),
        ])
        await Promise.all([
            ...docs.map(doc => pb.collection(DOCS_COLLECTION).delete(doc.id)),
            ...annotations.map(ann => pb.collection(ANNOTATIONS_COLLECTION).delete(ann.id)),
        ])
        await pb.collection(PROJECTS_COLLECTION).delete(id)
    } catch (err) {
        console.warn('PB delete project failed, deleting from idb:', err.message)
    }

    // idb — also clean up annotations
    await idbSet(LS_PROJECTS, ((await idbGet(LS_PROJECTS)) || []).filter(p => p.id !== id))
    await idbSet(LS_DOCS, ((await idbGet(LS_DOCS)) || []).filter(d => d.project_id !== id))
    await idbSet(LS_ANNOTATIONS, ((await idbGet(LS_ANNOTATIONS)) || []).filter(a => a.project_id !== id))
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
        _lastPBSuccess = Date.now()
        const doc = {
            id: record.id,
            project_id: projectId,
            fileName: record.fileName,
            content: record.content,
            type: record.type,
            createdAt: record.created,
        }
        // Write-through: update IDB docs cache immediately
        const docs = (await idbGet(LS_DOCS)) || []
        docs.unshift(doc)
        await idbSet(LS_DOCS, docs)

        // Also ensure the project exists in IDB projects cache
        const cachedProjects = (await idbGet(LS_PROJECTS)) || []
        if (!cachedProjects.find(p => p.id === projectId)) {
            cachedProjects.unshift({ id: projectId, name: projectId, createdAt: new Date().toISOString() })
            await idbSet(LS_PROJECTS, cachedProjects)
        }

        return { id: record.id, fileName: record.fileName, content: record.content, type: record.type, createdAt: record.created }
    } catch (err) {
        console.warn('PB save document failed, using idb:', err.message)
    }

    const doc = { id: generateId(), project_id: projectId, fileName, content, type, createdAt: new Date().toISOString() }
    const docs = (await idbGet(LS_DOCS)) || []
    docs.unshift(doc)
    await idbSet(LS_DOCS, docs)
    return doc
}

export async function deleteDocument(projectId, docId) {
    try {
        // Also delete annotations for this document
        const annotations = await pb.collection(ANNOTATIONS_COLLECTION).getFullList({
            filter: `document_id = "${docId}"`,
        })
        await Promise.all(annotations.map(a => pb.collection(ANNOTATIONS_COLLECTION).delete(a.id)))
        await pb.collection(DOCS_COLLECTION).delete(docId)
    } catch (err) {
        console.warn('PB delete doc failed:', err.message)
    }
    // Always clean IDB too (including annotations for this doc)
    await idbSet(LS_DOCS, ((await idbGet(LS_DOCS)) || []).filter(d => d.id !== docId))
    await idbSet(LS_ANNOTATIONS, ((await idbGet(LS_ANNOTATIONS)) || []).filter(a => a.document_id !== docId))
}

// ── Annotations ───────────────────────────────────

export async function getAnnotations(docId) {
    try {
        const records = await withTimeout(pb.collection(ANNOTATIONS_COLLECTION).getFullList({
            filter: `document_id = "${docId}"`,
            sort: '-created',
        }), 4000)
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
        // fall through to idb
    }

    return ((await idbGet(LS_ANNOTATIONS)) || []).filter(a => a.document_id === docId)
}

export async function getAllAnnotations() {
    try {
        const records = await withTimeout(pb.collection(ANNOTATIONS_COLLECTION).getFullList({ sort: '-created' }), 4000)
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

    return (await idbGet(LS_ANNOTATIONS)) || []
}

export async function saveAnnotation(data) {
    try {
        const record = await pb.collection(ANNOTATIONS_COLLECTION).create(data)
        return { ...data, id: record.id, createdAt: record.created }
    } catch (err) {
        console.warn('PB save annotation failed:', err.message)
    }

    const annotation = { ...data, id: generateId(), createdAt: new Date().toISOString() }
    const all = (await idbGet(LS_ANNOTATIONS)) || []
    all.unshift(annotation)
    await idbSet(LS_ANNOTATIONS, all)
    return annotation
}

export async function updateAnnotation(id, data) {
    try {
        await pb.collection(ANNOTATIONS_COLLECTION).update(id, data)
        return
    } catch (err) {
        console.warn('PB update annotation failed:', err.message)
    }

    const all = (await idbGet(LS_ANNOTATIONS)) || []
    const idx = all.findIndex(a => a.id === id)
    if (idx >= 0) {
        all[idx] = { ...all[idx], ...data }
        await idbSet(LS_ANNOTATIONS, all)
    }
}

export async function deleteAnnotation(id) {
    try {
        await pb.collection(ANNOTATIONS_COLLECTION).delete(id)
    } catch (err) {
        console.warn('PB delete annotation failed:', err.message)
    }
    await idbSet(LS_ANNOTATIONS, ((await idbGet(LS_ANNOTATIONS)) || []).filter(a => a.id !== id))
}

// ── Real-time Subscriptions ───────────────────────

export function subscribeToChanges(onUpdate) {
    let cancelled = false
    const debounced = makeDebounced(100)
    const handler = () => {
        if (!cancelled) debounced(onUpdate)
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
