import { z } from 'zod'

export const renewalStageSchema = z.object({
  stage: z.enum(['early', 'prepare', 'offer', 'negotiate', 'accepted', 'lost']),
  notes: z.string().optional().nullable(),
})

export const cancellationSchema = z.object({
  cancellation_type: z.string().optional().nullable(),
  cancellation_structured_reason: z.string().optional().nullable(),
  cancellation_effective_date: z.string().optional().nullable(),
  cancellation_notes: z.string().optional().nullable(),
  retention_attempted: z.boolean().default(false),
  retention_result: z.enum(['none', 'successful', 'failed']).default('none'),
  retention_notes: z.string().optional().nullable(),
})

export const upsellStageSchema = z.object({
  stage: z.enum(['identified', 'offered', 'accepted', 'rejected']),
  reason: z.string().optional().nullable(),
  potential_value: z.number().optional().nullable(),
})

export const linkApplicationSchema = z.object({
  application_id: z.string().min(1, 'Application ID ist erforderlich'),
})

export type RenewalStageInput = z.infer<typeof renewalStageSchema>
export type CancellationInput = z.infer<typeof cancellationSchema>
export type UpsellStageInput = z.infer<typeof upsellStageSchema>
