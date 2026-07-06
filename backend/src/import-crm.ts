/**
 * avaai CRM Import Script
 *
 * Importiert Kundendate und Verträge us CSV-Dateie in d DB.
 *
 * Usage: npx tsx src/import-crm.ts
 *
 * Dateiformat: Semikolon-getrennt (;), UTF-8 odr Latin-1
 * Datum:       DD.MM.YYYY
 * Zahle:       CH-Format (1'234,56 → 1234.56)
 */

import { PrismaClient } from '@prisma/client'
import { readFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = '/workspaces/vsvv-premium-broker-main-v2/CUSTOMER_DOCS'

const prisma = new PrismaClient()

// ── Config ─────────────────────────────────────────────────────────────────
const ORG_ID = '0426ab87-fa0a-48bc-816f-bffc4e20c341'

// ── German Value Mapper ─────────────────────────────────────────────────────

const CIVIL_STATUS_MAP: Record<string, string> = {
  'ledig': 'single',
  'single': 'single',
  'verheiratet': 'married',
  'married': 'married',
  'geschieden': 'divorced',
  'divorced': 'divorced',
  'verwitwet': 'widowed',
  'widowed': 'widowed',
  'eingetragene partnerschaft': 'registered_partnership',
  'registered_partnership': 'registered_partnership',
  'aufgelöste partnerschaft': 'dissolved_partnership',
  'dissolved_partnership': 'dissolved_partnership',
}

const GENDER_MAP: Record<string, string> = {
  'männlich': 'male',
  'weiblich': 'female',
  'male': 'male',
  'female': 'female',
}

// ── Helpers ────────────────────────────────────────────────────────────────

function parseDate(val: string | undefined | null): Date | null {
  if (!val || val.trim() === '' || val === '0' || val === '00.00.0000') return null
  const parts = val.trim().split('.')
  if (parts.length === 3) {
    const d = new Date(+parts[2], +parts[1] - 1, +parts[0])
    return isNaN(d.getTime()) ? null : d
  }
  return null
}

function parseFloat(val: string | undefined | null): number | null {
  if (!val || val.trim() === '') return null
  // CH-Format: 1'234,56 → 1234.56
  const cleaned = val.trim()
    .replace(/'/g, '')
    .replace(/CHF\s*/gi, '')
    .replace(/\./g, '')
    .replace(',', '.')
  const n = Number(cleaned)
  return isNaN(n) ? null : n
}

function parseBool(val: string | undefined | null): boolean {
  if (!val) return false
  return ['1', 'true', 'ja', 'yes', 'aktiv', 'active'].includes(val.trim().toLowerCase())
}

function cleanStr(val: string | undefined | null): string | null {
  if (!val || val.trim() === '') return null
  const trimmed = val.trim()
  if (trimmed === '0' || trimmed === 'Bitte wählen' || trimmed === 'CHF 0.00') return null
  return trimmed
}

// ── Parse semicolon CSV (handles quotes) ────────────────────────────────────

function parseCsv(content: string, delimiter = ';'): string[][] {
  const lines = content.split(/\r?\n/).filter(l => l.trim() !== '')
  const rows: string[][] = []
  for (const line of lines) {
    const values: string[] = []
    let current = ''
    let inQuotes = false
    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === delimiter && !inQuotes) {
        values.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    values.push(current.trim())
    rows.push(values)
  }
  return rows
}

// ── Import Customers ────────────────────────────────────────────────────────

async function importCustomers() {
  console.log('\n📦 Importiere Kunden...')

  const filePath = resolve(DATA_DIR, 'Kunden_29-6-2026.csv')
  const content = readFileSync(filePath, 'utf-8')
  const rows = parseCsv(content)
  if (rows.length < 2) {
    console.log('  ⚠️ Keine Date gfunde (min. Header + 1 Row)')
    return 0
  }

  const headers = rows[0]
  const nameIdx = headers.indexOf('Nachname')
  const firstNameIdx = headers.indexOf('Vorname')
  const emailIdx = headers.indexOf('E-Mail')
  const phoneIdx = headers.indexOf('Telefon')
  const birthdateIdx = headers.indexOf('Geburtsdatum')
  const cityIdx = headers.indexOf('Ort')
  const cantonIdx = headers.indexOf('Kanton')
  const statusIdx = headers.indexOf('Status')
  const mandateIdx = headers.indexOf('Mandat-Status')
  const typeIdx = headers.indexOf('Kundentyp')
  const civilIdx = headers.indexOf('Zivilstand')
  const nationIdx = headers.indexOf('Nationalität')
  const premiumIdx = headers.indexOf('Jahresprämie')
  const brokerIdx = headers.indexOf('Berater (E-Mail)')
  const notesIdx = headers.indexOf('Notizen')

  console.log(`  Headers: ${headers.length} Spalten`)
  console.log(`  Dateie: ${rows.length - 1}`)

  let imported = 0
  let skipped = 0

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i]
    const email = cleanStr(row[emailIdx])
    const lastName = cleanStr(row[nameIdx]) ?? 'Unbekannt'
    const firstName = cleanStr(row[firstNameIdx]) ?? ''

    // Check ob bereits existiert (via email oder name)
    const existing = email
      ? await prisma.customer.findFirst({ where: { email, organization_id: ORG_ID } })
      : await prisma.customer.findFirst({
          where: { first_name: firstName, last_name: lastName, organization_id: ORG_ID },
        })

    if (existing) {
      skipped++
      continue
    }

    const status = cleanStr(row[statusIdx])
    const mandate = cleanStr(row[mandateIdx])
    const customerType = cleanStr(row[typeIdx])

    await prisma.customer.create({
      data: {
        first_name: firstName,
        last_name: lastName,
        email,
        phone: cleanStr(row[phoneIdx]),
        birthdate: parseDate(row[birthdateIdx]),
        city: cleanStr(row[cityIdx]),
        canton: cleanStr(row[cantonIdx]) as any,
        status: (status === 'active' ? 'active' : 'inactive') as any,
        mandate_status: (mandate === 'valid' ? 'valid' : mandate === 'pending' ? 'pending' : mandate === 'invalid' ? 'invalid' : 'pending') as any,
        customer_type: (customerType === 'business' ? 'business' : 'private') as any,
        civil_status: cleanStr(row[civilIdx]) as any,
        nationality: cleanStr(row[nationIdx]),
        total_premium: parseFloat(row[premiumIdx]) ?? 0,
        assigned_broker: cleanStr(row[brokerIdx]),
        notes: cleanStr(row[notesIdx]),
        organization_id: ORG_ID,
      },
    })
    imported++
  }

  console.log(`  ✅ ${imported} Kunden importiert, ${skipped} übersprunge (existiert)`)
  return imported
}

