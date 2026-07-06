import type { FastifyPluginAsync } from 'fastify'
import { prisma } from '../../lib/prisma.js'
import bcrypt from 'bcryptjs'

const portalRoutes: FastifyPluginAsync = async (app) => {
  // Portal Login (Customer JWT)
  app.post('/api/portal/login', async (request, reply) => {
    const { email, password } = request.body as { email: string; password: string }

    const customer = await prisma.customer.findFirst({
      where: { email, portal_enabled: true },
    })

    if (!customer || !customer.portal_password_hash) {
      return reply.status(401).send({ error: 'Ungültige E-Mail oder Passwort' })
    }

    const valid = await bcrypt.compare(password, customer.portal_password_hash)
    if (!valid) {
      return reply.status(401).send({ error: 'Ungültige E-Mail oder Passwort' })
    }

    const token = await reply.jwtSign({
      id: customer.id,
      email: customer.email,
      type: 'customer',
      organization_id: customer.organization_id,
    }, { expiresIn: '1d' })

    await prisma.customer.update({
      where: { id: customer.id },
      data: { portal_last_login: new Date() },
    })

    return { token, customer: { id: customer.id, first_name: customer.first_name, last_name: customer.last_name, email: customer.email } }
  })

  // Customer eigene Daten abrufen
  app.get('/api/portal/me', async (request) => {
    const customerId = (request.user as any)?.id
    return prisma.customer.findUnique({
      where: { id: customerId },
      select: {
        id: true, first_name: true, last_name: true, email: true,
        phone: true, street: true, zip_code: true, city: true,
        birthdate: true, civil_status: true, nationality: true,
      },
    })
  })

  // Customer: eigene Verträge
  app.get('/api/portal/my-contracts', async (request) => {
    const customerId = (request.user as any)?.id
    return prisma.contract.findMany({
      where: { customer_id: customerId, archived: false },
      orderBy: { created_at: 'desc' },
      select: {
        id: true, policy_number: true, insurer: true, product: true,
        status: true, premium_monthly: true, premium_yearly: true,
        start_date: true, end_date: true,
      },
    })
  })

  // Customer: eigene Anträge
  app.get('/api/portal/my-applications', async (request) => {
    const customerId = (request.user as any)?.id
    return prisma.application.findMany({
      where: { customer_id: customerId, archived: false },
      orderBy: { created_at: 'desc' },
      select: {
        id: true, insurer: true, product: true, status: true,
        estimated_premium_monthly: true, created_at: true,
      },
    })
  })

  // Customer: eigene Dokumente
  app.get('/api/portal/my-documents', async (request) => {
    const customerId = (request.user as any)?.id
    return prisma.document.findMany({
      where: { customer_id: customerId, archived: false },
      orderBy: { created_at: 'desc' },
      select: {
        id: true, name: true, doc_type: true, category: true,
        file_url: true, created_at: true, uploaded_at: true,
      },
    })
  })

  // Passwort setzen (Portal Setup)
  app.post('/api/portal/setup-password', async (request, reply) => {
    const { email, password, token } = request.body as { email: string; password: string; token?: string }

    const customer = await prisma.customer.findFirst({
      where: { email, portal_enabled: false },
    })
    if (!customer) {
      return reply.status(404).send({ error: 'Kunde nicht gefunden oder Portal bereits aktiviert' })
    }

    const password_hash = await bcrypt.hash(password, 12)
    await prisma.customer.update({
      where: { id: customer.id },
      data: {
        portal_enabled: true,
        portal_password_hash: password_hash,
        portal_must_change_password: false,
        portal_password_last_changed: new Date(),
      },
    })

    return { message: 'Portal-Passwort gesetzt. Sie können sich jetzt einloggen.' }
  })
}

export default portalRoutes
