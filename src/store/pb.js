/**
 * PocketBase client configuration for HoSo Reader.
 * Connects to db.mkg.vn for project/document sync.
 */
import PocketBase from 'pocketbase'

const pb = new PocketBase('https://db.mkg.vn')

// Disable auto-cancellation for concurrent requests
pb.autoCancellation(false)

// Listen for auth changes - if token becomes invalid, clear it
pb.authStore.onChange(() => {
    if (!pb.authStore.isValid) {
        pb.authStore.clear()
    }
})

export default pb