// ── Import Contracts ────────────────────────────────────────────────────────

async function importContracts() {
  console.log('\n📦 Importiere Verträg...')

  const filePath = resolve(DATA_DIR, 'Verträge_29-6-2026 (1).csv')
  const content = readFileSync(filePath, 'utf-8')
  const rows = parseCsv(content)
  if (rows.length < 2) {
    console.log('  ⚠️ Keine Vertragsdate gfunde')
    return 0
  }

  const headers = rows[0]
  const policyIdx = headers.indexOf('Police-Nummer')
  const customerNameIdx = headers.indexOf('Kunde')
  const insurerIdx = headers.indexOf('Gesellschaft')
  const sparteIdx = headers.indexOf('Sparte')
  const productIdx = headers.indexOf('Produkt')
  const statusIdx = headers.indexOf('Status')
  const premiumYearlyIdx = headers.indexOf('Jahresprämie')
  const premiumMonthlyIdx = headers.indexOf('Monatsprämie')
  const startIdx = headers.indexOf('Beginn')
  const endIdx = headers.indexOf('Ablauf')
  const cancelDeadlineIdx = headers.indexOf('Kündigungsfrist')
  const renewalIdx = headers.indexOf('Renewal-Status')
  const brokerIdx = headers.indexOf('Berater')

  console.log(`  Headers: ${headers.length} Spalten`)
  console.log(`  Verträg: ${rows.length - 1}`)

  let imported = 0
  let skipped = 0

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i]
    const policyNumber = cleanStr(row[policyIdx])
    const customerName = cleanStr(row[customerNameIdx]) ?? ''

    // Check ob Vertrag bereits existiert (via policy_number)
    if (policyNumber) {
      const existing = await prisma.contract.findFirst({
        where: { policy_number: policyNumber, organization_id: ORG_ID },
      })
      if (existing) {
        skipped++
        continue
      }
    }

    // Kunde finde
    const nameParts = customerName.split(' ')
    const firstName = nameParts.length > 1 ? nameParts.slice(0, -1).join(' ') : ''
    const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : customerName

    const customer = await prisma.customer.findFirst({
      where: {
        OR: [
          { last_name: lastName, first_name: firstName, organization_id: ORG_ID },
          { last_name: lastName, organization_id: ORG_ID },
        ],
      },
      orderBy: { created_at: 'desc' },
    })

    if (!customer) {
      console.log(`  ⚠️ Kei Kunde gfunde für Vertrag: ${policyNumber} (${customerName}) — übersprunge`)
      skipped++
      continue
    }

    const status = cleanStr(row[statusIdx])
    const renewalStatus = cleanStr(row[renewalIdx])

    await prisma.contract.create({
      data: {
        customer_id: customer.id,
        customer_name: customerName,
        organization_id: ORG_ID,
        insurer: cleanStr(row[insurerIdx]) ?? 'Unbekannt',
        policy_number: policyNumber,
        sparte: cleanStr(row[sparteIdx]),
        product: cleanStr(row[productIdx]),
        status: (status === 'active' ? 'active' : status === 'cancelled' ? 'cancelled' : 'expired') as any,
        premium_yearly: parseFloat(row[premiumYearlyIdx]),
        premium_monthly: parseFloat(row[premiumMonthlyIdx]),
        start_date: parseDate(row[startIdx]),
        end_date: parseDate(row[endIdx]),
        cancellation_deadline: parseDate(row[cancelDeadlineIdx]),
        renewal_status: renewalStatus ?? 'none',
        assigned_broker: cleanStr(row[brokerIdx]),
      },
    })
    imported++
  }

  console.log(`  ✅ ${imported} Verträg importiert, ${skipped} übersprunge`)
  return imported
}

