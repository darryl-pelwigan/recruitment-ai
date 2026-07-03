import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/api";
import Navbar from "../components/Navbar";

const API_BASE = "http://127.0.0.1:8000";

interface ApplicationItem {
  id: number;
  job_id: number;
  status: string;
  resume_url: string | null;
  cover_letter: string | null;
  created_at: string;
  job: { id: number; title: string; company_name: string | null };
}

const STATUS_LABELS: Record<string, string> = {
  applied: "Applied",
  under_review: "Under Review",
  shortlisted: "Shortlisted",
  interview_scheduled: "Interview Scheduled",
  rejected: "Rejected",
  hired: "Hired",
};

const STATUS_COLORS: Record<string, string> = {
  applied: "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-100 dark:border-blue-800",
  under_review: "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-100 dark:border-amber-800",
  shortlisted: "bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400 border-teal-100 dark:border-teal-800",
  interview_scheduled: "bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border-purple-100 dark:border-purple-800",
  rejected: "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-100 dark:border-red-800",
  hired: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function MyApplications() {
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCover, setExpandedCover] = useState<number | null>(null);

  useEffect(() => {
    api
      .get("/applications/me")
      .then((res) => setApplications(res.data.applications))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-200">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Applications</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Track the status of your job applications
          </p>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 dark:bg-gray-800 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : applications.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              You haven't applied to any jobs yet.
            </p>
            <Link
              to="/jobs"
              className="mt-4 inline-flex items-center gap-1.5 text-sm text-teal-600 dark:text-teal-400 hover:underline"
            >
              Browse open positions →
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map((app) => (
              <div
                key={app.id}
                className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <Link
                      to={`/jobs/${app.job.id}`}
                      className="text-base font-semibold text-teal-600 dark:text-teal-400 hover:underline"
                    >
                      {app.job.title}
                    </Link>
                    {app.job.company_name && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                        {app.job.company_name}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      Applied {formatDate(app.created_at)}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 sm:shrink-0">
                    {app.resume_url && (
                      <a
                        href={`${API_BASE}${app.resume_url}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                        </svg>
                        Resume
                      </a>
                    )}
                    <span
                      className={`px-2.5 py-0.5 text-xs font-medium rounded-full border ${STATUS_COLORS[app.status] ?? "bg-gray-100 text-gray-600 border-gray-200"}`}
                    >
                      {STATUS_LABELS[app.status] ?? app.status}
                    </span>
                  </div>
                </div>

                {app.cover_letter && (
                  <div className="mt-3 border-t border-gray-100 dark:border-gray-800 pt-3">
                    <p
                      className={`text-sm text-gray-500 dark:text-gray-400 ${expandedCover === app.id ? "" : "line-clamp-2"}`}
                    >
                      {app.cover_letter}
                    </p>
                    {app.cover_letter.length > 160 && (
                      <button
                        onClick={() => setExpandedCover(expandedCover === app.id ? null : app.id)}
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
