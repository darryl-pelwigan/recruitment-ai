import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "react-router-dom";
import { z } from "zod";
import { api } from "../api/api";
import Navbar from "../components/Navbar";
import { useAuthStore } from "../store/authStore";
import { profileSchema, type ProfileData, CURRENCIES } from "../lib/schemas";

const API_BASE = "http://127.0.0.1:8000";

const extendedSchema = z.object({
  phone: z.string().optional(),
  location: z.string().optional(),
  headline: z.string().max(255, "Max 255 characters").optional(),
  summary: z.string().optional(),
  expected_salary: z.preprocess(
    (v) => (v === "" || v == null ? undefined : Number(v)),
    z.number().positive("Must be positive").optional()
  ),
  salary_currency: z.string().optional(),
  skills: z.string().optional(),
  linkedin_url: z.string().url("Enter a valid URL").optional().or(z.literal("")),
  portfolio_url: z.string().url("Enter a valid URL").optional().or(z.literal("")),
  years_of_experience: z.preprocess(
    (v) => (v === "" || v == null ? undefined : Number(v)),
    z.number().int().min(0).max(60).optional()
  ),
});
type ExtendedData = z.infer<typeof extendedSchema>;

const inputClass =
  "w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-colors";

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

export default function Profile() {
  const { user, updateUser } = useAuthStore();
  const [serverError, setServerError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [resumeUploading, setResumeUploading] = useState(false);
  const [extServerError, setExtServerError] = useState<string | null>(null);
  const [extSaveSuccess, setExtSaveSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const resumeInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProfileData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: user?.full_name ?? "",
      email: user?.email ?? "",
      current_password: "",
      new_password: "",
    },
  });

  const {
    register: regExt,
    handleSubmit: handleExtSubmit,
    formState: { errors: extErrors, isSubmitting: extSubmitting },
  } = useForm<ExtendedData>({
    resolver: zodResolver(extendedSchema),
    defaultValues: {
      phone: user?.phone ?? "",
      location: user?.location ?? "",
      headline: user?.headline ?? "",
      summary: user?.summary ?? "",
      expected_salary: user?.expected_salary ?? undefined,
      salary_currency: user?.salary_currency ?? "PHP",
      skills: user?.skills ?? "",
      linkedin_url: user?.linkedin_url ?? "",
      portfolio_url: user?.portfolio_url ?? "",
      years_of_experience: user?.years_of_experience ?? undefined,
    },
  });

  async function onSubmit(data: ProfileData) {
    setServerError(null);
    setSaveSuccess(false);
    try {
      const payload: Record<string, string | undefined> = {
        full_name: data.full_name,
        email: data.email,
      };
      if (data.new_password) {
        payload.current_password = data.current_password;
        payload.new_password = data.new_password;
      }
      const res = await api.put("/auth/profile", payload);
      updateUser(res.data);
      setSaveSuccess(true);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail ?? "Failed to save profile. Please try again.";
      setServerError(msg);
    }
  }

  async function onExtSubmit(data: ExtendedData) {
    setExtServerError(null);
    setExtSaveSuccess(false);
    try {
      const res = await api.put("/auth/extended-profile", data);
      updateUser(res.data);
      setExtSaveSuccess(true);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail ?? "Failed to save. Please try again.";
      setExtServerError(msg);
    }
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await api.post("/auth/avatar", form);
      updateUser(res.data);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail ?? "Failed to upload avatar.";
      alert(msg);
    } finally {
      setAvatarUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleResumeChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setResumeUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await api.post("/auth/resume", form);
      updateUser(res.data);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail ?? "Failed to upload resume.";
      alert(msg);
    } finally {
      setResumeUploading(false);
      if (resumeInputRef.current) resumeInputRef.current.value = "";
    }
  }

  const avatarSrc = user?.avatar_url ? `${API_BASE}${user.avatar_url}` : null;
  const resumeSrc = user?.resume_url ? `${API_BASE}${user.resume_url}` : null;
  const initials = user?.full_name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) ?? "?";

  const roleLabel: Record<string, string> = { hr: "HR", admin: "Admin", recruiter: "Recruiter", applicant: "Applicant" };
  const isApplicant = user?.role === "applicant";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-200">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Back to Dashboard
          </Link>
          <h1 className="mt-3 text-2xl font-bold text-gray-900 dark:text-white">My Profile</h1>
        </div>

        {/* Avatar card */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 mb-6">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Profile Picture</h2>
          <div className="flex items-center gap-5">
            <div className="relative shrink-0">
              <div className="w-20 h-20 rounded-full overflow-hidden bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center">
                {avatarSrc ? (
                  <img src={avatarSrc} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl font-bold text-teal-700 dark:text-teal-300">{initials}</span>
                )}
              </div>
              {avatarUploading && (
                <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">{user?.full_name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {roleLabel[user?.role ?? ""] ?? user?.role}
              </p>
              <label className={`mt-3 inline-flex cursor-pointer items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${avatarUploading ? "opacity-60 pointer-events-none" : ""}`}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                {avatarSrc ? "Change Photo" : "Upload Photo"}
                <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={handleAvatarChange} disabled={avatarUploading} />
              </label>
              <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">JPEG, PNG, WebP, GIF · max 5 MB</p>
            </div>
          </div>
        </div>

        {/* Account details */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 mb-6">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-5">Account Details</h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <Field label="Full Name" error={errors.full_name?.message}>
              <input {...register("full_name")} placeholder="Your full name" className={inputClass} />
            </Field>

            <Field label="Email Address" error={errors.email?.message}>
              <input {...register("email")} type="email" placeholder="you@example.com" className={inputClass} />
            </Field>

            <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Change Password <span className="text-xs font-normal text-gray-400">(leave blank to keep current)</span></p>
              <div className="space-y-4">
                <Field label="Current Password" error={errors.current_password?.message}>
                  <input {...register("current_password")} type="password" placeholder="••••••••" className={inputClass} autoComplete="current-password" />
                </Field>
                <Field label="New Password" error={errors.new_password?.message}>
                  <input {...register("new_password")} type="password" placeholder="Min 8 chars, 1 uppercase, 1 number" className={inputClass} autoComplete="new-password" />
                </Field>
              </div>
            </div>

            {serverError && <p className="text-sm text-red-500">{serverError}</p>}
            {saveSuccess && <p className="text-sm text-emerald-600 dark:text-emerald-400">Profile updated successfully.</p>}

            <div className="flex items-center justify-end pt-2">
              <button type="submit" disabled={isSubmitting} className="px-5 py-2 text-sm font-medium rounded-lg bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white transition-colors">
                {isSubmitting ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>

        {/* Applicant profile card — only for applicants */}
        {isApplicant && (
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 mb-6">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-1">Applicant Profile</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-5">This information will be shown to recruiters and pre-filled when you apply for jobs.</p>

            <form onSubmit={handleExtSubmit(onExtSubmit)} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Phone Number" error={extErrors.phone?.message}>
                  <input {...regExt("phone")} placeholder="+63 9XX XXX XXXX" className={inputClass} />
                </Field>
                <Field label="Location" error={extErrors.location?.message}>
                  <input {...regExt("location")} placeholder="City, Province" className={inputClass} />
                </Field>
              </div>

              <Field label="Headline" error={extErrors.headline?.message}>
                <input {...regExt("headline")} placeholder="e.g. Full Stack Developer · 5 years experience" className={inputClass} />
              </Field>

              <Field label="Professional Summary" error={extErrors.summary?.message}>
                <textarea {...regExt("summary")} rows={4} placeholder="Brief bio about your experience and goals..." className={inputClass + " resize-y"} />
              </Field>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Years of Experience" error={extErrors.years_of_experience?.message}>
                  <input {...regExt("years_of_experience")} type="number" min={0} max={60} placeholder="0" className={inputClass} />
                </Field>
                <Field label="Skills" error={extErrors.skills?.message}>
                  <input {...regExt("skills")} placeholder="React, Python, SQL (comma-separated)" className={inputClass} />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Expected Salary" error={extErrors.expected_salary?.message}>
                  <input {...regExt("expected_salary")} type="number" min={0} placeholder="e.g. 50000" className={inputClass} />
                </Field>
                <Field label="Currency" error={extErrors.salary_currency?.message}>
                  <select {...regExt("salary_currency")} className={inputClass}>
                    {CURRENCIES.map((c) => (
                      <option key={c.code} value={c.code}>{c.label}</option>
                    ))}
                  </select>
                </Field>
              </div>

              <Field label="LinkedIn URL" error={extErrors.linkedin_url?.message}>
                <input {...regExt("linkedin_url")} placeholder="https://linkedin.com/in/yourprofile" className={inputClass} />
              </Field>

              <Field label="Portfolio / Website URL" error={extErrors.portfolio_url?.message}>
                <input {...regExt("portfolio_url")} placeholder="https://yourportfolio.com" className={inputClass} />
              </Field>

              {extServerError && <p className="text-sm text-red-500">{extServerError}</p>}
              {extSaveSuccess && <p className="text-sm text-emerald-600 dark:text-emerald-400">Profile saved successfully.</p>}

              <div className="flex items-center justify-end pt-2">
                <button type="submit" disabled={extSubmitting} className="px-5 py-2 text-sm font-medium rounded-lg bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white transition-colors">
                  {extSubmitting ? "Saving..." : "Save Profile"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Resume card — only for applicants */}
        {isApplicant && (
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-1">Resume</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Your saved resume will be auto-linked when you apply for jobs.</p>

            {resumeSrc && (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 mb-4">
                <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-600 dark:text-red-400">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">Current Resume</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">PDF file on record</p>
                </div>
                <a href={resumeSrc} target="_blank" rel="noreferrer" className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                  View
                </a>
              </div>
            )}

            <label className={`flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl border-2 border-dashed cursor-pointer transition-colors ${resumeUploading ? "opacity-60 pointer-events-none border-gray-200 dark:border-gray-700" : "border-gray-200 dark:border-gray-700 hover:border-teal-400 dark:hover:border-teal-600 hover:text-teal-600 dark:hover:text-teal-400"} text-sm text-gray-500 dark:text-gray-400`}>
              {resumeUploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  {resumeSrc ? "Replace Resume" : "Upload Resume"} (PDF, max 5 MB)
                </>
              )}
              <input ref={resumeInputRef} type="file" accept=".pdf,application/pdf" className="hidden" onChange={handleResumeChange} disabled={resumeUploading} />
            </label>
          </div>
        )}
      </main>
    </div>
  );
}
