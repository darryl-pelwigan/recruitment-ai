import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { api } from "../api/api";
import Navbar from "../components/Navbar";
import { useAuthStore } from "../store/authStore";
import { formatSalary } from "../lib/schemas";

const API_BASE = "http://127.0.0.1:8000";

interface Job {
  id: number;
  title: string;
  description: string | null;
  requirements: string | null;
  skills_required: string | null;
  employment_type: string | null;
  location: string | null;
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string;
  company_name: string | null;
  company_logo_url: string | null;
  contact_email: string | null;
  status: string;
  created_at: string;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 text-gray-400 dark:text-gray-500">{icon}</div>
      <div>
        <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide font-medium">{label}</p>
        <div className="text-sm font-medium text-gray-900 dark:text-white mt-0.5">{value}</div>
      </div>
    </div>
  );
}

export default function JobDetail() {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated, user } = useAuthStore();
  const navigate = useNavigate();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const canManage = user && ["admin", "hr", "recruiter"].includes(user.role);
  const salary = job ? formatSalary(job.salary_min, job.salary_max, job.salary_currency) : null;

  useEffect(() => {
    api
      .get(`/jobs/${id}`)
      .then((res) => setJob(res.data))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-200">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-64 bg-gray-200 dark:bg-gray-800 rounded-lg" />
            <div className="h-4 w-48 bg-gray-200 dark:bg-gray-800 rounded" />
            <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-3">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-4 bg-gray-200 dark:bg-gray-800 rounded" />
                ))}
              </div>
              <div className="h-64 bg-gray-200 dark:bg-gray-800 rounded-2xl" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (notFound || !job) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-200">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <p className="text-lg font-semibold text-gray-900 dark:text-white">Job not found</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">This listing may have been removed.</p>
          <Link to="/jobs" className="mt-6 inline-flex items-center gap-1.5 text-sm text-teal-600 dark:text-teal-400 hover:underline">
            ← Back to all jobs
          </Link>
        </main>
      </div>
    );
  }

  const skills = job.skills_required
    ? job.skills_required.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  const logoSrc = isAuthenticated && job.company_logo_url ? `${API_BASE}${job.company_logo_url}` : null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-200">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        <Link
          to="/jobs"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors mb-6"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back to Jobs
        </Link>

        {/* Page header */}
        <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
          <div className="flex items-start gap-4">
            {/* Company logo */}
            {isAuthenticated && (
              <div className="hidden sm:flex shrink-0 w-14 h-14 rounded-xl overflow-hidden bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 items-center justify-center">
                {logoSrc ? (
                  <img src={logoSrc} alt={job.company_name ?? "Company"} className="w-full h-full object-cover" />
                ) : (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-teal-500 dark:text-teal-400">
                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                    <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
                  </svg>
                )}
              </div>
            )}
            <div>
              {isAuthenticated && job.company_name && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-0.5">{job.company_name}</p>
              )}
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{job.title}</h1>
                <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${
                  job.status === "open"
                    ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
                }`}>
                  {job.status === "open" ? "Open" : "Closed"}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                {job.employment_type && (
                  <span className="inline-flex items-center gap-1.5">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                      <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
                    </svg>
                    {job.employment_type}
                  </span>
                )}
                {job.location && (
                  <span className="inline-flex items-center gap-1.5">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    {job.location}
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  Posted {formatDate(job.created_at)}
                </span>
              </div>
            </div>
          </div>

          {canManage && (
            <button
              onClick={() => navigate(`/jobs/${job.id}/edit`)}
              className="px-4 py-2 text-sm font-medium rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              Edit Job
            </button>
          )}
        </div>

        {/* Two-column body */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left: description + requirements + skills */}
          <div className="lg:col-span-2 space-y-6">
            {job.description && (
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
                <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Job Description</h2>
                <div className="prose-editor text-sm text-gray-600 dark:text-gray-400" dangerouslySetInnerHTML={{ __html: job.description }} />
              </div>
            )}

            {job.requirements && (
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
                <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Requirements</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-line leading-relaxed">{job.requirements}</p>
              </div>
            )}

            {skills.length > 0 && (
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
                <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Skills Required</h2>
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill) => (
                    <span key={skill} className="px-3 py-1 text-xs font-medium rounded-full bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 border border-teal-100 dark:border-teal-800">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: overview card */}
          <div className="space-y-4">
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 space-y-5">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">Job Overview</h2>

              {job.employment_type && (
                <InfoRow
                  icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" /></svg>}
                  label="Job Type"
                  value={job.employment_type}
                />
              )}

              {job.location && (
                <InfoRow
                  icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>}
                  label="Location"
                  value={job.location}
                />
              )}

              <InfoRow
                icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>}
                label="Date Posted"
                value={formatDate(job.created_at)}
              />

              {/* Salary */}
              <div className="flex items-start gap-3">
                <div className="mt-0.5 text-gray-400 dark:text-gray-500">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="1" x2="12" y2="23" />
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide font-medium">Salary</p>
                  {isAuthenticated ? (
                    salary ? (
                      <p className="text-sm font-semibold text-teal-700 dark:text-teal-400 mt-0.5">{salary}</p>
                    ) : (
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-0.5">Not specified</p>
                    )
                  ) : (
                    <Link to="/login" className="text-sm font-medium text-teal-600 dark:text-teal-400 hover:underline mt-0.5 block">
                      Login to view salary
                    </Link>
                  )}
                </div>
              </div>

              {/* Contact email — hidden for guests */}
              {isAuthenticated && job.contact_email && (
                <InfoRow
                  icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>}
                  label="Contact"
                  value={<a href={`mailto:${job.contact_email}`} className="text-teal-600 dark:text-teal-400 hover:underline">{job.contact_email}</a>}
                />
              )}

              <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
                {job.status !== "open" ? (
                  <div className="w-full py-2.5 text-center text-sm font-medium rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed">
                    Position Closed
                  </div>
                ) : isAuthenticated ? (
                  <button className="w-full py-2.5 text-sm font-medium rounded-xl bg-teal-600 hover:bg-teal-700 text-white transition-colors">
                    Apply Now
                  </button>
                ) : (
                  <Link
                    to={`/login?redirect=/jobs/${job.id}`}
                    className="block w-full py-2.5 text-center text-sm font-medium rounded-xl bg-teal-600 hover:bg-teal-700 text-white transition-colors"
                  >
                    Login to Apply
                  </Link>
                )}
              </div>
            </div>

            {!isAuthenticated && (
              <div className="bg-teal-50 dark:bg-teal-900/20 border border-teal-100 dark:border-teal-800 rounded-2xl p-4 text-center">
                <p className="text-sm text-teal-800 dark:text-teal-300 font-medium">New to RecruitAI?</p>
                <p className="text-xs text-teal-600 dark:text-teal-400 mt-1 mb-3">Create a free account to apply for jobs.</p>
                <Link to="/register" className="inline-block px-4 py-1.5 text-xs font-medium rounded-lg bg-teal-600 hover:bg-teal-700 text-white transition-colors">
                  Create Account
                </Link>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
