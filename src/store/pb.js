/**
 * PocketBase client configuration for HoSo Reader.
 * Connects to db.mkg.vn for project/document sync.
 */
import PocketBase from 'pocketbase'

const pb = new PocketBase('https://db.mkg.vn')

// Disable auto-cancellation for concurrent requests
pb.autoCancellation(false)

export default pb
