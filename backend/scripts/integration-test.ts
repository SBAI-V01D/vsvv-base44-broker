// ============================================================================
// VSVV Backend — Integration-Test Suite
// ============================================================================
// Lauf mit: cd backend && npx tsx scripts/integration-test.ts
//
// Testet:
//   - Health Endpoint
//   - CORS (erlaubti + blockierti Origins)
//   - Auth (ohni/ mit JWT)
//   - X-Service-Role (User + Admin)
//   - OPTIONS Preflight
// ============================================================================

import http from 'node:http';
import jwt from 'jsonwebtoken';

const BASE = 'http://localhost:3003';
const JWT_SECRET = process.env.JWT_SECRET!;

type TestResult = { name: string; pass: boolean; detail: string };

async function fetch(
  path: string,
  opts: { method?: string; origin?: string; auth?: string; serviceRole?: boolean } = {},
): Promise<{ status: number; headers: Record<string, string>; body: string }> {
  return new Promise((resolve, reject) => {
    const req = http.request(`${BASE}${path}`, {
      method: opts.method || 'GET',
      headers: {
        ...(opts.origin ? { Origin: opts.origin } : {}),
        ...(opts.auth ? { Authorization: `Bearer ${opts.auth}` } : {}),
        ...(opts.serviceRole ? { 'X-Service-Role': 'true' } : {}),
        ...(opts.method === 'OPTIONS' ? { 'Access-Control-Request-Method': 'GET' } : {}),
      },
    }, (res) => {
      const headers: Record<string, string> = {};
      for (const [k, v] of Object.entries(res.headers)) {
        headers[k.toLowerCase()] = String(v);
      }
      let body = '';
      res.on('data', (c: Buffer) => body += c.toString());
      res.on('end', () => resolve({ status: res.statusCode || 0, headers, body }));
    });
    req.on('error', reject);
    req.end();
  });
}

async function main() {
  const results: TestResult[] = [];
  let passed = 0;
  let failed = 0;

  function check(name: string, pass: boolean, detail: string = '') {
    results.push({ name, pass, detail });
    if (pass) passed++; else failed++;
    console.log(`  ${pass ? '✅' : '❌'} ${name}${detail ? ' — ' + detail : ''}`);
  }

  // --- Tokens ---
  const realAdminId = ''; // wird us DB glade
  const realOrgId = '';

  const adminToken = jwt.sign(
    { id: 'admin-test', email: 'admin@vsvv.ch', role: 'admin', organization_id: 'org-test' },
    JWT_SECRET,
    { expiresIn: '5m' },
  );
  const userToken = jwt.sign(
    { id: 'user-test', email: 'user@vsvv.ch', role: 'user', organization_id: 'org-test' },
    JWT_SECRET,
    { expiresIn: '5m' },
  );

  // ------------------------------------------------------------------
  // 1. Health
  // ------------------------------------------------------------------
  console.log('\n📋 Health:');
  const health = await fetch('/api/health');
  check('Health 200', health.status === 200, String(health.status));
  check('Health DB connected', health.body.includes('"connected":true'));

  // ------------------------------------------------------------------
  // 2. CORS
  // ------------------------------------------------------------------
  console.log('\n📋 CORS:');
  const evil = await fetch('/api/health', { origin: 'https://evil.com' });
  check('evil.com → kei Access-Control-Allow-Origin', !evil.headers['access-control-allow-origin']);

  const local = await fetch('/api/health', { origin: 'http://localhost:3004' });
  check('localhost:3004 → Access-Control-Allow-Origin vorhande',
    !!local.headers['access-control-allow-origin']);

  // OPTIONS Preflight
  const optEvil = await fetch('/api/users', { method: 'OPTIONS', origin: 'https://evil.com' });
  check('OPTIONS evil.com → kei CORS',
    !optEvil.headers['access-control-allow-origin']);

  const optLocal = await fetch('/api/users', { method: 'OPTIONS', origin: 'http://localhost:3004' });
  check('OPTIONS localhost → volle CORS-Headers',
    !!optLocal.headers['access-control-allow-origin']
    && !!optLocal.headers['access-control-allow-methods']
    && !!optLocal.headers['access-control-allow-headers']);

  // ------------------------------------------------------------------
  // 3. Auth
  // ------------------------------------------------------------------
  console.log('\n📋 Auth:');
  const noAuth = await fetch('/api/users');
  check('Ohni JWT → 401', noAuth.status === 401, String(noAuth.status));

  const userAuth = await fetch('/api/users', { auth: userToken });
  // 403 = authentified but org mismatch in tenant middleware
  check('Mit User-JWT → nöd 401', userAuth.status !== 401, String(userAuth.status));

  // ------------------------------------------------------------------
  // 4. X-Service-Role
  // ------------------------------------------------------------------
  console.log('\n📋 X-Service-Role:');
  const userService = await fetch('/api/users', { auth: userToken, serviceRole: true });
  check('User + X-Service-Role → 403',
    userService.status === 403 && userService.body.includes('admin privileges'),
    String(userService.status));

  const adminService = await fetch('/api/users', { auth: adminToken, serviceRole: true });
  check('Admin + X-Service-Role → nöd 403 (auth ok)',
    adminService.status !== 403 && adminService.status !== 401,
    String(adminService.status));

  // ------------------------------------------------------------------
  // 5. Versuech mit echtem Admin us DB
  // ------------------------------------------------------------------
  console.log('\n📋 Admin DB-Test:');
  try {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    const admin = await prisma.user.findFirst({
      where: { role: 'admin' },
      include: { organization: true },
    });
    if (admin) {
      const realAdminJwt = jwt.sign(
        { id: admin.id, email: admin.email, role: admin.role, organization_id: admin.organization_id },
        JWT_SECRET,
        { expiresIn: '5m' },
      );
      const realAdmin = await fetch('/api/users', { auth: realAdminJwt });
      check(`Echte Admin (${admin.email}) → ${realAdmin.status}`,
        realAdmin.status === 200, String(realAdmin.status));

      const realAdminService = await fetch('/api/users', { auth: realAdminJwt, serviceRole: true });
      check(`Echte Admin + X-Service-Role → ${realAdminService.status}`,
        realAdminService.status === 200, String(realAdminService.status));
    } else {
      check('Kei Admin-User in DB', true, 'übergange');
    }
    await prisma.$disconnect();
  } catch (e) {
    check('Admin DB-Test fählgschlage', false, String(e));
  }

  // ------------------------------------------------------------------
  // Summary
  // ------------------------------------------------------------------
  console.log('\n========================================================');
  console.log(`   ${passed} passed, ${failed} failed, ${results.length} total`);
  console.log('========================================================\n');
  process.exit(failed > 0 ? 1 : 0);
}

main();
