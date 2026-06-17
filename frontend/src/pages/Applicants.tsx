import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../api/api";
import { useAuthStore } from "../store/authStore";
import Navbar from "../components/Navbar";

const API_BASE = "http://127.0.0.1:8000";

interface ApplicationItem {
  id: number;
  status: string;
  resume_url: string | null;
  cover_letter: string | null;
  created_at: string;
  user: { id: number; full_name: string; email: string; avatar_url: string | null; last_login: string | null };
  job: { id: number; title: string; company_name: string | null };
}

function scoreColor(score: number) {
  if (score >= 90) return "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
  if (score >= 70) return "bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400";
  if (score >= 40) return "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
  return "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400";
}

const VALID_STATUSES = [
  { value: "applied", label: "Applied" },
  { value: "under_review", label: "Under Review" },
  { value: "shortlisted", label: "Shortlisted" },
  { value: "interview_scheduled", label: "Interview Scheduled" },
  { value: "rejected", label: "Rejected" },
  { value: "hired", label: "Hired" },
];

const STATUS_COLORS: Record<string, string> = {
  applied: "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  under_review: "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  shortlisted: "bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400",
  interview_scheduled: "bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  rejected: "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  hired: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

function timeAgo(iso: string | null): string {
  if (!iso) return "Never logged in";
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months === 1 ? "" : "s"} ago`;
  const years = Math.floor(months / 12);
  return `${years} year${years === 1 ? "" : "s"} ago`;
}

export default function Applicants() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [jobTitle, setJobTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [expandedCover, setExpandedCover] = useState<number | null>(null);
  const [rescoring, setRescoring] = useState(false);

  const canManage = user && ["admin", "hr", "recruiter"].includes(user.role);

  useEffect(() => {
    if (!canManage) {
      navigate("/jobs");
      return;
    }
    Promise.all([api.get(`/applications/job/${id}`), api.get(`/jobs/${id}`)]).then(
      ([appsRes, jobRes]) => {
        setApplications(appsRes.data.applications);
        setJobTitle(jobRes.data.title);
      }
    ).finally(() => setLoading(false));
  }, [id, canManage, navigate]);

  async function handleRescoreAll() {
    if (rescoring || applications.length === 0) return;
    setRescoring(true);
    try {
      const results = await Promise.all(
        applications.map((app) => api.post(`/applications/${app.id}/score`).then((r) => r.data))
      );
      setApplications(results);
    } catch { /* silently ignore */ } finally {
      setRescoring(false);
    }
  }

  async function handleStatusChange(appId: number, newStatus: string) {
    setUpdatingId(appId);
    try {
      const res = await api.patch(`/applications/${appId}/status`, { status: newStatus });
      setApplications((prev) =>
        prev.map((a) => (a.id === appId ? { ...a, status: res.data.status } : a))
      );
    } catch {
      // status change failed silently — dropdown will revert on next render
    } finally {
      setUpdatingId(null);
    }
  }

  const filtered =
    filterStatus === "all" ? applications : applications.filter((a) => a.status === filterStatus);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-200">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors mb-6"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back to Job
        </button>

        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Applicants</h1>
            {jobTitle && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{jobTitle}</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRescoreAll}
              disabled={rescoring || applications.length === 0}
              title="Re-run AI scoring for all applicants"
              className="px-3 py-1.5 text-xs font-medium rounded-lg border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors disabled:opacity-50 inline-flex items-center gap-1.5"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={rescoring ? "animate-spin" : ""}>
                <path d="M23 4v6h-6" /><path d="M1 20v-6h6" />
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
              </svg>
              {rescoring ? "Scoring..." : "Re-score All"}
            </button>
            <Link
              to={`/jobs/${id}/pipeline`}
              className="px-3 py-1.5 text-xs font-medium rounded-lg border border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-colors inline-flex items-center gap-1.5"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
              </svg>
              Pipeline
            </Link>
            <label className="text-xs text-gray-500 dark:text-gray-400">Filter:</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="all">All ({applications.length})</option>
              {VALID_STATUSES.map((s) => {
                const count = applications.filter((a) => a.status === s.value).length;
                return count > 0 ? (
                  <option key={s.value} value={s.value}>
                    {s.label} ({count})
                  </option>
                ) : null;
              })}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 dark:bg-gray-800 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-sm text-gray-500 dark:text-gray-400">No applicants found.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((app) => (
              <div
                key={app.id}
                className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5"
              >
                <div className="flex flex-wrap items-start gap-4">
                  {/* Avatar */}
                  <Link to={`/applicants/${app.user.id}`} className="w-10 h-10 rounded-full overflow-hidden bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center shrink-0 hover:ring-2 hover:ring-teal-400 transition-all">
                    {app.user.avatar_url ? (
                      <img
                        src={`${API_BASE}${app.user.avatar_url}`}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-xs font-bold text-teal-700 dark:text-teal-300">
                        {initials(app.user.full_name)}
                      </span>
                    )}
                  </Link>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link to={`/applicants/${app.user.id}`} className="text-sm font-semibold text-gray-900 dark:text-white hover:text-teal-600 dark:hover:text-teal-400 transition-colors">
                        {app.user.full_name}
                      </Link>
                      <span
                        className={`px-2 py-0.5 text-xs font-medium rounded-full ${STATUS_COLORS[app.status] ?? "bg-gray-100 text-gray-600"}`}
                      >
                        {VALID_STATUSES.find((s) => s.value === app.status)?.label ?? app.status}
                      </span>
                      <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${scoreColor(app.ai_score)}`}>
                        AI {app.ai_score}%
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {app.user.email}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                      Applied {formatDate(app.created_at)}
                    </p>
                    <p className="text-xs mt-0.5 flex items-center gap-1">
                      <span className={`inline-block w-1.5 h-1.5 rounded-full ${app.user.last_login && Date.now() - new Date(app.user.last_login).getTime() < 7 * 24 * 60 * 60 * 1000 ? "bg-emerald-400" : "bg-gray-300 dark:bg-gray-600"}`} />
                      <span className="text-gray-400 dark:text-gray-500">Last seen {timeAgo(app.user.last_login)}</span>
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {app.resume_url && (
                      <a
                        href={`${API_BASE}${app.resume_url}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors inline-flex items-center gap-1.5"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                        </svg>
                        Resume
                      </a>
                    )}
                    <select
                      value={app.status}
                      disabled={updatingId === app.id}
                      onChange={(e) => handleStatusChange(app.id, e.target.value)}
                      className="text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 px-2.5 py-1.5 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                      {VALID_STATUSES.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Cover letter */}
                {app.cover_letter && (
                  <div className="mt-3 border-t border-gray-100 dark:border-gray-800 pt-3">
                    <p
                      className={`text-sm text-gray-500 dark:text-gray-400 ${expandedCover === app.id ? "" : "line-clamp-2"}`}
                    >
                      {app.cover_letter}
                    </p>
                    {app.cover_letter.length > 160 && (
                      <button
                        onClick={() =>
                          setExpandedCover(expandedCover === app.id ? null : app.id)
                        }
                        className="mt-1 text-xs text-teal-600 dark:text-teal-400 hover:underline"
                      >
                        {expandedCover === app.id ? "Show less" : "Read more"}
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
