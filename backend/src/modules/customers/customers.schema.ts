// ============================================================================
// VSVV Backend — Customer Validation Schemas (Zod)
//
// Swiss-specific validations including AHV number format, Swiss cantons,
// phone numbers, and civil status according to Swiss civil law.
// ============================================================================

import { z } from 'zod';

// ---------------------------------------------------------------------------
// Swiss Canton Enum — all 26 cantonal abbreviations
// ---------------------------------------------------------------------------

export const SwissCantonEnum = z.enum([
  'AG',
  'AI',
  'AR',
  'BE',
  'BL',
  'BS',
  'FR',
  'GE',
  'GL',
  'GR',
  'JU',
  'LU',
  'NE',
  'NW',
  'OW',
  'SG',
  'SH',
  'SO',
  'SZ',
  'TG',
  'TI',
  'UR',
  'VD',
  'VS',
  'ZG',
  'ZH',
]);

// ---------------------------------------------------------------------------
// AHV Number Regex — Swiss social security number format
// Format: 3 digits . 2 digits . 3 digits . 3 digits
// Example: 756.12.345.678
// ---------------------------------------------------------------------------

const AHV_REGEX = /^\d{3}\.\d{2}\.\d{3}\.\d{3}$/;

// ---------------------------------------------------------------------------
// Swiss Phone Regex — supports +41, 0xx prefixes
// ---------------------------------------------------------------------------

const SWISS_PHONE_REGEX = /^(\+41|0)[1-9]\d{1,3}[\s.-]?\d{2,4}[\s.-]?\d{2,4}[\s.-]?\d{2}$/;

// ---------------------------------------------------------------------------
// Create Customer Schema — full validation for new customers
// ---------------------------------------------------------------------------

export const createCustomerSchema = z.object({
  // --- Identity ---
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),

  // --- Contact ---
  email: z
    .string()
    .email('Invalid email format')
    .optional()
    .or(z.literal('')),
  phone: z
    .string()
    .regex(SWISS_PHONE_REGEX, 'Invalid Swiss phone number format')
    .optional()
    .or(z.literal('')),
  mobile: z
    .string()
    .regex(SWISS_PHONE_REGEX, 'Invalid Swiss mobile number format')
    .optional()
    .or(z.literal('')),

  // --- Address ---
  street: z.string().optional().or(z.literal('')),
  zip_code: z.string().optional().or(z.literal('')),
  city: z.string().optional().or(z.literal('')),
  canton: SwissCantonEnum.optional(),

  // --- Personal Details ---
  birthdate: z.string().optional(), // ISO date string
  ahv_number: z
    .string()
    .regex(AHV_REGEX, 'Invalid AHV format — expected ###.##.###.###')
    .optional()
    .or(z.literal('')),
  civil_status: z
    .enum([
      'single',
      'married',
      'divorced',
      'widowed',
      'registered_partnership',
      'dissolved_partnership',
    ])
    .optional(),

  // --- Classification ---
  customer_type: z.enum(['private', 'business']).default('private'),
  status: z.enum(['active', 'inactive', 'prospect']).default('active'),
  mandate_status: z
    .enum(['valid', 'invalid', 'pending', 'expired'])
    .default('pending'),

  // --- Business Customers ---
  company_name: z.string().optional().or(z.literal('')),
  uid_number: z.string().optional().or(z.literal('')),

  // --- Notes ---
  notes: z.string().optional().or(z.literal('')),

  // --- Advisors ---
  advisor_id: z.string().uuid('Invalid advisor ID').optional().nullable(),

  // --- Family Relations ---
  is_family_member: z.boolean().default(false),
  primary_customer_id: z
    .string()
    .uuid('Invalid primary customer ID')
    .optional()
    .nullable(),
  family_role: z
    .enum(['primary', 'spouse', 'child', 'parent', 'other'])
    .default('primary'),

  // --- Access Control ---
  access_level: z
    .enum([
      'public_admin_only',
      'assigned_advisors_only',
      'team_visible',
      'all_internal',
    ])
    .default('assigned_advisors_only'),

  // --- Portal ---
  portal_enabled: z.boolean().default(false),
});

// ---------------------------------------------------------------------------
// Update Customer Schema — all fields optional for partial updates
// ---------------------------------------------------------------------------

export const updateCustomerSchema = createCustomerSchema.partial();

// ---------------------------------------------------------------------------
// Inferred Types
// ---------------------------------------------------------------------------

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
