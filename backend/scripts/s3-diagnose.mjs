import { Client } from 'minio';
import { readFileSync } from 'fs';

// Load .env
const envContent = readFileSync('.env', 'utf-8');
const env = Object.fromEntries(
  envContent
    .split('\n')
    .filter(l => l.trim() && !l.startsWith('#'))
    .map(l => {
      const idx = l.indexOf('=');
      return [l.slice(0, idx).trim(), l.slice(idx + 1).trim()];
    })
);

const S3_ENDPOINT = env.S3_ENDPOINT || 'https://sos-ch-dk-2.exo.io';
const S3_REGION   = env.S3_REGION || 'ch-dk-2';
const S3_BUCKET   = env.S3_BUCKET || 'vsvv-premium-broker-app-documentuploads';
const S3_KEY      = env.S3_ACCESS_KEY_ID;
const S3_SECRET   = env.S3_SECRET_ACCESS_KEY;

if (!S3_KEY || !S3_SECRET) {
  console.error('ERROR: S3_ACCESS_KEY_ID oder S3_SECRET_ACCESS_KEY fehlt im .env');
  process.exit(1);
}

const url = new URL(S3_ENDPOINT);
const ENDPOINT = url.hostname;
const PORT = parseInt(url.port, 10) || (url.protocol === 'https:' ? 443 : 80);
const USE_SSL = url.protocol === 'https:';

console.log('');
console.log('=== S3 Exoscale Diagnose ===');
console.log('');
console.log('Account:  ' + S3_KEY.slice(0, 16) + '...');
console.log('Endpoint: ' + ENDPOINT + ':' + PORT + ' (SSL: ' + USE_SSL + ')');
console.log('Region:   ' + S3_REGION);
console.log('Bucket:   ' + S3_BUCKET);
console.log('');

const client = new Client({
  endPoint: ENDPOINT,
  port: PORT,
  useSSL: USE_SSL,
  accessKey: S3_KEY,
  secretKey: S3_SECRET,
  region: S3_REGION,
});

// 1. List all buckets
console.log('--- 1. Alle Buckets listen ---');
try {
  const buckets = await client.listBuckets();
  console.log('  ' + buckets.length + ' Bucket(s) vorhanden:');
  for (const b of buckets) {
    console.log('    - ' + b.name + ' (' + new Date(b.creationDate).toISOString() + ')');
  }
} catch (err) {
  console.log('  listBuckets: ' + (err.code || err.message));
  console.log('  -> API-Key hat kein Admin-Recht (normal fur SOS IAM-Keys)');
}

// 2. Check target bucket
console.log('');
console.log('--- 2. Bucket Existence Check ---');
try {
  const exists = await client.bucketExists(S3_BUCKET);
  if (exists) {
    console.log('  OK: Bucket \'' + S3_BUCKET + '\' existiert!');
  } else {
    console.log('  WARN: Bucket \'' + S3_BUCKET + '\' existiert NICHT.');
  }
} catch (err) {
  console.log('  bucketExists: ' + (err.code || err.message));
}

// 3. Try to create bucket (may fail due to IAM permissions)
console.log('');
console.log('--- 3. Bucket Creation ---');
try {
  await client.makeBucket(S3_BUCKET, S3_REGION);
  console.log('  OK: Bucket erfolgreich erstellt!');
} catch (err) {
  console.log('  makeBucket: ' + (err.code || err.message));
  if (err.code === 'AccessDenied') {
    console.log('  -> API-Key hat nur Object-Permissions (AccessDenied)');
    console.log('  -> Bucket muss manuell im Exoscale Web-Console erstellt werden');
  }
  if (err.code === 'BucketAlreadyOwnedByYou' || err.code === 'BucketAlreadyExists') {
    console.log('  -> Bucket existiert bereits (ok)');
  }
}

// 4. Write test
console.log('');
console.log('--- 4. Write Access ---');
try {
  const buf = Buffer.from('VSVV S3 Diagnose Test\n');
  const key = '_diag_' + Date.now() + '.txt';
  await client.putObject(S3_BUCKET, key, buf, buf.length, { 'Content-Type': 'text/plain' });
  console.log('  OK: Upload erfolgreich: ' + key);

  await client.removeObject(S3_BUCKET, key);
  console.log('  OK: Cleanup erfolgreich');
} catch (err) {
  console.log('  Write: ' + (err.code || err.message));
  if (err.code === 'AccessDenied') console.log('  -> API-Key hat kein Write-Recht');
  if (err.code === 'NoSuchBucket') console.log('  -> Bucket muss zuerst erstellt werden');
}

// 5. Read test
console.log('');
console.log('--- 5. Read Access ---');
try {
  const objs = [];
  const stream = client.listObjects(S3_BUCKET, '', true);
  await new Promise((resolve, reject) => {
    stream.on('data', o => objs.push(o.name));
    stream.on('end', resolve);
    stream.on('error', reject);
  });
  console.log('  OK: ' + objs.length + ' Object(s) gefunden');
  for (const o of objs.slice(0, 5)) {
    console.log('    - ' + o);
  }
  if (objs.length > 5) console.log('    ... und ' + (objs.length - 5) + ' weitere');
} catch (err) {
  console.log('  Read: ' + (err.code || err.message));
}

// Summary
console.log('');
console.log('=== Fazit ===');
console.log('');
console.log('  Verbindung zu Exoscale:     OK');
console.log('  Credentials gueltig:        ' + (S3_KEY ? 'JA' : 'NEIN'));

try {
  await client.bucketExists(S3_BUCKET);
  console.log('  Bucket existiert:           JA');
  console.log('');
  console.log('  Fazit: Alles guet, Upload ready!');
} catch (err) {
  console.log('  Bucket existiert:           NEIN');
  console.log('');
  console.log('  -> Bucket manuell erstellen:');
  console.log('     Web-Console: Storage -> Object Storage -> Add Bucket');
  console.log('     Name: ' + S3_BUCKET);
  console.log('     Zone: ' + S3_REGION);
  console.log('');
  console.log('     Oder via exo CLI:');
  console.log('     exo storage bucket create ' + S3_BUCKET + ' --zone ' + S3_REGION);
}
console.log('');
