/**
 * OCR Upload + Extraction End-to-End Test
 *
 * 1. Login als Admin
 * 2. PDF hochlade (POST /api/upload/file)
 * 3. Extraction triggere (POST /api/document/extract)
 * 4. Resultat prüfe
 *
 * npx tsx src/test-ocr.ts
 */

import { PrismaClient } from '@prisma/client'
import { readFileSync } from 'fs'

const prisma = new PrismaClient()
const API = 'http://localhost:3003'
const ORG_ID = 'org-001'

async function main() {
  console.log('='.repeat(60))
  console.log('📤 OCR Upload End-to-End Test')
  console.log('='.repeat(60))

  // ── Schritt 1: Admin user finde ──────────────────────────────────────────
  console.log('\n1️⃣  Admin User finde...')
  const user = await prisma.user.findFirst({
    where: { organization_id: ORG_ID, role: 'admin' },
  })

  if (!user) {
    console.log('❌ Kei Admin-User gfunde in Org', ORG_ID)
    console.log('   Bitte sicherstelle dass de Admin existiert')
    return
  }
  console.log(`   ✅ User: ${user.name || user.email} (${user.id})`)
  console.log(`   📧 Login als: test@test.ch`)

  // ── Schritt 2: Login via API (JWT hole) ──────────────────────────────────
  console.log('\n2️⃣  Login (JWT hole)...')
  const loginRes = await fetch(`${API}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'test@test.ch',
      password: 'Test1234!',
    }),
  })

  if (!loginRes.ok) {
    const errText = await loginRes.text()
    console.log(`   ❌ Login fehlgschlage: ${loginRes.status}`)
    console.log(`   Response: ${errText.substring(0, 200)}`)
    return
  }

  const loginData = await loginRes.json() as any
  const accessToken = loginData.accessToken || loginData.data?.accessToken
  console.log(`   ✅ JWT Token: ${accessToken ? accessToken.substring(0, 30) + '...' : 'N/A'}`)

  if (!accessToken) {
    console.log('❌ Kei Token im Login-Response')
    return
  }

  // ── Schritt 3: PDF hochlade ──────────────────────────────────────────────
  console.log('\n3️⃣  Helsana Police PDF hochlade...')
  const pdfPath = '/app/TEMP_DATA/König Lau_Police 2026 Helsana.pdf'

  try {
    const pdfBuffer = readFileSync(pdfPath)
    const blob = new Blob([pdfBuffer], { type: 'application/pdf' })
    const formData = new FormData()
    formData.append('file', blob, 'König Lau_Police 2026 Helsana.pdf')

    const uploadRes = await fetch(`${API}/api/upload/file`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'x-organization-id': ORG_ID,
      },
      body: formData,
    })

    if (!uploadRes.ok) {
      const errText = await uploadRes.text()
      console.log(`   ❌ Upload fehlgschlage: ${uploadRes.status}`)
      console.log(`   Response: ${errText}`)
      return
    }

    const uploadData = await uploadRes.json() as any
    const documentId = uploadData.data?.documentId || uploadData.documentId
    const fileKey = uploadData.data?.key || uploadData.key
    console.log(`   ✅ PDF hochgelade: documentId=${documentId}, key=${fileKey}`)
  } catch (err) {
    console.log(`   ❌ Upload exception: ${err}`)
    return
  }

  // ── Schritt 4: Extraction triggere ───────────────────────────────────────
  console.log('\n4️⃣  Document Extraction triggere...')
  // Find the document we just uploaded
  const doc = await prisma.document.findFirst({
    where: {
      organization_id: ORG_ID,
      name: { contains: 'König Lau' },
    },
    orderBy: { uploaded_at: 'desc' },
  })

  if (!doc) {
    console.log('   ❌ Dokument nöd in DB gfunde')
    return
  }
  console.log(`   ✅ Dokument gfunge: ${doc.id} — ${doc.name}`)

  // ── Schritt 5: Prüef ob Extraction Worker verfügbar ──────────────────────
  console.log('\n5️⃣  Prüef Extraction Status...')
  console.log(`   📄 Dokument: ${doc.name}`)
  console.log(`   📏 Grössi: ${doc.file_size} bytes`)
  console.log(`   📁 File Key: ${doc.file_key}`)
  console.log(`   📅 Uploaded: ${doc.uploaded_at}`)
  console.log(`   🏷️  MIME: ${doc.mime_type}`)

  // Check if the extraction endpoint exists
  try {
    const extractEndpoint = `${API}/api/document/extract`
    const extractRes = await fetch(extractEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'x-organization-id': ORG_ID,
      },
      body: JSON.stringify({ documentId: doc.id }),
    })
    console.log(`   🔄 Extraction trigger: ${extractRes.status}`)
    const extractData = await extractRes.text()
    console.log(`   Response: ${extractData.substring(0, 500)}`)
  } catch (err) {
    console.log(`   ⚠️ Extraction endpoint nit verfiegbar: ${err}`)
    console.log('   (Cha sin wenn de Service/BullMQ nöd lauft)')
  }

  console.log('\n' + '='.repeat(60))
  console.log('📤 OCR Test abgschlosse!')
  console.log('='.repeat(60))
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
