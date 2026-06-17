import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../api/api";
import Navbar from "../components/Navbar";
import RichTextEditor from "../components/RichTextEditor";
import { jobSchema, type JobData, CURRENCIES } from "../lib/schemas";

const EMPLOYMENT_TYPES = ["Full-time", "Part-time", "Contract", "Intern"];
const API_BASE = "http://127.0.0.1:8000";

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
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {label}
        </label>
      )}
      {children}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

const inputClass =
  "w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-colors";

export default function PostJob() {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<JobData>({
    resolver: zodResolver(jobSchema),
    defaultValues: { status: "open", salary_currency: "USD" },
  });

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await api.post<{ logo_url: string }>("/jobs/logo", form);
      setValue("company_logo_url", res.data.logo_url);
      setLogoPreview(`${API_BASE}${res.data.logo_url}`);
    } catch {
      alert("Failed to upload logo. Please try again.");
    } finally {
      setLogoUploading(false);
    }
  }

  async function onSubmit(data: JobData) {
    setServerError(null);
    try {
      await api.post("/jobs/", {
        ...data,
        employment_type: data.employment_type || null,
        salary_min: data.salary_min ?? null,
        salary_max: data.salary_max ?? null,
        contact_email: data.contact_email || null,
      });
      navigate("/jobs");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail ?? "Failed to create job. Please try again.";
      setServerError(msg);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-200">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Back to Jobs
          </button>
          <h1 className="mt-3 text-2xl font-bold text-gray-900 dark:text-white">
            Post a Job
          </h1>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

            {/* Left col — Job Overview */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 space-y-5">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">Job Overview</h2>

              <Field label="Job Title *" error={errors.title?.message}>
                <input {...register("title")} placeholder="e.g. Senior Frontend Developer" className={inputClass} />
              </Field>

              <Field label="Location" error={errors.location?.message}>
                <input {...register("location")} placeholder="e.g. Remote, New York, NY" className={inputClass} />
              </Field>

              <Field label="Employment Type" error={errors.employment_type?.message}>
                <select {...register("employment_type")} className={inputClass}>
                  <option value="">Select type...</option>
                  {EMPLOYMENT_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </Field>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Salary</label>
                <div className="flex gap-2 mb-2">
                  <select {...register("salary_currency")} className={inputClass}>
                    {CURRENCIES.map((c) => (
                      <option key={c.code} value={c.code}>{c.label}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="" error={errors.salary_min?.message}>
                    <input
                      {...register("salary_min", {
                        setValueAs: (v) => (v === "" || v == null ? undefined : parseFloat(v)),
                      })}
                      type="number" min={0} placeholder="Min" className={inputClass}
                    />
                  </Field>
                  <Field label="" error={errors.salary_max?.message}>
                    <input
                      {...register("salary_max", {
                        setValueAs: (v) => (v === "" || v == null ? undefined : parseFloat(v)),
                      })}
                      type="number" min={0} placeholder="Max" className={inputClass}
                    />
                  </Field>
                </div>
              </div>

              <Field label="Skills Required" error={errors.skills_required?.message}>
                <input {...register("skills_required")} placeholder="e.g. React, TypeScript, Node.js" className={inputClass} />
              </Field>

              <Field label="Status" error={errors.status?.message}>
                <select {...register("status")} className={inputClass}>
                  <option value="open">Open</option>
                  <option value="closed">Closed</option>
                </select>
              </Field>

              {/* Company info */}
              <div className="pt-4 border-t border-gray-100 dark:border-gray-800 space-y-4">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Company Info</h3>

                <Field label="Company Name" error={errors.company_name?.message}>
                  <input {...register("company_name")} placeholder="e.g. Acme Corp" className={inputClass} />
                </Field>

                <Field label="Contact Email" error={errors.contact_email?.message}>
                  <input {...register("contact_email")} type="email" placeholder="applicants@company.com" className={inputClass} />
                </Field>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Company Logo</label>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex items-center justify-center overflow-hidden shrink-0">
                      {logoPreview ? (
                        <img src={logoPreview} alt="Logo preview" className="w-full h-full object-cover" />
                      ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                          <rect x="3" y="3" width="18" height="18" rx="2" />
                          <circle cx="8.5" cy="8.5" r="1.5" />
                          <polyline points="21 15 16 10 5 21" />
                        </svg>
                      )}
                    </div>
                    <label className={`cursor-pointer px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${logoUploading ? "opacity-60 pointer-events-none" : ""}`}>
                      {logoUploading ? "Uploading..." : "Upload Logo"}
                      <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} disabled={logoUploading} />
                    </label>
                  </div>
                  <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">PNG, JPG, WebP, SVG · max 2 MB</p>
                </div>
              </div>
            </div>

            {/* Right col (col-span-2) — Description + Requirements */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
                <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Job Description</h2>
                <Field label="" error={errors.description?.message}>
                  <Controller
                    name="description"
                    control={control}
                    render={({ field }) => (
                      <RichTextEditor value={field.value} onChange={field.onChange} placeholder="Brief overview of the role..." />
                    )}
                  />
                </Field>
              </div>

              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
                <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Requirements</h2>
                <Field label="" error={errors.requirements?.message}>
                  <textarea {...register("requirements")} rows={6} placeholder="List the key requirements..." className={inputClass} />
                </Field>
              </div>
            </div>
          </div>

          {serverError && (
            <p className="mt-4 text-sm text-red-500 text-center">{serverError}</p>
          )}

          <div className="flex items-center justify-end gap-3 mt-6">
            <Link
              to="/jobs"
              className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-sm font-medium rounded-lg bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white transition-colors"
            >
              {isSubmitting ? "Posting..." : "Post Job"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
