import PocketBase from 'pocketbase';
import fs from 'fs';

const log = (msg) => { console.log(msg); fs.appendFileSync('flow-test.log', msg + '\n'); };

// Simulate the EXACT flow the browser does:
// 1. Create PocketBase client (same as pb.js)
const pb = new PocketBase('https://db.mkg.vn');
pb.autoCancellation(false);

// 2. Login via admins auth (same as LoginScreen.jsx)
log('Step 1: Admin login...');
try {
    await pb.admins.authWithPassword('quy28181818@gmail.com', '@Mkg201444');
    log('  isValid: ' + pb.authStore.isValid);
    log('  token length: ' + pb.authStore.token?.length);
} catch (e) {
    log('  Login FAILED: ' + e.status + ' ' + e.message);
    // Try _superusers collection instead (PB v0.23+)
    log('  Trying _superusers...');
    try {
        await pb.collection('_superusers').authWithPassword('quy28181818@gmail.com', '@Mkg201444');
        log('  _superusers OK: ' + pb.authStore.isValid);
    } catch (e2) {
        log('  _superusers FAILED: ' + e2.status);
    }
}

// 3. Fetch projects (same as projectStore.js getProjects)
log('Step 2: getFullList from hoso_projects...');
try {
    const projects = await pb.collection('hoso_projects').getFullList();
    log('  Got ' + projects.length + ' projects');
    projects.forEach(p => {
        log('  Project: ' + JSON.stringify(p));
    });
} catch (e) {
    log('  FAILED: ' + e.status + ' ' + JSON.stringify(e.data));
}

// 4. Fetch documents
log('Step 3: getFullList from hoso_documents...');
try {
    const docs = await pb.collection('hoso_documents').getFullList();
    log('  Got ' + docs.length + ' documents');
    docs.forEach(d => {
        log('  Doc: ' + JSON.stringify(d));
    });
} catch (e) {
    log('  FAILED: ' + e.status + ' ' + JSON.stringify(e.data));
}

log('DONE');
