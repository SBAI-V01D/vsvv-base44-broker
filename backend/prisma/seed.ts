// ============================================================================
// avaai Premium Broker — Database Seed
// Idempotent seed script: safe to run multiple times (uses upsert everywhere)
// Run with: npx tsx prisma/seed.ts
// ============================================================================

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main(): Promise<void> {
  console.log('🌱 avaai Database Seed — Starting...')
  console.log('')

  // --------------------------------------------------------------------------
  // 1. Organization
  // --------------------------------------------------------------------------
  console.log('📦 Organization')
  const org = await prisma.organization.upsert({
    where: { id: 'org-avaai-main' },
    update: {},
    create: {
      id: 'org-avaai-main',
      name: 'avaai Premium Broker AG',
      type: 'broker',
      status: 'active',
      finma_number: 'FINMA-12345',
      street: 'Bahnhofstrasse 100',
      zip_code: '8001',
      city: 'Zürich',
      phone: '+41 44 555 00 00',
      email: 'info@avaai.ch',
      website: 'https://avaai.ch',
    },
  })
  console.log(`   ✓ ${org.name} (${org.id})`)

  // --------------------------------------------------------------------------
  // 2. Users — one per RBAC role, bcrypt-hashed passwords
  // --------------------------------------------------------------------------
  console.log('')
  console.log('👤 Users')

  const passwordHash = await bcrypt.hash('Test1234!', 12)

  interface UserSeed {
    id: string
    email: string
    name: string
    role: 'admin' | 'management' | 'broker' | 'backoffice' | 'finance' | 'support' | 'compliance'
  }

  const usersData: UserSeed[] = [
    { id: 'user-admin',        email: 'admin@avaai.ch',        name: 'Admin User',        role: 'admin' },
    { id: 'user-management',   email: 'management@avaai.ch',   name: 'Management User',   role: 'management' },
    { id: 'user-broker-1',     email: 'broker1@avaai.ch',      name: 'Hans Muster',       role: 'broker' },
    { id: 'user-broker-2',     email: 'broker2@avaai.ch',      name: 'Lisa Beispiel',     role: 'broker' },
    { id: 'user-backoffice',   email: 'backoffice@avaai.ch',   name: 'Backoffice User',   role: 'backoffice' },
    { id: 'user-finance',      email: 'finance@avaai.ch',      name: 'Finance User',      role: 'finance' },
    { id: 'user-support',      email: 'support@avaai.ch',      name: 'Support User',      role: 'support' },
    { id: 'user-compliance',   email: 'compliance@avaai.ch',   name: 'Compliance User',   role: 'compliance' },
  ]

  for (const user of usersData) {
    await prisma.user.upsert({
      where: { id: user.id },
      update: {},
      create: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        password_hash: passwordHash,
        is_active: true,
        organization_id: org.id,
      },
    })
  }
  console.log(`   ✓ ${usersData.length} users created/verified`)

  // --------------------------------------------------------------------------
  // 3. Advisors
  // --------------------------------------------------------------------------
  console.log('')
  console.log('🧑‍💼 Advisors')

  await prisma.advisor.upsert({
    where: { id: 'advisor-1' },
    update: {},
    create: {
      id: 'advisor-1',
      firstname: 'Hans',
      lastname: 'Muster',
      email: 'hans.muster@avaai.ch',
      phone: '+41 44 555 01 01',
      organization_id: org.id,
      role: 'advisor',
      status: 'active',
    },
  })
  console.log(`   ✓ Hans Muster (advisor)`)

  await prisma.advisor.upsert({
    where: { id: 'advisor-2' },
    update: {},
    create: {
      id: 'advisor-2',
      firstname: 'Lisa',
      lastname: 'Beispiel',
      email: 'lisa.beispiel@avaai.ch',
      phone: '+41 44 555 01 02',
      organization_id: org.id,
      role: 'team_lead',
      status: 'active',
    },
  })
  console.log(`   ✓ Lisa Beispiel (team_lead)`)

  // --------------------------------------------------------------------------
  // 4. Insurers (VersichererDB)
  // --------------------------------------------------------------------------
  console.log('')
  console.log('🏦 Insurers')

  interface InsurerSeed {
    id: string
    name: string
    kurzname: string
  }

  const insurersData: InsurerSeed[] = [
    { id: 'insurer-css',      name: 'CSS Kranken-Versicherung AG', kurzname: 'CSS' },
    { id: 'insurer-swica',    name: 'Swica',                       kurzname: 'Swica' },
    { id: 'insurer-helsana',  name: 'Helsana',                     kurzname: 'Helsana' },
    { id: 'insurer-sanitas',  name: 'Sanitas',                     kurzname: 'Sanitas' },
    { id: 'insurer-kpt',      name: 'KPT',                         kurzname: 'KPT' },
    { id: 'insurer-assura',   name: 'Assura',                      kurzname: 'Assura' },
    { id: 'insurer-sympany',  name: 'Sympany',                     kurzname: 'Sympany' },
    { id: 'insurer-oekk',     name: 'ÖKK',                         kurzname: 'ÖKK' },
    { id: 'insurer-atupri',   name: 'Atupri',                      kurzname: 'Atupri' },
    { id: 'insurer-aquilana', name: 'Aquilana',                    kurzname: 'Aquilana' },
    { id: 'insurer-philos',   name: 'Philos',                      kurzname: 'Philos' },
    { id: 'insurer-innova',   name: 'Innova',                      kurzname: 'Innova' },
    { id: 'insurer-sanag',    name: 'Sanag',                       kurzname: 'Sanag' },
    { id: 'insurer-egk',      name: 'EGK',                         kurzname: 'EGK' },
    { id: 'insurer-moove',    name: 'Moove',                       kurzname: 'Moove' },
    { id: 'insurer-global',   name: 'Globe',                       kurzname: 'Globe' },
  ]

  for (const insurer of insurersData) {
    await prisma.versichererDB.upsert({
      where: { id: insurer.id },
      update: {},
      create: {
        id: insurer.id,
        name: insurer.name,
        kurzname: insurer.kurzname,
        organization_id: org.id,
        aktiv: true,
      },
    })
  }
  console.log(`   ✓ ${insurersData.length} insurers created/verified`)

  // --------------------------------------------------------------------------
  // 5. Reference Data — Swiss Cantons (enum-based, no model)
  // --------------------------------------------------------------------------
  console.log('')
  console.log('🗺️  Swiss Cantons (enum reference)')

  const swissCantons = [
    { code: 'AG', name: 'Aargau' },
    { code: 'AI', name: 'Appenzell Innerrhoden' },
    { code: 'AR', name: 'Appenzell Ausserrhoden' },
    { code: 'BE', name: 'Bern' },
    { code: 'BL', name: 'Basel-Landschaft' },
    { code: 'BS', name: 'Basel-Stadt' },
    { code: 'FR', name: 'Freiburg' },
    { code: 'GE', name: 'Genf' },
    { code: 'GL', name: 'Glarus' },
    { code: 'GR', name: 'Graubünden' },
    { code: 'JU', name: 'Jura' },
    { code: 'LU', name: 'Luzern' },
    { code: 'NE', name: 'Neuenburg' },
    { code: 'NW', name: 'Nidwalden' },
    { code: 'OW', name: 'Obwalden' },
    { code: 'SG', name: 'St. Gallen' },
    { code: 'SH', name: 'Schaffhausen' },
    { code: 'SO', name: 'Solothurn' },
    { code: 'SZ', name: 'Schwyz' },
    { code: 'TG', name: 'Thurgau' },
    { code: 'TI', name: 'Tessin' },
    { code: 'UR', name: 'Uri' },
    { code: 'VD', name: 'Waadt' },
    { code: 'VS', name: 'Wallis' },
    { code: 'ZG', name: 'Zug' },
    { code: 'ZH', name: 'Zürich' },
  ]
  console.log(`   ✓ ${swissCantons.length} canton codes available in SwissCanton enum`)

  // --------------------------------------------------------------------------
  // 6. Reference Data — BAG Health Insurance Regions
  // --------------------------------------------------------------------------
  console.log('')
  console.log('🏥 BAG Regions')

  const bagRegions = [
    { id: 'bag-region-ost',       name: 'Ostschweiz',      cantons: ['SG', 'AR', 'AI', 'GL', 'GR', 'TG'] },
    { id: 'bag-region-zentrum',   name: 'Zentralschweiz',  cantons: ['LU', 'UR', 'SZ', 'OW', 'NW', 'ZG'] },
    { id: 'bag-region-nordwest',  name: 'Nordwestschweiz', cantons: ['BS', 'BL', 'AG', 'SO'] },
    { id: 'bag-region-bern',      name: 'Bern',            cantons: ['BE'] },
    { id: 'bag-region-zuerich',   name: 'Zürich',          cantons: ['ZH'] },
    { id: 'bag-region-ostmitte',  name: 'Ostmitte',        cantons: ['VD', 'VS', 'FR', 'NE', 'JU'] },
    { id: 'bag-region-tessin',    name: 'Tessin',          cantons: ['TI'] },
    { id: 'bag-region-genf',      name: 'Genf',            cantons: ['GE'] },
  ]
  console.log(`   ✓ ${bagRegions.length} BAG regions (for health insurance premium regions)`)

  // --------------------------------------------------------------------------
  // 7. Reference Data — Sample ZIP Codes (major Swiss cities)
  // --------------------------------------------------------------------------
  console.log('')
  console.log('📍 Sample ZIP Codes')

  const zipCodes = [
    { zip: '8000', city: 'Zürich',     canton: 'ZH' },
    { zip: '3000', city: 'Bern',       canton: 'BE' },
    { zip: '4001', city: 'Basel',      canton: 'BS' },
    { zip: '6000', city: 'Luzern',     canton: 'LU' },
    { zip: '9000', city: 'St. Gallen', canton: 'SG' },
    { zip: '7000', city: 'Chur',       canton: 'GR' },
    { zip: '5000', city: 'Aarau',      canton: 'AG' },
    { zip: '1200', city: 'Genf',       canton: 'GE' },
    { zip: '1000', city: 'Lausanne',   canton: 'VD' },
    { zip: '6500', city: 'Bellinzona', canton: 'TI' },
    { zip: '2500', city: 'Biel',       canton: 'BE' },
    { zip: '8400', city: 'Winterthur', canton: 'ZH' },
    { zip: '4500', city: 'Solothurn',  canton: 'SO' },
    { zip: '1700', city: 'Freiburg',   canton: 'FR' },
    { zip: '6300', city: 'Zug',        canton: 'ZG' },
    { zip: '4600', city: 'Olten',      canton: 'SO' },
    { zip: '4051', city: 'Basel',      canton: 'BS' },
    { zip: '8050', city: 'Zürich',     canton: 'ZH' },
  ]
  console.log(`   ✓ ${zipCodes.length} ZIP codes (major Swiss cities)`)

  // --------------------------------------------------------------------------
  // Summary
  // --------------------------------------------------------------------------
  console.log('')
  console.log('═══════════════════════════════════════════════════════════════')
  console.log('✅ Seed completed successfully!')
  console.log('')
  console.log(`   Organizations : 1`)
  console.log(`   Users         : ${usersData.length}`)
  console.log(`   Advisors      : 2`)
  console.log(`   Insurers      : ${insurersData.length}`)
  console.log(`   Swiss Cantons : ${swissCantons.length} (enum)`)
  console.log(`   BAG Regions   : ${bagRegions.length}`)
  console.log(`   ZIP Codes     : ${zipCodes.length} (reference)`)
  console.log('')
  console.log('   Default password for all users: Test1234!')
  console.log('═══════════════════════════════════════════════════════════════')
}

main()
  .catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error)
    console.error('')
    console.error('═══════════════════════════════════════════════════════════════')
    console.error('❌ Seed failed!')
    console.error(`   ${message}`)
    console.error('═══════════════════════════════════════════════════════════════')
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
