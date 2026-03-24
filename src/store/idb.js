export const DB_NAME = 'hoso_db'
export const STORE_NAME = 'keyval'

let dbPromise = null

function getDB() {
    if (!dbPromise) {
        dbPromise = new Promise((resolve, reject) => {
            const req = indexedDB.open(DB_NAME, 1)
            req.onupgradeneeded = () => {
                req.result.createObjectStore(STORE_NAME)
            }
            req.onsuccess = () => resolve(req.result)
            req.onerror = () => reject(req.error)
        })
    }
    return dbPromise
}

export async function idbGet(key) {
    try {
        const db = await getDB()
        return new Promise((resolve, reject) => {
            const req = db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).get(key)
            req.onsuccess = () => resolve(req.result)
            req.onerror = () => reject(req.error)
        })
    } catch (e) {
        console.warn('idbGet error:', e)
        return null
    }
}

export async function idbSet(key, val) {
    try {
        const db = await getDB()
        return new Promise((resolve, reject) => {
            const req = db.transaction(STORE_NAME, 'readwrite').objectStore(STORE_NAME).put(val, key)
            req.onsuccess = () => resolve()
            req.onerror = () => reject(req.error)
        })
    } catch (e) {
        console.warn('idbSet error:', e)
    }
}

export async function idbDel(key) {
    try {
        const db = await getDB()
        return new Promise((resolve, reject) => {
            const req = db.transaction(STORE_NAME, 'readwrite').objectStore(STORE_NAME).delete(key)
            req.onsuccess = () => resolve()
            req.onerror = () => reject(req.error)
        })
    } catch (e) {
        console.warn('idbDel error:', e)
    }
}
