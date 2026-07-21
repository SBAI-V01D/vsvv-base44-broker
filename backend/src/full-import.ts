import { fileURLToPath } from 'url';
/**
 * avaai Full Import — Organisation → Berater → Kunden → Verträge → Dokumente
 *
 * Usage: npx tsx src/full-import.ts
 */

import { PrismaClient } from '@prisma/client'
import { readFileSync, existsSync, readdirSync } from 'fs'
import { resolve, dirname } from 'path'

const prisma = new PrismaClient()
const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = process.env.CUSTOMER_DOCS_DIR || resolve(__dirname, '../../CUSTOMER_DOCS');

// ── Config ─────────────────────────────────────────────────────────────────

const ORG_NAME = 'VSVV'
const ORG_EMAIL = 'info@vsvv.ch'
let ORG_ID = ''

// ── Helpers ─────────────────────────────────────────────────────────────────

function parseDate(val: string | undefined | null): Date | null {
  if (!val || val.trim() === '' || val === '0' || val === '00.00.0000') return null
  const parts = val.trim().split('.')
  if (parts.length === 3) {
    const d = new Date(+parts[2], +parts[1] - 1, +parts[0])
    return isNaN(d.getTime()) ? null : d
  }
  return null
}

function parseCHFloat(val: string | undefined | null): number | null {
  if (!val || val.trim() === '') return null
  const cleaned = val.trim()
    .replace(/'/g, '').replace(/CHF\s*/gi, '')
    .replace(/['"]/g, '').replace(',', '.')
  const n = Number(cleaned)
  return isNaN(n) ? null : n
}

function cleanStr(val: string | undefined | null): string | null {
  if (!val || val.trim() === '') return null
  const trimmed = val.trim()
  if (trimmed === '0' || trimmed === 'Bitte wählen' || trimmed === 'CHF 0.00') return null
  return trimmed
}

function parseBool(val: string | undefined | null): boolean {
  if (!val) return false
  return ['1', 'true', 'ja', 'yes', 'aktiv', 'active'].includes(val.trim().toLowerCase())
}

// ── CSV Parser with multiline support ────────────────────────────────────────

function parseCsvMultiline(content: string, delimiter = ';'): string[][] {
  const rows: string[][] = []
  let currentRow: string[] = []
  let currentField = ''
  let inQuotes = false

  for (let i = 0; i < content.length; i++) {
    const char = content[i]
    const nextChar = content[i + 1]

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentField += '"'
        i++ // skip escaped quote
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === delimiter && !inQuotes) {
      currentRow.push(currentField.trim())
      currentField = ''
    } else if ((char === '\n' || (char === '\r' && nextChar === '\n')) && !inQuotes) {
      if (char === '\r') i++ // skip \r in \r\n
      currentRow.push(currentField.trim())
      currentField = ''
      if (currentRow.some(f => f !== '')) {
        rows.push(currentRow)
      }
      currentRow = []
    } else if (char === '\r' && !inQuotes) {
      currentRow.push(currentField.trim())
      currentField = ''
      if (currentRow.some(f => f !== '')) {
        rows.push(currentRow)
      }
      currentRow = []
    } else {
      currentField += char
    }
  }
  // Last row
  if (currentField.trim() || currentRow.length > 0) {
    currentRow.push(currentField.trim())
    if (currentRow.some(f => f !== '')) {
      rows.push(currentRow)
    }
  }

  return rows
}

// ── Step 1: Organization ──────────────────────────────────────────────────

async function ensureOrganization() {
  console.log('\n=== Schritt 1: Organisation ===')

  let org = await prisma.organization.findFirst({ where: { name: ORG_NAME } })
  if (org) {
    console.log(`  ✅ Organisation "${ORG_NAME}" existiert bereits: ${org.id}`)
    ORG_ID = org.id
    return org
  }

  org = await prisma.organization.create({
    data: {
      name: ORG_NAME,
      type: 'broker',
      status: 'active',
      email: ORG_EMAIL,
    },
  })
  ORG_ID = org.id
  console.log(`  ✅ Organisation "${ORG_NAME}" erstellt: ${ORG_ID}`)
  return org
}

// ── Step 2: Berater (Advisors + Users) ─────────────────────────────────────

interface BeraterInfo {
  email: string
  name: string
}

function collectBerater(): BeraterInfo[] {
  const beraterSet = new Map<string, BeraterInfo>()

  // From customers CSV
  const custPath = resolve(DATA_DIR, 'Kunden_29-6-2026.csv')
  if (existsSync(custPath)) {
    const rows = parseCsvMultiline(readFileSync(custPath, 'utf-8'))
    const brokerIdx = rows[0].indexOf('Berater (E-Mail)')
    if (brokerIdx >= 0 && rows.length > 1) {
      for (let i = 1; i < rows.length; i++) {
        const email = cleanStr(rows[i][brokerIdx])
        if (email && !beraterSet.has(email)) {
          beraterSet.set(email, { email, name: email })
        }
      }
    }
  }

  // From contracts CSV
  const contractPath = resolve(DATA_DIR, 'Verträge_29-6-2026 (1).csv')
  if (existsSync(contractPath)) {
    const rows = parseCsvMultiline(readFileSync(contractPath, 'utf-8'))
    const beraterIdx = rows[0].indexOf('Berater')
    if (beraterIdx >= 0 && rows.length > 1) {
      for (let i = 1; i < rows.length; i++) {
        const b = cleanStr(rows[i][beraterIdx])
        if (b && !beraterSet.has(b)) {
          // Check if it's an email or name
          if (b.includes('@') || b.length > 30) {
            beraterSet.set(b, { email: b, name: b })
          } else {
            beraterSet.set(b, { email: `${b.toLowerCase().replace(/\s+/g, '.')}@vsvv.ch`, name: b })
          }
        }
      }
    }
  }

  return Array.from(beraterSet.values())
}

async function importBerater() {
  console.log('\n=== Schritt 2: Berater ===')

  const beraterList = collectBerater()
  let created = 0
  let skipped = 0

  for (const b of beraterList) {
    // Skip address brokers
    if (b.name.toLowerCase().includes('adressvermittler')) {
      skipped++
      continue
    }

    const existingUser = await prisma.user.findFirst({
      where: { email: b.email, organization_id: ORG_ID },
    })
    if (existingUser) {
      skipped++
      continue
    }

    // Create User
    const user = await prisma.user.create({
      data: {
        email: b.email,
        name: b.name,
        role: 'broker',
        organization_id: ORG_ID,
        is_active: true,
      },
    })

    // Also create Advisor record
    const nameParts = b.name.split(/[, ]+/).filter(Boolean)
    const firstname = nameParts.slice(0, -1).join(' ') || 'Unbekannt'
    const lastname = nameParts[nameParts.length - 1] || b.name

    await prisma.advisor.create({
      data: {
        firstname,
        lastname,
        email: b.email,
        organization_id: ORG_ID,
        role: 'advisor',
        status: 'active',
      },
    })

    created++
    console.log(`  ✅ Berater erstellt: ${b.name} <${b.email}>`)
  }

  console.log(`  ✅ ${created} Berater erstellt, ${skipped} übersprungen`)
}

// ── Step 3: Customers from all sources ─────────────────────────────────────

async function importCustomersFromKunden() {
  console.log('\n=== Schritt 3a: Kunden (Kunden_29-6-2026.csv) ===')

  const filePath = resolve(DATA_DIR, 'Kunden_29-6-2026.csv')
  if (!existsSync(filePath)) { console.log('  ⚠️ Datei nicht gefunden'); return 0 }

  const rows = parseCsvMultiline(readFileSync(filePath, 'utf-8'))
  if (rows.length < 2) return 0

  const h = rows[0]
  const idx = (name: string) => h.indexOf(name)

  let imported = 0
  let skipped = 0

  for (let i = 1; i < rows.length; i++) {
    const r = rows[i]
    const email = cleanStr(r[idx('E-Mail')])
    const lastName = cleanStr(r[idx('Nachname')]) ?? 'Unbekannt'
    const firstName = cleanStr(r[idx('Vorname')]) ?? ''

    const existing = email
      ? await prisma.customer.findFirst({ where: { email, organization_id: ORG_ID } })
      : await prisma.customer.findFirst({
          where: { first_name: firstName, last_name: lastName, organization_id: ORG_ID },
        })

    if (existing) { skipped++; continue }

    const status = cleanStr(r[idx('Status')])
    const mandate = cleanStr(r[idx('Mandat-Status')])
    const ctype = cleanStr(r[idx('Kundentyp')])

    await prisma.customer.create({
      data: {
        first_name: firstName,
        last_name: lastName,
        email,
        phone: cleanStr(r[idx('Telefon')]),
        birthdate: parseDate(r[idx('Geburtsdatum')]),
        city: cleanStr(r[idx('Ort')]),
        canton: cleanStr(r[idx('Kanton')]) as any,
        status: (status === 'active' ? 'active' : 'inactive') as any,
        mandate_status: (mandate === 'valid' ? 'valid' : mandate === 'pending' ? 'pending' : 'pending') as any,
        customer_type: (ctype === 'business' ? 'business' : 'private') as any,
        civil_status: cleanStr(r[idx('Zivilstand')]) as any,
        nationality: cleanStr(r[idx('Nationalität')]),
        total_premium: parseCHFloat(r[idx('Jahresprämie')]) ?? 0,
        assigned_broker: cleanStr(r[idx('Berater (E-Mail)')]),
        notes: cleanStr(r[idx('Notizen')]),
        organization_id: ORG_ID,
      },
    })
    imported++
  }

  console.log(`  ✅ ${imported} Kunden importiert, ${skipped} übersprungen`)
  return imported
}

async function importCustomersFromArrilla() {
  console.log('\n=== Schritt 3b: Kunden (Arrilla Kundenexport.csv) ===')

  const filePath = resolve(DATA_DIR, 'Arrilla Kundenexport.csv')
  if (!existsSync(filePath)) { console.log('  ⚠️ Datei nicht gefunden'); return 0 }

  const content = readFileSync(filePath, 'latin1')
  const rows = parseCsvMultiline(content)
  if (rows.length < 2) return 0

  const h = rows[0]
  const idx = (name: string) => h.indexOf(name)

  const CIVIL_STATUS_MAP: Record<string, string> = {
    'ledig': 'single', 'single': 'single', 'verheiratet': 'married', 'married': 'married',
    'geschieden': 'divorced', 'divorced': 'divorced', 'verwitwet': 'widowed', 'widowed': 'widowed',
    'eingetragene partnerschaft': 'registered_partnership', 'aufgelöste partnerschaft': 'dissolved_partnership',
  }

  let imported = 0
  let skipped = 0

  for (let i = 1; i < rows.length; i++) {
    const r = rows[i]
    const lastName = cleanStr(r[idx('Name')])
    const firstName = cleanStr(r[idx('Vorname')]) ?? ''
    const email = cleanStr(r[idx('Email Privat')]) || cleanStr(r[idx('Email Geschäft')])

    if (!lastName && !email) { skipped++; continue }

    const existing = email
      ? await prisma.customer.findFirst({ where: { email, organization_id: ORG_ID } })
      : null

    if (existing) { skipped++; continue }

    const ctype = cleanStr(r[idx('Kunden Typ')])
    const isActive = parseBool(r[idx('Aktiv')])
    const isCompany = ctype?.toLowerCase().includes('firma') || ctype?.toLowerCase().includes('unternehmen')
    const fullStreet = [cleanStr(r[idx('Strasse')]), cleanStr(r[idx('Hausnummer')])].filter(Boolean).join(' ')

    await prisma.customer.create({
      data: {
        first_name: firstName,
        last_name: lastName || email || 'Unbekannt',
        email,
        phone: cleanStr(r[idx('Telefon Privat')]) || cleanStr(r[idx('Telefon Geschäft')]) || cleanStr(r[idx('Mobile')]),
        mobile: cleanStr(r[idx('Mobile')]),
        street: fullStreet || null,
        zip_code: cleanStr(r[idx('PLZ')]),
        city: cleanStr(r[idx('Ort')]),
        birthdate: parseDate(r[idx('Geburtsdatum')]),
        civil_status: (CIVIL_STATUS_MAP[cleanStr(r[idx('Zivilstand')])?.toLowerCase() ?? ''] ?? 'single') as any,
        nationality: cleanStr(r[idx('Nationalität')]),
        profession: cleanStr(r[idx('Beruf')]),
        company_name: cleanStr(r[idx('Firmenname')]),
        legal_form: cleanStr(r[idx('Rechtsform')]),
        uid_number: cleanStr(r[idx('Handelsregisternummer UID')]),
        customer_type: (isCompany ? 'business' : 'private') as any,
        status: isActive ? 'active' as any : 'inactive' as any,
        association_membership: cleanStr(r[idx('VSV-Mitgliedschaft')]) || null,
        organization_id: ORG_ID,
      },
    })
    imported++
  }

  console.log(`  ✅ ${imported} Arrilla-Kunden importiert, ${skipped} übersprungen`)
  return imported
}

async function importCustomersFromMembers() {
  console.log('\n=== Schritt 3c: Mitglieder (VSVV Mitglieder.csv) ===')

  const filePath = resolve(DATA_DIR, 'Mitglieder Alle VSVV Mitglieder.csv')
  if (!existsSync(filePath)) { console.log('  ⚠️ Datei nicht gefunden'); return 0 }

  const rows = parseCsvMultiline(readFileSync(filePath, 'utf-8'), ',')
  if (rows.length < 2) return 0

  const h = rows[0]
  const idx = (name: string) => h.indexOf(name)

  let imported = 0
  let skipped = 0

  for (let i = 1; i < rows.length; i++) {
    const r = rows[i]
    const lastName = cleanStr(r[idx('Name')])
    const firstName = cleanStr(r[idx('Vorname')]) ?? ''
    const email = cleanStr(r[idx('E-Mail')])

    if (!lastName) { skipped++; continue }

    const existing = email
      ? await prisma.customer.findFirst({ where: { email, organization_id: ORG_ID } })
      : await prisma.customer.findFirst({
          where: { first_name: firstName, last_name: lastName, organization_id: ORG_ID },
        })

    if (existing) {
      await prisma.customer.update({
        where: { id: existing.id },
        data: { association_membership: 'VSVV' },
      })
      skipped++
      continue
    }

    await prisma.customer.create({
      data: {
        first_name: firstName,
        last_name: lastName,
        email,
        phone: cleanStr(r[idx('Telefon')]) || cleanStr(r[idx('Mobile')]),
        mobile: cleanStr(r[idx('Mobile')]),
        street: cleanStr(r[idx('Strasse')]),
        zip_code: cleanStr(r[idx('PLZ')]),
        city: cleanStr(r[idx('Ort')]),
        association_membership: 'VSVV',
        organization_id: ORG_ID,
      },
    })
    imported++
  }

  console.log(`  ✅ ${imported} Mitglieder importiert, ${skipped} vorhanden/aktualisiert`)
  return imported
}

// ── Step 4: Contracts ─────────────────────────────────────────────────────

async function importContracts() {
  console.log('\n=== Schritt 4: Verträge ===')

  const filePath = resolve(DATA_DIR, 'Verträge_29-6-2026 (1).csv')
  if (!existsSync(filePath)) { console.log('  ⚠️ Datei nicht gefunden'); return }

  const content = readFileSync(filePath, 'utf-8')
  const rows = parseCsvMultiline(content)
  if (rows.length < 2) return

  const h = rows[0]
  const policyIdx = h.indexOf('Police-Nummer')
  const customerNameIdx = h.indexOf('Kunde')
  const insurerIdx = h.indexOf('Gesellschaft')
  const sparteIdx = h.indexOf('Sparte')
  const productIdx = h.indexOf('Produkt')
  const statusIdx = h.indexOf('Status')
  const premiumYearlyIdx = h.indexOf('Jahresprämie')
  const premiumMonthlyIdx = h.indexOf('Monatsprämie')
  const startIdx = h.indexOf('Beginn')
  const endIdx = h.indexOf('Ablauf')
  const cancelDeadlineIdx = h.indexOf('Kündigungsfrist')
  const renewalIdx = h.indexOf('Renewal-Status')
  const brokerIdx = h.indexOf('Berater')

  console.log(`  ${rows.length - 1} Verträge in Datei`)

  let imported = 0
  let skipped = 0
  let noCustomer = 0

  for (let i = 1; i < rows.length; i++) {
    const r = rows[i]
    const policyNumber = cleanStr(r[policyIdx])
    const customerName = cleanStr(r[customerNameIdx]) ?? ''

    // Skip if no customer name
    if (!customerName) { skipped++; continue }

    // Check if contract already exists
    if (policyNumber) {
      const existing = await prisma.contract.findFirst({
        where: { policy_number: policyNumber, organization_id: ORG_ID },
      })
      if (existing) { skipped++; continue }
    }

    // Find customer by name — try multiple strategies
    const nameParts = customerName.split(/\s+/)
    let firstName = ''
    let lastName = ''

    if (nameParts.length === 1) {
      lastName = nameParts[0]
    } else {
      lastName = nameParts[nameParts.length - 1]
      firstName = nameParts.slice(0, -1).join(' ')
    }

    // Strategy 1: exact first + last name match
    let customer = firstName
      ? await prisma.customer.findFirst({
          where: { first_name: firstName, last_name: lastName, organization_id: ORG_ID },
        })
      : null

    // Strategy 2: last name only match (take first)
    if (!customer) {
      customer = await prisma.customer.findFirst({
        where: { last_name: lastName, organization_id: ORG_ID },
        orderBy: { created_at: 'desc' },
      })
    }

    // Strategy 3: try matching with double spaces collapsed
    if (!customer && customerName.includes('  ')) {
      const collapsed = customerName.replace(/\s+/g, ' ')
      const parts = collapsed.split(' ')
      if (parts.length > 1) {
        const ln = parts[parts.length - 1]
        const fn = parts.slice(0, -1).join(' ')
        customer = await prisma.customer.findFirst({
          where: { first_name: fn, last_name: ln, organization_id: ORG_ID },
        })
        if (!customer) {
          customer = await prisma.customer.findFirst({
            where: { last_name: ln, organization_id: ORG_ID },
            orderBy: { created_at: 'desc' },
          })
        }
      }
    }

    if (!customer) {
      noCustomer++
      continue
    }

    const status = cleanStr(r[statusIdx])
    const renewalStatus = cleanStr(r[renewalIdx])

    await prisma.contract.create({
      data: {
        customer_id: customer.id,
        customer_name: customerName,
        organization_id: ORG_ID,
        insurer: cleanStr(r[insurerIdx]) ?? 'Unbekannt',
        policy_number: policyNumber || undefined,
        sparte: cleanStr(r[sparteIdx]),
        product: cleanStr(r[productIdx]),
        status: (status === 'active' ? 'active' : status === 'cancelled' ? 'cancelled' : 'expired') as any,
        premium_yearly: parseCHFloat(r[premiumYearlyIdx]),
        premium_monthly: parseCHFloat(r[premiumMonthlyIdx]),
        start_date: parseDate(r[startIdx]),
        end_date: parseDate(r[endIdx]),
        cancellation_deadline: parseDate(r[cancelDeadlineIdx]),
        renewal_status: renewalStatus ?? 'none',
        assigned_broker: cleanStr(r[brokerIdx]),
        insurance_type: 'other',
      },
    })
    imported++
  }

  console.log(`  ✅ ${imported} Verträge importiert`)
  console.log(`  ⏭️ ${skipped} übersprungen (bereits existent)`)
  console.log(`  ❌ ${noCustomer} ohne passenden Kunden`)
}

// ── Step 5: Import Converto Excel ─────────────────────────────────────────

async function importExcel() {
  console.log('\n=== Schritt 5: Converto_Liste.xlsx ===')

  const xlsxPath = resolve(DATA_DIR, 'Converto_Liste.xlsx')
  if (!existsSync(xlsxPath)) {
    console.log('  ⚠️ Datei nicht gefunden — übersprungen')
    return
  }

  let XLSX: any
  try {
    XLSX = await import('xlsx')
  } catch {
    console.log('  ⚠️ xlsx package nicht installiert — installiere...')
    try {
      const { execSync } = await import('child_process')
      execSync('npm install xlsx', { cwd: resolve(DATA_DIR, '..', 'backend') })
      XLSX = await import('xlsx')
    } catch {
      console.log('  ⚠️ Konnte xlsx nicht installieren')
      return
    }
  }

  let workbook: any
  try {
    workbook = XLSX.default ? XLSX.default.readFile(xlsxPath) : XLSX.readFile(xlsxPath)
  } catch (e) {
    console.log(`  ⚠️ Fehler beim Lesen der Excel-Datei: ${e}`)
    return
  }

  const sheetName = workbook.SheetNames[0]
  const data: string[][] = XLSX.default
    ? XLSX.default.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 })
    : XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 })

  if (data.length < 2) {
    console.log('  ⚠️ Excel ist leer')
    return
  }

  const headers = data[0] as string[]
  console.log(`  ${data.length - 1} Zeilen in Excel`)

  let imported = 0
  let skipped = 0
  let newCustomers = 0

  for (let i = 1; i < data.length; i++) {
    const row = data[i]
    if (!row || !row.some(c => c)) { skipped++; continue }

    const emailIdx = headers.findIndex(h => h?.toLowerCase().includes('email'))
    const lastNameIdx = headers.findIndex(h => h?.toLowerCase().includes('nachname') || h?.toLowerCase().includes('name'))
    const firstNameIdx = headers.findIndex(h => h?.toLowerCase().includes('vorname'))
    const policyIdx = headers.findIndex(h => h?.toLowerCase().includes('police') || h?.toLowerCase().includes('vertrag'))
    const insurerIdx = headers.findIndex(h => h?.toLowerCase().includes('versicherer') || h?.toLowerCase().includes('kasse'))
    const premiumIdx = headers.findIndex(h => h?.toLowerCase().includes('prämie') || h?.toLowerCase().includes('premium'))

    const email = emailIdx >= 0 ? cleanStr(row[emailIdx]) : null
    const lastName = lastNameIdx >= 0 ? cleanStr(row[lastNameIdx]) : null
    const firstName = firstNameIdx >= 0 ? cleanStr(row[firstNameIdx]) : null

    if (!email && !lastName) { skipped++; continue }

    let customer = email
      ? await prisma.customer.findFirst({ where: { email, organization_id: ORG_ID } })
      : null
    if (!customer && lastName) {
      customer = await prisma.customer.findFirst({
        where: { last_name: { contains: lastName, mode: 'insensitive' }, organization_id: ORG_ID },
      })
    }

    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          first_name: firstName || 'Unbekannt',
          last_name: lastName || email || 'Converto',
          email: email || `converto-${i}@placeholder.ch`,
          customer_type: 'private',
          status: 'active',
          organization_id: ORG_ID,
        },
      })
      newCustomers++
    }

    const policyNumber = policyIdx >= 0 ? cleanStr(row[policyIdx]) : null
    if (policyNumber) {
      const existing = await prisma.contract.findFirst({
        where: { policy_number: policyNumber, customer_id: customer.id },
      })
      if (!existing) {
        const premiumVal = premiumIdx >= 0
          ? parseCHFloat(String(row[premiumIdx]).replace(/[^0-9.,]/g, '').replace(',', '.')) || 0
          : 0
        await prisma.contract.create({
          data: {
            customer_id: customer.id,
            policy_number: policyNumber,
            insurer: insurerIdx >= 0 ? cleanStr(row[insurerIdx]) || 'Unbekannt' : 'Unbekannt',
            premium_monthly: premiumVal,
            status: 'active',
            organization_id: ORG_ID,
            insurance_type: 'other',
          },
        })
      }
    }
    imported++
  }

  console.log(`  ✅ ${imported} Converto-Empfehlungen importiert`)
  console.log(`  🆕 ${newCustomers} neue Kunden erstellt`)
  console.log(`  ⏭️ ${skipped} übersprungen`)
}

