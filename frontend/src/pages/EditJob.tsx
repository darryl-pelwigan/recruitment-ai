import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, useParams, Link } from "react-router-dom";
import { api } from "../api/api";
import Navbar from "../components/Navbar";
import RichTextEditor from "../components/RichTextEditor";
import { jobSchema, type JobData } from "../lib/schemas";

const EMPLOYMENT_TYPES = ["Full-time", "Part-time", "Contract", "Remote"];

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
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {label}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

const inputClass =
  "w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-colors";

export default function EditJob() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<JobData>({ resolver: zodResolver(jobSchema) });

  useEffect(() => {
    api
      .get(`/jobs/${id}`)
      .then((res) => {
        const j = res.data;
        reset({
          title: j.title ?? "",
          description: j.description ?? "",
          requirements: j.requirements ?? "",
          skills_required: j.skills_required ?? "",
          location: j.location ?? "",
          employment_type: j.employment_type ?? "",
          salary_min: j.salary_min ?? undefined,
          salary_max: j.salary_max ?? undefined,
          status: j.status ?? "open",
        });
      })
      .catch(() => navigate("/jobs"))
      .finally(() => setLoading(false));
  }, [id, reset, navigate]);

  async function onSubmit(data: JobData) {
    setServerError(null);
    try {
      await api.put(`/jobs/${id}`, {
        ...data,
        employment_type: data.employment_type || null,
        salary_min: data.salary_min ?? null,
        salary_max: data.salary_max ?? null,
      });
      navigate("/jobs");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail ?? "Failed to update job. Please try again.";
      setServerError(msg);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-200">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-10 rounded-lg bg-gray-200 dark:bg-gray-800 animate-pulse" />
          ))}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-200">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link
            to="/jobs"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Back to Jobs
          </Link>
          <h1 className="mt-3 text-2xl font-bold text-gray-900 dark:text-white">
            Edit Job
          </h1>
        </div>

        <div className="max-w-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

            <Field label="Job Title *" error={errors.title?.message}>
              <input
                {...register("title")}
                placeholder="e.g. Senior Frontend Developer"
                className={inputClass}
              />
            </Field>

            <Field label="Description" error={errors.description?.message}>
              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <RichTextEditor
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Brief overview of the role..."
                  />
                )}
              />
            </Field>

            <Field label="Requirements" error={errors.requirements?.message}>
              <textarea
                {...register("requirements")}
                rows={3}
                placeholder="List the key requirements..."
                className={inputClass}
              />
            </Field>

            <Field label="Skills Required" error={errors.skills_required?.message}>
              <input
                {...register("skills_required")}
                placeholder="e.g. React, TypeScript, Node.js"
                className={inputClass}
              />
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Field label="Location" error={errors.location?.message}>
                <input
                  {...register("location")}
                  placeholder="e.g. Remote, New York, NY"
                  className={inputClass}
                />
              </Field>

              <Field label="Employment Type" error={errors.employment_type?.message}>
                <select {...register("employment_type")} className={inputClass}>
                  <option value="">Select type...</option>
                  {EMPLOYMENT_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </Field>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Field label="Min Salary (USD)" error={errors.salary_min?.message}>
                <input
                  {...register("salary_min", {
                    setValueAs: (v) => (v === "" || v == null ? undefined : parseFloat(v)),
                  })}
                  type="number"
                  min={0}
                  placeholder="e.g. 80000"
                  className={inputClass}
                />
              </Field>

              <Field label="Max Salary (USD)" error={errors.salary_max?.message}>
                <input
                  {...register("salary_max", {
                    setValueAs: (v) => (v === "" || v == null ? undefined : parseFloat(v)),
                  })}
                  type="number"
                  min={0}
                  placeholder="e.g. 120000"
                  className={inputClass}
                />
              </Field>
            </div>

            <Field label="Status" error={errors.status?.message}>
              <select {...register("status")} className={inputClass}>
                <option value="open">Open</option>
                <option value="closed">Closed</option>
              </select>
            </Field>

            {serverError && (
              <p className="text-sm text-red-500 text-center">{serverError}</p>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
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
                {isSubmitting ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
