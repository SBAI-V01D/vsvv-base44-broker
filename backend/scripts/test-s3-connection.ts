/**
 * avaSysAIByNik — Exoscale S3 Connection Quick-Check
 *
 * Testet Verbindig zu Exoscale SOS: Bucket check, Upload, Presigned URL, Löschig.
 * Lauf mit: npx tsx scripts/test-s3-connection.ts
 *
 * Environment (via .env oder export):
 *   S3_ENDPOINT, S3_REGION, S3_BUCKET, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY
 */

import { Client } from 'minio';
import crypto from 'node:crypto';

const {
  S3_ENDPOINT: RAW_ENDPOINT,
  S3_REGION: REGION,
  S3_BUCKET: BUCKET,
  S3_ACCESS_KEY_ID: ACCESS_KEY,
  S3_SECRET_ACCESS_KEY: SECRET_KEY,
} = process.env;

if (!RAW_ENDPOINT || !ACCESS_KEY || !SECRET_KEY || !BUCKET) {
  console.log('❌ Fahlendi Env-Vars: S3_ENDPOINT, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY, S3_BUCKET');
  console.log('   Setz si im .env oder export:');
  console.log('');
  console.log('   export S3_ENDPOINT=https://sos-ch-dk-2.exo.io');
  console.log('   export S3_REGION=ch-dk-2');
  console.log('   export S3_BUCKET=dein-bucket');
  console.log('   export S3_ACCESS_KEY_ID=EXO...');
  console.log('   export S3_SECRET_ACCESS_KEY=...');
  process.exit(1);
}

// Parse endpoint URL
const url = new URL(RAW_ENDPOINT);
const ENDPOINT = url.hostname;
const PORT = parseInt(url.port, 10) || (url.protocol === 'https:' ? 443 : 80);
const USE_SSL = url.protocol === 'https:';
const REGION_FINAL = REGION || 'ch-dk-2';

console.log('');
console.log('🔌  S3 Connection Check');
console.log('──────────────────────────');
console.log(`  Endpoint : ${ENDPOINT}:${PORT} (SSL: ${USE_SSL})`);
console.log(`  Region   : ${REGION_FINAL}`);
console.log(`  Bucket   : ${BUCKET}`);
console.log(`  Access   : ${ACCESS_KEY.slice(0, 8)}...${SECRET_KEY ? SECRET_KEY.slice(-4) : ''}`);
console.log('');

const client = new Client({
  endPoint: ENDPOINT,
  port: PORT,
  useSSL: USE_SSL,
  accessKey: ACCESS_KEY,
  secretKey: SECRET_KEY,
  region: REGION_FINAL,
});

async function main() {
  // 1. Check if bucket exists
  console.log('📦  Step 1: Bucket existiert?');
  const exists = await client.bucketExists(BUCKET);
  if (!exists) {
    console.log(`  ⚠️   Bucket '${BUCKET}' existiert nöd.`);
    console.log('  👉  Erstellne im Exoscale Web-Console:');
    console.log(`      Storage → Object Storage → Add Bucket → "${BUCKET}" → ${REGION_FINAL}`);
    console.log('');
    console.log('  Oder via Exoscale CLI:');
    console.log(`      exo storage bucket create ${BUCKET} --zone ${REGION_FINAL}`);
    console.log('');
    process.exit(0);
  }
  console.log('  ✅  Bucket existiert!\n');

  // 2. Upload test file
  console.log('📤  Step 2: Test-File ufelade...');
  const testContent = Buffer.from(`avaSysAIByNik Premium Broker — S3 Test ${new Date().toISOString()}\n`);
  const key = `_s3test_${crypto.randomUUID()}.txt`;
  await client.putObject(BUCKET, key, testContent, testContent.length, {
    'Content-Type': 'text/plain',
    'X-Amz-Meta-Test': 'true',
  });
  console.log(`  ✅  Uploaded: ${key} (${testContent.length} Bytes)\n`);

  // 3. Generate presigned URL
  console.log('🔑  Step 3: Presigned URL generiere...');
  const presignedUrl = await client.presignedGetObject(BUCKET, key, 3600);
  console.log(`  ✅  URL (1h): ${presignedUrl}\n`);

  // 4. List objects
  console.log('📋  Step 4: Objects listen...');
  const stream = client.listObjects(BUCKET, '_s3test_', true);
  const objects: string[] = await new Promise((resolve, reject) => {
    stream.on('data', (obj) => resolve((prev) => [...prev, obj.name]));
    stream.on('end', () => resolve());
    stream.on('error', reject);
  });
  objects.sort();
  console.log(`  ✅  ${objects.length} Test-Object(s) gfund.\n`);

  // 5. Cleanup
  console.log('🧹  Step 5: Cleanup...');
  await client.removeObject(BUCKET, key);
  console.log('  ✅  Test-File glöscht.\n');

  // 6. Statistik
  console.log('📊  Step 6: Bucket-Statistik...');
  const objectsAll: string[] = [];
  const allStream = client.listObjects(BUCKET, '', true);
  await new Promise<void>((resolve, reject) => {
    allStream.on('data', (obj) => objectsAll.push(obj.name));
    allStream.on('end', () => resolve());
    allStream.on('error', reject);
  });
  const totalSize = objectsAll.reduce((sum, _) => sum, 0); // placeholder
  console.log(`  📦  ${objectsAll.length} Total Objects im Bucket\n`);

  console.log('──────────────────────────');
  console.log('🎉  S3 Connection — ALLES GUET!');
  console.log('');
}

main().catch((err) => {
  if (err?.code === 'AccessDenied' || err?.code === 'NoSuchBucket') {
    console.log(`  ❌  Bucket '${BUCKET}' existiert nöd oder kei Zugriff.`);
    console.log('  👉  Erstellne im Exoscale Web-Console und versuechs nomol.');
  } else {
    console.log('\n❌  S3 Connection — FÄHLER:');
    console.log(`  ${err?.code || err?.message || err}`);
  }
  process.exit(1);
});
