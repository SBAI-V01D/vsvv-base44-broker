import { Client } from 'minio';

const KEY = 'EXO62ad60fc23f324501c53eb9e';
const SECRET = 'cAJsQQeS_1I35ZUfwtVkWbKgXBOQ3H2mlGm34kNumgw';
const BUCKET = 'vsvv-premium-broker-app-documentuploads';
const REGION = 'ch-dk-2';

const client = new Client({
  endPoint: 'sos-ch-dk-2.exo.io',
  port: 443,
  useSSL: true,
  accessKey: KEY,
  secretKey: SECRET,
  region: REGION,
});

console.log('=== DEBUG S3 ===');
console.log('Bucket: ' + BUCKET);
console.log('');

// 1. Direkt en Upload probiere (ohni vorkontrolle)
console.log('1. PutObject (direkt)');
try {
  await client.putObject(BUCKET, '_debug_test.txt', Buffer.from('test'), 4, { 'Content-Type': 'text/plain' });
  console.log('   Ergebnis: UPLOAD OK!');
  await client.removeObject(BUCKET, '_debug_test.txt');
  console.log('   Cleanup: OK');
} catch (e) {
  console.log('   Error: ' + e.code);
  console.log('   Message: ' + e.message);
  if (e.code === 'NoSuchBucket') console.log('   -> Bucket existiert NED (laut Exoscale API)');
  if (e.code === 'AccessDenied') console.log('   -> Bucket existiert, aber kei Schreibrecht');
  if (e.code === 'InvalidAccessKeyId') console.log('   -> Falsche Credentials');
}

// 2. HeadBucket
console.log('');
console.log('2. HeadBucket (bucketExists)');
try {
  const exists = await client.bucketExists(BUCKET);
  console.log('   Result: ' + exists);
} catch (e) {
  console.log('   Error: ' + e.code);
  console.log('   Status: ' + (e.statusCode || '?'));
}

// 3. Alternative Endpoint (ohni Port)
console.log('');
console.log('3. Alternative: endPoint mit Port im Host');
try {
  const c2 = new Client({
    endPoint: 'sos-ch-dk-2.exo.io',
    port: 443,
    useSSL: true,
    accessKey: KEY,
    secretKey: SECRET,
    region: REGION,
    pathStyle: true,
  });
  await c2.putObject(BUCKET, '_debug_test2.txt', Buffer.from('test'), 4, { 'Content-Type': 'text/plain' });
  console.log('   Upload OK mit pathStyle!');
  await c2.removeObject(BUCKET, '_debug_test2.txt');
} catch (e) {
  console.log('   Error: ' + e.code);
  console.log('   Message: ' + e.message);
}

console.log('');
console.log('=== fertig ===');
