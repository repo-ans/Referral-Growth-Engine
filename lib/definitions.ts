import * as z from "zod";

export const SignupFormSchema = z.object({
  firstName: z.string().min(1, { error: "First name is required." }).trim(),
  lastName: z.string().min(1, { error: "Last name is required." }).trim(),
  email: z.email({ error: "Please enter a valid email." }).trim(),
  phone: z
    .string()
    .min(6, { error: "Please enter a valid phone number." })
    .trim(),
  password: z
    .string()
    .min(8, { error: "Be at least 8 characters long." })
    .regex(/[a-zA-Z]/, { error: "Contain at least one letter." })
    .regex(/[0-9]/, { error: "Contain at least one number." })
    .trim(),
});

export type SignupFormState =
  | {
      errors?: {
        firstName?: string[];
        lastName?: string[];
        email?: string[];
        phone?: string[];
        password?: string[];
      };
      message?: string;
    }
  | undefined;

export const LoginFormSchema = z.object({
  email: z.email({ error: "Please enter a valid email." }).trim(),
  password: z.string().min(1, { error: "Password is required." }).trim(),
});

export type LoginFormState =
  | {
      errors?: {
        email?: string[];
        password?: string[];
      };
      message?: string;
    }
  | undefined;

// Service types mirror index.html's 8-option grid; job_type in
// supabase/003_commission_engine.sql is unrelated (that's the n8n
// commission engine's own category, not this form's).
export const SERVICE_TYPES = [
  "AC Repair",
  "New AC Unit",
  "Heating / Furnace",
  "Tune-Up / Maintenance",
  "Heat Pump",
  "Air Quality",
  "Emergency",
  "Other / Not Sure",
] as const;

export const URGENCY_LEVELS = ["emergency", "today", "this-week", "flexible"] as const;

export const BookingFormSchema = z.object({
  serviceType: z.enum(SERVICE_TYPES, { error: "Please select a service type." }),
  urgency: z.enum(URGENCY_LEVELS, { error: "Please select an urgency." }),
  address: z.string().trim().optional(),
  city: z.string().trim().optional(),
  state: z.string().trim().optional(),
  postalCode: z.string().trim().min(1, { error: "ZIP code is required." }),
  notes: z.string().trim().optional(),
  startTime: z.string().min(1, { error: "Please pick a time slot." }),
  endTime: z.string().min(1, { error: "Please pick a time slot." }),
  smsConsent: z.literal(true, { error: "Please accept to continue." }),
  marketingConsent: z.literal(true, { error: "Please accept to continue." }),
});

export type BookingFormInput = z.infer<typeof BookingFormSchema>;

export type BookingFormState =
  | {
      errors?: Partial<Record<keyof BookingFormInput, string[]>>;
      message?: string;
    }
  | undefined;

// For the public, no-account booking form (app/refer/[code]) — same
// fields as BookingFormSchema, plus the identity fields a logged-in
// profile would otherwise have supplied, plus the referral code so the
// server action can re-resolve the referring partner itself (never
// trusted from the client alone).
export const CustomerBookingFormSchema = z.object({
  code: z.string().min(1, { error: "Missing referral code." }),
  firstName: z.string().min(1, { error: "First name is required." }).trim(),
  lastName: z.string().min(1, { error: "Last name is required." }).trim(),
  phone: z.string().min(6, { error: "Please enter a valid phone number." }).trim(),
  email: z.email({ error: "Please enter a valid email." }).trim(),
  serviceType: z.enum(SERVICE_TYPES, { error: "Please select a service type." }),
  urgency: z.enum(URGENCY_LEVELS, { error: "Please select an urgency." }),
  address: z.string().trim().optional(),
  city: z.string().trim().optional(),
  state: z.string().trim().optional(),
  postalCode: z.string().trim().min(1, { error: "ZIP code is required." }),
  notes: z.string().trim().optional(),
  startTime: z.string().min(1, { error: "Please pick a time slot." }),
  endTime: z.string().min(1, { error: "Please pick a time slot." }),
  smsConsent: z.literal(true, { error: "Please accept to continue." }),
  marketingConsent: z.literal(true, { error: "Please accept to continue." }),
});

export type CustomerBookingFormInput = z.infer<typeof CustomerBookingFormSchema>;