// ── Step 6: Documents (PDF files) ─────────────────────────────────────────

async function importDocuments() {
  console.log('\n=== Schritt 6: Dokumente (PDF) ===')

  const pdfFiles = readdirSync(DATA_DIR).filter(f => f.endsWith('.pdf'))
  if (pdfFiles.length === 0) { console.log('  ⚠️ Keine PDF-Dateien gefunden'); return }

  console.log(`  ${pdfFiles.length} PDF-Dateien gefunden`)

  let imported = 0
  let skipped = 0

  for (const pdfFile of pdfFiles) {
    const existing = await prisma.document.findFirst({
      where: { name: pdfFile, organization_id: ORG_ID },
    })
    if (existing) { skipped++; continue }

    // Try to extract customer name from filename
    const nameMatch = pdfFile.match(/^([A-Za-zÀ-ÖØ-öø-ÿ]+)\s/) // First word = last name?
    let customerId: string | undefined

    if (nameMatch) {
      const possibleLastName = nameMatch[1]
      const customer = await prisma.customer.findFirst({
        where: { last_name: { startsWith: possibleLastName, mode: 'insensitive' }, organization_id: ORG_ID },
        orderBy: { created_at: 'desc' },
      })
      if (customer) customerId = customer.id
    }

    const filePath = resolve(DATA_DIR, pdfFile)
    const fileStats = existsSync(filePath) ? (await import('fs')).statSync(filePath) : null

    await prisma.document.create({
      data: {
        name: pdfFile,
        file_url: `/uploads/${pdfFile}`,
        file_key: pdfFile,
        file_size: fileStats?.size ?? 0,
        mime_type: 'application/pdf',
        category: 'contract',
        doc_type: 'unbekannt',
        classification_status: 'ausstehend',
        customer_id: customerId || undefined,
        organization_id: ORG_ID,
        uploaded_at: new Date(),
      },
    })
    imported++
    console.log(`  ✅ Dokument: ${pdfFile}${customerId ? ' (Kunde zugewiesen)' : ''}`)
  }

  console.log(`  ✅ ${imported} Dokumente importiert, ${skipped} bereits vorhanden`)
}

