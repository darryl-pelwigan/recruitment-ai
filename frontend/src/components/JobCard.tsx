import { Link, useNavigate } from "react-router-dom";
import { api } from "../api/api";
import { useAuthStore } from "../store/authStore";

export interface Job {
  id: number;
  title: string;
  description: string | null;
  employment_type: string | null;
  location: string | null;
  salary_min: number | null;
  salary_max: number | null;
  status: string;
  created_at: string;
}

function stripHtml(html: string): string {
  const div = document.createElement("div");
  div.innerHTML = html;
  return div.textContent ?? div.innerText ?? "";
}

function formatSalary(min: number | null, max: number | null): string | null {
  if (!min && !max) return null;
  const fmt = (n: number) => n.toLocaleString("en-US");
  if (min && max && min !== max) return `$${fmt(min)} – $${fmt(max)} USD`;
  return `$${fmt((min ?? max)!)} USD`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

interface Props {
  job: Job;
  canManage?: boolean;
  onDeleted?: (id: number) => void;
}

export default function JobCard({ job, canManage = false, onDeleted }: Props) {
  const { isAuthenticated } = useAuthStore();
  const salary = formatSalary(job.salary_min, job.salary_max);
  const navigate = useNavigate();
  const plainDescription = job.description ? stripHtml(job.description) : null;

  async function handleDelete() {
    if (!window.confirm(`Delete "${job.title}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/jobs/${job.id}`);
      onDeleted?.(job.id);
    } catch {
      alert("Failed to delete job. Please try again.");
    }
  }

  return (
    <div className="group bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 hover:border-teal-300 dark:hover:border-teal-700 hover:shadow-lg dark:hover:shadow-gray-900/60 transition-all duration-200">
      <div className="flex items-start gap-4">

        {/* Left: icon */}
        <div className="hidden sm:flex shrink-0 w-11 h-11 rounded-xl bg-teal-50 dark:bg-teal-900/30 items-center justify-center mt-0.5">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-teal-600 dark:text-teal-400">
            <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
            <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
          </svg>
        </div>

        {/* Middle: content */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <Link
              to={`/jobs/${job.id}`}
              className="text-base font-semibold text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 hover:underline transition-colors"
            >
              {job.title}
            </Link>
            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
              job.status === "open"
                ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
                : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
            }`}>
              {job.status === "open" ? "Open" : "Closed"}
            </span>
          </div>

          {plainDescription && (
            <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
              {plainDescription}
            </p>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-4">
            {job.employment_type && (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2.5 py-1 rounded-full">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                  <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
                </svg>
                {job.employment_type}
              </span>
            )}
            {job.location && (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2.5 py-1 rounded-full">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                {job.location}
              </span>
            )}
          </div>
        </div>

        {/* Right: date, salary, actions */}
        <div className="shrink-0 flex flex-col items-end gap-3">
          <div className="text-right space-y-1">
            <div className="inline-flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              {formatDate(job.created_at)}
            </div>
            {isAuthenticated && salary && (
              <div className="flex items-center justify-end gap-1.5 text-xs font-medium text-gray-700 dark:text-gray-300">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="1" x2="12" y2="23" />
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
                {salary}
              </div>
            )}
            {!isAuthenticated && (job.salary_min || job.salary_max) && (
              <Link
                to="/login"
                className="text-xs text-teal-600 dark:text-teal-400 hover:underline"
              >
                Login to view salary
              </Link>
            )}
          </div>

          {canManage && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => navigate(`/jobs/${job.id}/edit`)}
                className="px-3 py-1 text-xs font-medium rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                Edit
              </button>
              <button
                onClick={handleDelete}
                className="px-3 py-1 text-xs font-medium rounded-lg border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                Delete
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
