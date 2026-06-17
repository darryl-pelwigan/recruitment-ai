import { z } from "zod";

export const loginSchema = z.object({
  email: z.email({ message: "Enter a valid email address" }),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerSchema = z.object({
  full_name: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.email({ message: "Enter a valid email address" }),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Must contain at least one uppercase letter")
    .regex(/[0-9]/, "Must contain at least one number"),
  role: z.enum(["applicant", "recruiter"]),
});

export const profileSchema = z
  .object({
    full_name: z.string().min(2, "Full name must be at least 2 characters"),
    email: z.email({ message: "Enter a valid email address" }),
    current_password: z.string().optional(),
    new_password: z
      .string()
      .min(8, "Must be at least 8 characters")
      .regex(/[A-Z]/, "Must contain an uppercase letter")
      .regex(/[0-9]/, "Must contain a number")
      .optional()
      .or(z.literal("")),
  })
  .refine(
    (d) => !d.new_password || !!d.current_password,
    { message: "Current password is required to set a new one", path: ["current_password"] }
  );

export const CURRENCIES = [
  { code: "USD", symbol: "$", label: "USD – US Dollar" },
  { code: "PHP", symbol: "₱", label: "PHP – Philippine Peso" },
  { code: "EUR", symbol: "€", label: "EUR – Euro" },
  { code: "GBP", symbol: "£", label: "GBP – British Pound" },
  { code: "AUD", symbol: "A$", label: "AUD – Australian Dollar" },
  { code: "CAD", symbol: "C$", label: "CAD – Canadian Dollar" },
  { code: "JPY", symbol: "¥", label: "JPY – Japanese Yen" },
  { code: "SGD", symbol: "S$", label: "SGD – Singapore Dollar" },
];

export function getCurrencySymbol(code: string): string {
  return CURRENCIES.find((c) => c.code === code)?.symbol ?? code;
}

export function formatSalary(
  min: number | null | undefined,
  max: number | null | undefined,
  currency = "USD"
): string | null {
  if (!min && !max) return null;
  const sym = getCurrencySymbol(currency);
  const fmt = (n: number) =>
    n.toLocaleString("en-US", { maximumFractionDigits: 0 });
  if (min && max && min !== max)
    return `${sym}${fmt(min)} – ${sym}${fmt(max)} ${currency}`;
  return `${sym}${fmt((min ?? max)!)} ${currency}`;
}

export const jobSchema = z
  .object({
    title: z.string().min(1, "Title is required"),
    description: z.string().optional(),
    requirements: z.string().optional(),
    skills_required: z.string().optional(),
    location: z.string().optional(),
    employment_type: z
      .enum(["Full-time", "Part-time", "Contract", "Remote", ""])
      .optional(),
    salary_min: z.number().positive("Must be a positive number").optional(),
    salary_max: z.number().positive("Must be a positive number").optional(),
    salary_currency: z.string().default("USD"),
    company_name: z.string().optional(),
    company_logo_url: z.string().optional(),
    contact_email: z.email({ message: "Enter a valid email" }).optional().or(z.literal("")),
    status: z.enum(["open", "closed"]),
  })
  .refine(
    (d) =>
      d.salary_min == null ||
      d.salary_max == null ||
      d.salary_max >= d.salary_min,
    { message: "Max salary must be ≥ min salary", path: ["salary_max"] }
  );

export type LoginData = z.infer<typeof loginSchema>;
export type RegisterData = z.infer<typeof registerSchema>;
export type ProfileData = z.infer<typeof profileSchema>;
export type JobData = z.infer<typeof jobSchema>;
