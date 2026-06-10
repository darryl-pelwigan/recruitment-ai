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
    // salary uses setValueAs in register() — values arrive as number | undefined, never strings
    salary_min: z.number().positive("Must be a positive number").optional(),
    salary_max: z.number().positive("Must be a positive number").optional(),
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
export type JobData = z.infer<typeof jobSchema>;
