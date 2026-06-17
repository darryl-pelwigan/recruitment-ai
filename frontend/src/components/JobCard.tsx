import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api/api";
import { useAuthStore } from "../store/authStore";
import { formatSalary } from "../lib/schemas";
import ConfirmModal from "./ConfirmModal";

export interface Job {
  id: number;
  title: string;
  description: string | null;
  employment_type: string | null;
  location: string | null;
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string;
  company_name: string | null;
  company_logo_url: string | null;
  contact_email: string | null;
  status: string;
  posted_by_id: number | null;
  created_at: string;
  applicant_count: number;
}

const API_BASE = "http://127.0.0.1:8000";

function stripHtml(html: string): string {
  const div = document.createElement("div");
  div.innerHTML = html;
  return div.textContent ?? div.innerText ?? "";
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
  saved?: boolean;
  onSavedChange?: (jobId: number, saved: boolean) => void;
  applied?: boolean;
}

export default function JobCard({ job, canManage = false, onDeleted, saved = false, onSavedChange, applied = false }: Props) {
  const { isAuthenticated, user } = useAuthStore();
  const salary = formatSalary(job.salary_min, job.salary_max, job.salary_currency);
  const navigate = useNavigate();
  const plainDescription = job.description ? stripHtml(job.description) : null;
  const [bookmarking, setBookmarking] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const canEdit =
    canManage &&
    (user?.role === "admin" || job.posted_by_id === user?.id);
  const canDelete =
    canManage &&
    (user?.role === "admin" || job.posted_by_id === user?.id);

  const showBookmark = isAuthenticated && !canManage;

  async function handleDelete() {
    setDeleting(true);
    try {
      await api.delete(`/jobs/${job.id}`);
      setConfirmOpen(false);
      onDeleted?.(job.id);
    } catch {
      // ignore — modal stays open so user can retry
    } finally {
      setDeleting(false);
    }
  }

  async function toggleBookmark(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (bookmarking) return;
    setBookmarking(true);
    try {
      if (saved) {
        await api.delete(`/saved-jobs/${job.id}`);
        onSavedChange?.(job.id, false);
      } else {
        await api.post(`/saved-jobs/${job.id}`);
        onSavedChange?.(job.id, true);
      }
    } catch {
      // ignore
    } finally {
      setBookmarking(false);
    }
  }

  const logoSrc = isAuthenticated && job.company_logo_url ? `${API_BASE}${job.company_logo_url}` : null;

  return (
    <div className="group bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 hover:border-teal-300 dark:hover:border-teal-700 hover:shadow-lg dark:hover:shadow-gray-900/60 transition-all duration-200">
      <div className="flex items-start gap-4">

        {/* Left: company logo or default icon — auth only */}
        {isAuthenticated && (
          <div className="hidden sm:flex shrink-0 w-12 h-12 rounded-xl overflow-hidden bg-teal-50 dark:bg-teal-900/30 items-center justify-center mt-0.5">
            {logoSrc ? (
              <img src={logoSrc} alt={job.company_name ?? "Company"} className="w-full h-full object-cover" />
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-teal-600 dark:text-teal-400">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
              </svg>
            )}
          </div>
        )}

        {/* Middle: content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            {isAuthenticated && job.company_name && (
              <p className="text-xs font-medium text-gray-400 dark:text-gray-500">{job.company_name}</p>
            )}
            {canManage && (
              <Link
                to={`/jobs/${job.id}/applicants`}
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 border border-teal-100 dark:border-teal-800 hover:bg-teal-100 dark:hover:bg-teal-900/50 transition-colors"
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
                {job.applicant_count} {job.applicant_count === 1 ? "applicant" : "applicants"}
              </Link>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <Link
              to={`/jobs/${job.id}`}
              className="text-base font-semibold text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 hover:underline transition-colors"
            >
              {job.title}
            </Link>
            {applied && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-800">
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Applied
              </span>
            )}
          </div>

          {plainDescription && (
            <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
              {plainDescription}
            </p>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-2">
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
            {isAuthenticated && salary && (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/30 border border-teal-100 dark:border-teal-800 px-2.5 py-1 rounded-full">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="1" x2="12" y2="23" />
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
                {salary}
              </span>
            )}
            {!isAuthenticated && (job.salary_min || job.salary_max) && (
              <Link
                to="/login"
                className="inline-flex items-center gap-1 text-xs text-teal-600 dark:text-teal-400 hover:underline"
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                Login to view salary
              </Link>
            )}
          </div>
        </div>

        {/* Right: date + actions */}
        <div className="shrink-0 flex flex-col items-end gap-3">
          <div className="inline-flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            {formatDate(job.created_at)}
          </div>

          <div className="flex items-center gap-1.5">
            {showBookmark && (
              <button
                onClick={toggleBookmark}
                disabled={bookmarking}
                title={saved ? "Remove bookmark" : "Save job"}
                className={`p-1.5 rounded-lg border transition-colors disabled:opacity-50 ${
                  saved
                    ? "border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400"
                    : "border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-amber-500"
                }`}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill={saved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                </svg>
              </button>
            )}
            {(canEdit || canDelete) && (
              <>
                {canEdit && (
                  <button
                    onClick={() => navigate(`/jobs/${job.id}/edit`)}
                    className="px-3 py-1 text-xs font-medium rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    Edit
                  </button>
                )}
                {canDelete && (
                  <button
                    onClick={() => setConfirmOpen(true)}
                    className="px-3 py-1 text-xs font-medium rounded-lg border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    Delete
                  </button>
                )}
              </>
            )}
          </div>
        </div>

      </div>
      <ConfirmModal
        open={confirmOpen}
        title="Delete Job Listing"
        message={`Are you sure you want to delete "${job.title}"? This cannot be undone.`}
        confirmLabel="Delete"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
