import { z } from 'zod';

export const swissPhoneRegex = /^(\+41|0)[1-9]\d{1,3}[\s.-]?\d{2,4}[\s.-]?\d{2,4}[\s.-]?\d{2}$/;
export const ahvRegex = /^\d{3}\.\d{2}\.\d{3}\.\d{3}$/;

export const stringOrEmpty = z.string().optional().or(z.literal(''));
export const nullableUuid = z.string().uuid().optional().nullable();

export const OrganizationSchema = {
  create: z.object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email().optional().or(z.literal('')),
    type: z.enum(['broker', 'insurance', 'partner', 'other']).optional(),
    status: z.enum(['active', 'inactive', 'pending']).optional(),
    phone: z.string().regex(swissPhoneRegex).optional().nullable(),
    street: stringOrEmpty,
    zip: stringOrEmpty,
    city: stringOrEmpty,
    canton: stringOrEmpty,
  }),
  update: z.object({
    name: z.string().min(1).optional(),
    email: z.string().email().optional().nullable(),
    type: z.enum(['broker', 'insurance', 'partner', 'other']).optional(),
    status: z.enum(['active', 'inactive', 'pending']).optional(),
    phone: z.string().regex(swissPhoneRegex).optional().nullable(),
    street: stringOrEmpty,
    zip: stringOrEmpty,
    city: stringOrEmpty,
    canton: stringOrEmpty,
  }),
};

export const UserSchema = {
  create: z.object({
    email: z.string().email(),
    name: z.string().min(1),
    role: z.enum(['admin', 'management', 'broker', 'backoffice', 'finance', 'support', 'compliance']),
    password: z.string().min(8),
    organization_id: z.string().uuid(),
    phone: z.string().regex(swissPhoneRegex).optional().nullable(),
  }),
  update: z.object({
    email: z.string().email().optional(),
    name: z.string().min(1).optional(),
    role: z.enum(['admin', 'management', 'broker', 'backoffice', 'finance', 'support', 'compliance']).optional(),
    phone: z.string().regex(swissPhoneRegex).optional().nullable(),
  }),
};

export const AdvisorSchema = {
  create: z.object({
    firstname: z.string().min(1),
    lastname: z.string().min(1),
    email: z.string().email(),
    phone: z.string().regex(swissPhoneRegex).optional().nullable(),
    organization: z.string().optional(),
    role: z.enum(['advisor', 'broker', 'senior_advisor', 'teamlead']).optional(),
    active: z.boolean().optional(),
  }),
  update: z.object({
    firstname: z.string().min(1).optional(),
    lastname: z.string().min(1).optional(),
    email: z.string().email().optional(),
    phone: z.string().regex(swissPhoneRegex).optional().nullable(),
    organization: z.string().optional(),
    role: z.enum(['advisor', 'broker', 'senior_advisor', 'teamlead']).optional(),
    active: z.boolean().optional(),
  }),
};

export const ContractSchema = {
  create: z.object({
    policy_number: z.string().optional(),
    insurer: z.string().min(1),
    insurance_type: z.enum(['health', 'life', 'property', 'liability', 'accident', 'other']).optional(),
    customer_id: z.string().uuid(),
    status: z.enum(['active', 'cancelled', 'expired', 'pending', 'inactive']).optional(),
    premium_monthly: z.number().positive().optional().nullable(),
    premium_yearly: z.number().positive().optional().nullable(),
    start_date: z.string().optional().nullable(),
    end_date: z.string().optional().nullable(),
  }),
  update: z.object({
    policy_number: z.string().optional(),
    insurer: z.string().min(1).optional(),
    insurance_type: z.enum(['health', 'life', 'property', 'liability', 'accident', 'other']).optional(),
    status: z.enum(['active', 'cancelled', 'expired', 'pending', 'inactive']).optional(),
    premium_monthly: z.number().positive().optional().nullable(),
    premium_yearly: z.number().positive().optional().nullable(),
    start_date: z.string().optional().nullable(),
    end_date: z.string().optional().nullable(),
  }),
};

export const OrganizationSchemaEntry = OrganizationSchema;
export const UserSchemaEntry = UserSchema;
export const AdvisorSchemaEntry = AdvisorSchema;
export const ContractSchemaEntry = ContractSchema;
