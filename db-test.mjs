import PocketBase from 'pocketbase';
import fs from 'fs';

const log = (msg) => { console.log(msg); fs.appendFileSync('verify.log', msg + '\n'); };
const pb = new PocketBase('https://db.mkg.vn');
pb.autoCancellation(false);
await pb.admins.authWithPassword('quy28181818@gmail.com', '@Mkg201444');

// Verify hoso_documents fields
const docsCol = await pb.collections.getOne('hoso_documents');
log('hoso_documents fields: ' + JSON.stringify(docsCol.fields?.map(f => f.name + ':' + f.type)));

// Create a project
const proj = await pb.collection('hoso_projects').create({ name: 'Hồ Sơ Test' });
log('Created project: ' + proj.id + ' name=' + proj.name);

// Create a document in that project
const doc = await pb.collection('hoso_documents').create({
    project_id: proj.id,
    fileName: 'test.md',
    content: '# Hello World',
    type: 'md',
});
log('Created doc: ' + doc.id + ' fileName=' + doc.fileName + ' type=' + doc.type);

// List projects
const allProjects = await pb.collection('hoso_projects').getFullList();
log('All projects: ' + allProjects.map(p => p.name).join(', '));

// List docs for this project
const allDocs = await pb.collection('hoso_documents').getFullList();
const projDocs = allDocs.filter(d => d.project_id === proj.id);
log('Docs in project: ' + projDocs.map(d => d.fileName).join(', '));

// Clean up
await pb.collection('hoso_documents').delete(doc.id);
await pb.collection('hoso_projects').delete(proj.id);
log('Cleaned up test data');
log('ALL VERIFICATION PASSED');