// ── Main ──────────────────────────────────────────────────────────────────

async function main() {
  console.log('='.repeat(70))
  console.log('📊 avaai Premium Broker — Full Data Import')
  console.log('='.repeat(70))

  const startTime = Date.now()

  // 1. Organization
  await ensureOrganization()

  // 2. Berater (Advisors)
  await importBerater()

  // 3. Kunden (all sources)
  const kunden = await importCustomersFromKunden()
  const arrilla = await importCustomersFromArrilla()
  const members = await importCustomersFromMembers()

  // 4. Verträge
  await importContracts()

  // 5. Converto Excel
  await importExcel()

  // 6. Dokumente
  await importDocuments()

  // Summary
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
  const [custCount, contractCount, advisorCount, docCount] = await Promise.all([
    prisma.customer.count({ where: { organization_id: ORG_ID } }),
    prisma.contract.count({ where: { organization_id: ORG_ID } }),
    prisma.advisor.count({ where: { organization_id: ORG_ID } }),
    prisma.document.count({ where: { organization_id: ORG_ID } }),
  ])

  console.log('\n' + '='.repeat(70))
  console.log('📊 Import Summary')
  console.log('='.repeat(70))
  console.log(`  Organisation:       VSVV (${ORG_ID})`)
  console.log(`  Kunden (CSV):       ${kunden}`)
  console.log(`  Arrilla Export:     ${arrilla}`)
  console.log(`  VSVV Mitglieder:    ${members}`)
  console.log(`  Total Kunden:       ${custCount}`)
  console.log(`  Total Verträge:     ${contractCount}`)
  console.log(`  Total Berater:      ${advisorCount}`)
  console.log(`  Total Dokumente:    ${docCount}`)
  console.log(`  ⏱️ Dauer:           ${elapsed}s`)
  console.log('='.repeat(70))
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
