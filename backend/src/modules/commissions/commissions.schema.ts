import { z } from 'zod'

export const calculateCommissionSchema = z.object({
  contract_id: z.string().min(1),
  premium_yearly: z.number().positive(),
  rate: z.number().min(0).max(100).optional(),
  commission_type: z.enum(['einmalig', 'wiederkehrend']).default('einmalig'),
  period_start: z.string().optional().nullable(),
  period_end: z.string().optional().nullable(),
})

export const splitSchema = z.object({
  advisor_id: z.string().min(1),
  advisor_share_percent: z.number().min(0).max(100).default(70),
  teamlead_id: z.string().optional().nullable(),
  teamlead_share_percent: z.number().min(0).max(100).default(30),
})

export const approvePayoutSchema = z.object({
  payout_id: z.string().min(1),
  status: z.enum(['approved', 'paid', 'cancelled']),
  notes: z.string().optional().nullable(),
})

export type CalculateCommissionInput = z.infer<typeof calculateCommissionSchema>
export type SplitInput = z.infer<typeof splitSchema>