// ── Import VSVV Members ─────────────────────────────────────────────────────

async function importMembers() {
  console.log('\n📦 Importiere VSVV Mitglieder...')

  const filePath = resolve(DATA_DIR, 'Mitglieder Alle VSVV Mitglieder.csv')
  const content = readFileSync(filePath, 'utf-8')
  // Members CSV is comma-delimited
  const rows = parseCsv(content, ',')
  if (rows.length < 2) {
    console.log('  ⚠️ Keine Mitgliederdate gfunde')
    return 0
  }

  const headers = rows[0]
  const firstNameIdx = headers.indexOf('Vorname')
  const nameIdx = headers.indexOf('Name')
  const streetIdx = headers.indexOf('Strasse')
  const zipIdx = headers.indexOf('PLZ')
  const cityIdx = headers.indexOf('Ort')
  const emailIdx = headers.indexOf('E-Mail')
  const phoneIdx = headers.indexOf('Telefon')
  const mobileIdx = headers.indexOf('Mobile')

  console.log(`  Headers: ${headers.length} Spalten`)
  console.log(`  Mitglieder: ${rows.length - 1}`)

  let imported = 0
  let skipped = 0

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i]
    const lastName = cleanStr(row[nameIdx])
    const firstName = cleanStr(row[firstNameIdx]) ?? ''
    const email = cleanStr(row[emailIdx])

    if (!lastName) continue

    // Check ob bereits existiert
    const existing = email
      ? await prisma.customer.findFirst({ where: { email, organization_id: ORG_ID } })
      : await prisma.customer.findFirst({
          where: { first_name: firstName, last_name: lastName, organization_id: ORG_ID },
        })

    if (existing) {
      // Update association membership
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
        phone: cleanStr(row[phoneIdx]) || cleanStr(row[mobileIdx]),
        mobile: cleanStr(row[mobileIdx]),
        street: cleanStr(row[streetIdx]),
        zip_code: cleanStr(row[zipIdx]),
        city: cleanStr(row[cityIdx]),
        association_membership: 'VSVV',
        organization_id: ORG_ID,
      },
    })
    imported++
  }

  console.log(`  ✅ ${imported} Mitglieder importiert, ${skipped} vorhande`)
  return imported
}

// ── Import Arrilla Export (5159 Customers) ──────────────────────────────────

