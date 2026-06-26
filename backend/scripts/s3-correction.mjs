import { Client } from 'minio';

const KEY = 'EXO62ad60fc23f324501c53eb9e';
const SECRET = 'cAJsQQeS_1I35ZUfwtVkWbKgXBOQ3H2mlGm34kNumgw';
const BUCKET = 'vsvv-permium-broker-app-documentuploads'; // <-- Dine Name!
const REGION = 'ch-dk-2';

const client = new Client({
  endPoint: 'sos-ch-dk-2.exo.io',
  port: 443,
  useSSL: true,
  accessKey: KEY,
  secretKey: SECRET,
  region: REGION,
});

console.log('=== S3 Test mit korrektem Bucket-Name ===');
console.log('Bucket: ' + BUCKET);
console.log('');

// 1. Bucket existiert?
try {
  const exists = await client.bucketExists(BUCKET);
  console.log('bucketExists: ' + exists);
} catch (e) {
  console.log('bucketExists Error: ' + e.code);
}

// 2. Upload Test
try {
  const buf = Buffer.from('VSVV Premium Broker - S3 Test OK!\n');
  const key = '_test_' + Date.now() + '.txt';
  await client.putObject(BUCKET, key, buf, buf.length, { 'Content-Type': 'text/plain' });
  console.log('Upload: OK - ' + key);

  // Presigned URL
  const url = await client.presignedGetObject(BUCKET, key, 3600);
  console.log('Presigned URL: ' + url.slice(0, 100) + '...');

  // Cleanup
  await client.removeObject(BUCKET, key);
  console.log('Cleanup: OK');
} catch (e) {
  console.log('Error: ' + e.code);
  console.log('Message: ' + e.message);
}

// 3. Objects listen
try {
  const objs = [];
  const stream = client.listObjects(BUCKET, '', true);
  await new Promise((resolve, reject) => {
    stream.on('data', o => objs.push(o.name));
    stream.on('end', resolve);
    stream.on('error', reject);
  });
  console.log('Objects im Bucket: ' + objs.length);
  for (const o of objs.slice(0, 10)) {
    console.log('  - ' + o);
  }
} catch (e) {
  console.log('listObjects Error: ' + e.code);
}

console.log('');
console.log('=== FERTIG ===');
