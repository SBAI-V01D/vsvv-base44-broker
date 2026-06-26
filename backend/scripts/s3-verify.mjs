import { Client } from 'minio';

const CFG = [
  { name: 'Aktuelle (.env)', key: 'EXO_751d6152d90b46dbaed77459e68a7a50', secret: '928f5529-7c01-4417-9db9-ef831679e872' },
  { name: 'Original (1. Set)', key: 'EXO62ad60fc23f324501c53eb9e',         secret: 'cAJsQQeS_1I35ZUfwtVkWbKgXBOQ3H2mlGm34kNumgw' },
];

const ENDPOINT = 'sos-ch-dk-2.exo.io';
const BUCKET = 'vsvv-premium-broker-app-documentuploads';
const REGION = 'ch-dk-2';

for (const c of CFG) {
  console.log('Teste: ' + c.name);
  console.log('  Key:    ' + c.key.slice(0, 20) + '...');

  const client = new Client({
    endPoint: ENDPOINT,
    port: 443,
    useSSL: true,
    accessKey: c.key,
    secretKey: c.secret,
    region: REGION,
  });

  try {
    const exists = await client.bucketExists(BUCKET);
    console.log('  bucketExists: ' + exists);
    if (exists) {
      console.log('  -> OK! Bucket vorhanden');
    }
  } catch (e) {
    console.log('  bucketExists Error: ' + e.code);
    console.log('  Nachricht: ' + e.message);
    console.log('  -> ' + (e.code === 'InvalidAccessKeyId' ? 'Key-Format falsch (EXO_ mit Underscore?)' : e.code === 'AccessDenied' ? 'Key gueltig, aber kei Permission' : 'Anderer Fehler'));
  }

  try {
    const ok = await client.putObject(BUCKET, '_verify_test.txt', Buffer.from('test'), 4, { 'Content-Type': 'text/plain' });
    console.log('  putObject: OK');
    await client.removeObject(BUCKET, '_verify_test.txt');
  } catch (e) {
    console.log('  putObject Error: ' + e.code);
  }

  console.log('');
}