async function importArrilla() {
  console.log('\n📦 Importiere Arrilla Kundenexport (5159)...')

  const filePath = resolve(DATA_DIR, 'Arrilla Kundenexport.csv')
  const content = readFileSync(filePath, 'latin1')
  const rows = parseCsv(content)
  if (rows.length < 2) {
    console.log('  ⚠️ Keine Arrilla Date gfunde')
    return 0
  }

  const headers = rows[0]
  const firstNameIdx = headers.indexOf('Vorname')
  const nameIdx = headers.indexOf('Name')
  const emailPrivateIdx = headers.indexOf('Email Privat')
  const emailBusinessIdx = headers.indexOf('Email Geschäft')
  const phonePrivateIdx = headers.indexOf('Telefon Privat')
  const phoneBusinessIdx = headers.indexOf('Telefon Geschäft')
  const mobileIdx = headers.indexOf('Mobile')
  const birthdateIdx = headers.indexOf('Geburtsdatum')
  const streetIdx = headers.indexOf('Strasse')
  const housenoIdx = headers.indexOf('Hausnummer')
  const zipIdx = headers.indexOf('PLZ')
  const cityIdx = headers.indexOf('Ort')
  const genderIdx = headers.indexOf('Geschlecht')
  const civilIdx = headers.indexOf('Zivilstand')
  const nationalityIdx = headers.indexOf('Nationalität')
  const professionIdx = headers.indexOf('Beruf')
  const companyIdx = headers.indexOf('Firmenname')
  const legalFormIdx = headers.indexOf('Rechtsform')
  const uidIdx = headers.indexOf('Handelsregisternummer UID')
  const customerTypeIdx = headers.indexOf('Kunden Typ')
  const activeIdx = headers.indexOf('Aktiv')
  const memberIdx = headers.indexOf('VSV-Mitgliedschaft')

  console.log(`  Headers: ${headers.length} Spalten`)
  console.log(`  Dateie: ${rows.length - 1}`)

  let imported = 0
  let skipped = 0

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i]
    const lastName = cleanStr(row[nameIdx])
    const firstName = cleanStr(row[firstNameIdx]) ?? ''
    const email = cleanStr(row[emailPrivateIdx]) || cleanStr(row[emailBusinessIdx])

    if (!lastName && !email) continue

    // Deduplizierig
    const existing = email
      ? await prisma.customer.findFirst({ where: { email, organization_id: ORG_ID } })
      : null

    if (existing) {
      skipped++
      continue
    }

    const customerType = cleanStr(row[customerTypeIdx])
    const isActive = parseBool(row[activeIdx])
    const isCompany = customerType?.toLowerCase().includes('firma') || customerType?.toLowerCase().includes('unternehmen')

    const fullStreet = [cleanStr(row[streetIdx]), cleanStr(row[housenoIdx])].filter(Boolean).join(' ')

    await prisma.customer.create({
      data: {
        first_name: firstName,
        last_name: lastName || email || 'Unbekannt',
        email,
        phone: cleanStr(row[phonePrivateIdx]) || cleanStr(row[phoneBusinessIdx]) || cleanStr(row[mobileIdx]),
        mobile: cleanStr(row[mobileIdx]),
        street: fullStreet || null,
        zip_code: cleanStr(row[zipIdx]),
        city: cleanStr(row[cityIdx]),
        birthdate: parseDate(row[birthdateIdx]),
        civil_status: (CIVIL_STATUS_MAP[cleanStr(row[civilIdx])?.toLowerCase() ?? ''] ?? 'single') as any,
        nationality: cleanStr(row[nationalityIdx]),
        profession: cleanStr(row[professionIdx]),
        company_name: cleanStr(row[companyIdx]),
        legal_form: cleanStr(row[legalFormIdx]),
        uid_number: cleanStr(row[uidIdx]),
        customer_type: (isCompany ? 'business' : 'private') as any,
        status: isActive ? 'active' as any : 'inactive' as any,
        association_membership: cleanStr(row[memberIdx]) || null,
        organization_id: ORG_ID,
      },
    })
    imported++
  }

  console.log(`  ✅ ${imported} Arrilla-Kunden importiert, ${skipped} übersprunge`)
  return imported
}

// ── Converto_Liste.xlsx ────────────────────────────────────────────────────

