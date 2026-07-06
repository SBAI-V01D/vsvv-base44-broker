import { z } from 'zod'

export const createApplicationSchema = z.object({
  customer_id: z.string().min(1, 'Customer ist erforderlich'),
  customer_name: z.string().optional().nullable(),
  primary_customer_id: z.string().optional().nullable(),
  is_family_member: z.boolean().default(false),
  kundentyp: z.enum(['privat', 'geschaeft']).default('privat'),
  sparte: z.string().optional().nullable(),
  sparte_data: z.any().optional(),
  insurance_type: z.string().optional().nullable(),
  product: z.string().optional().nullable(),
  insurer: z.string().min(1, 'Versicherer ist erforderlich'),
  status: z.enum(['new', 'in_progress', 'waiting', 'approved', 'rejected', 'archived']).default('new'),
  custom_status: z.string().optional().nullable(),
  estimated_premium_monthly: z.number().optional().nullable(),
  estimated_premium_yearly: z.number().optional().nullable(),
  requested_start_date: z.string().optional().nullable(),
  policy_number: z.string().optional().nullable(),
  contract_start_date: z.string().optional().nullable(),
  contract_end_date: z.string().optional().nullable(),
  commission_estimate: z.number().optional().nullable(),
  assigned_broker: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
})

export const updateApplicationSchema = createApplicationSchema.partial()

export const transitionStatusSchema = z.object({
  status: z.enum(['new', 'in_progress', 'waiting', 'approved', 'rejected', 'archived']),
  reason: z.string().optional().nullable(),
})

export type CreateApplicationInput = z.infer<typeof createApplicationSchema>
export type UpdateApplicationInput = z.infer<typeof updateApplicationSchema>
export type TransitionStatusInput = z.infer<typeof transitionStatusSchema>
