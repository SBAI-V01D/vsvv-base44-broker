import { z } from 'zod'

export const qualifyLeadSchema = z.object({
  status: z.enum(['new', 'contacted', 'qualified', 'converted', 'lost']),
  notes: z.string().optional().nullable(),
})

export const autopilotSchema = z.object({
  autopilot_status: z.enum(['off', 'active', 'paused']),
})

export const offerStatusSchema = z.object({
  offer_status: z.enum(['none', 'preparing', 'ready', 'sent', 'accepted', 'rejected']),
  notes: z.string().optional().nullable(),
})

export type QualifyLeadInput = z.infer<typeof qualifyLeadSchema>
export type AutopilotInput = z.infer<typeof autopilotSchema>