async function importExcel() {
  console.log('\n📦 Converto_Liste.xlsx — Excel Import...')

  const xlsxPath = `${DATA_DIR}/Converto_Liste.xlsx`
  if (!existsSync(xlsxPath)) {
    console.log('  ⚠️ Converto_Liste.xlsx nöd gfunde — übersprunge')
    return 0
  }

  let XLSX: any
  try {
    XLSX = await import('xlsx')
  } catch {
    console.log('  ⚠️ `xlsx` package nöd installiert — `npm install xlsx`')
    return 0
  }

  const workbook = XLSX.readFile(xlsxPath)
  const sheetName = workbook.SheetNames[0]
  const data: string[][] = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 })

  if (data.length < 2) {
    console.log('  ⚠️ Excel-Datei isch leer oder het nur Chopfzeile')
    return 0
  }

  const headers = data[0] as string[]
  console.log(`  Headers: ${headers.length} Spalte`)
  console.log(`  Dateie: ${data.length - 1}`)

  let imported = 0
  let skipped = 0

  for (let i = 1; i < data.length; i++) {
    const row = data[i]
    if (!row || !row.some(c => c)) { skipped++; continue }

    // Versuech Kunde per Email oder Name z finde
    const emailIdx = headers.findIndex(h => h?.toLowerCase().includes('email'))
    const nameIdx = headers.findIndex(h => h?.toLowerCase().includes('name') || h?.toLowerCase().includes('vorname'))
    const lastNameIdx = headers.findIndex(h => h?.toLowerCase().includes('nachname') || h?.toLowerCase().includes('name'))
    const firstNameIdx = headers.findIndex(h => h?.toLowerCase().includes('vorname'))
    const policyIdx = headers.findIndex(h => h?.toLowerCase().includes('police') || h?.toLowerCase().includes('vertrag'))
    const insurerIdx = headers.findIndex(h => h?.toLowerCase().includes('versicherer') || h?.toLowerCase().includes('kasse'))
    const premiumIdx = headers.findIndex(h => h?.toLowerCase().includes('prämie') || h?.toLowerCase().includes('premium'))

    const email = emailIdx >= 0 ? cleanStr(row[emailIdx]) : null
    const lastName = lastNameIdx >= 0 ? cleanStr(row[lastNameIdx]) : null
    const firstName = firstNameIdx >= 0 ? cleanStr(row[firstNameIdx]) : null

    if (!email && !lastName) { skipped++; continue }

    // Find customer
    let customer = email ? await prisma.customer.findFirst({ where: { email, organization_id: ORG_ID } }) : null
    if (!customer && lastName) {
      customer = await prisma.customer.findFirst({
        where: {
          organization_id: ORG_ID,
          last_name: { contains: lastName, mode: 'insensitive' },
        },
      })
    }

    if (!customer) {
      // Create minimal customer from Converto data
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
    }

    // Create or skip contract
    const policyNumber = policyIdx >= 0 ? cleanStr(row[policyIdx]) : null
    if (policyNumber) {
      const existing = await prisma.contract.findFirst({
        where: { policy_number: policyNumber, customer_id: customer.id },
      })
      if (!existing) {
        await prisma.contract.create({
          data: {
            customer_id: customer.id,
            policy_number: policyNumber,
            insurer: insurerIdx >= 0 ? cleanStr(row[insurerIdx]) || 'Unbekannt' : 'Unbekannt',
            premium_monthly: premiumIdx >= 0 ? parseFloat(String(row[premiumIdx]).replace(/[^0-9.,]/g, '').replace(',', '.')) || 0 : 0,
            status: 'active',
            organization_id: ORG_ID,
          },
        })
      }
    }

    imported++
  }

  console.log(`  ✅ ${imported} Converto-Empfehlige importiert, ${skipped} übersprunge`)
  return imported
}

// ── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('='.repeat(60))
  console.log('📊 avaai CRM Daten-Import')
  console.log('='.repeat(60))
  console.log(`Organization ID: ${ORG_ID}`)
  console.log(`Data directory: ${DATA_DIR}`)

  // 1. Customers
  const custCount = await importCustomers()
  // 2. Contracts
  const contractCount = await importContracts()
  // 3. VSVV Members
  const memberCount = await importMembers()
  // 4. Arrilla Export
  const arrillaCount = await importArrilla()
  // 5. Excel
  await importExcel()

  // Summary
  console.log('\n' + '='.repeat(60))
  console.log('📊 Import Summary')
  console.log('='.repeat(60))
  console.log(`  Kunden (CSV):         ${custCount}`)
  console.log(`  Verträg:              ${contractCount}`)
  console.log(`  VSVV Mitglieder:      ${memberCount}`)
  console.log(`  Arrilla Kundenexport: ${arrillaCount}`)

  const totalCustomers = await prisma.customer.count({ where: { organization_id: ORG_ID } })
  const totalContracts = await prisma.contract.count({ where: { organization_id: ORG_ID } })
  console.log(`\n  Total i DB: ${totalCustomers} Customers, ${totalContracts} Contracts`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
