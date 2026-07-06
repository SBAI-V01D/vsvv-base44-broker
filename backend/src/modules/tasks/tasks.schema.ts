import { z } from 'zod'

export const assignTaskSchema = z.object({
  assigned_to: z.string().min(1, 'Assignee ist erforderlich'),
})

export const completeTaskSchema = z.object({
  notes: z.string().optional().nullable(),
})

export type AssignTaskInput = z.infer<typeof assignTaskSchema>
