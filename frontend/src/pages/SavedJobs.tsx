import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api/api";
import Navbar from "../components/Navbar";
import { useAuthStore } from "../store/authStore";
import { formatSalary } from "../lib/schemas";

interface SavedJobInfo {
  id: number;
  title: string;
  company_name: string | null;
  location: string | null;
  employment_type: string | null;
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string;
  status: string;
}

interface SavedJobEntry {
  id: number;
  job: SavedJobInfo;
  created_at: string;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function SavedJobs() {
  const { user, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const [entries, setEntries] = useState<SavedJobEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<number | null>(null);

  const canManage = user && ["admin", "hr", "recruiter"].includes(user.role);

  useEffect(() => {
    if (!isAuthenticated || canManage) { navigate("/jobs"); return; }
    api.get("/saved-jobs/")
      .then((res) => setEntries(res.data))
      .finally(() => setLoading(false));
  }, [isAuthenticated, canManage, navigate]);

  async function handleRemove(jobId: number) {
    setRemovingId(jobId);
    try {
      await api.delete(`/saved-jobs/${jobId}`);
      setEntries((prev) => prev.filter((e) => e.job.id !== jobId));
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-200">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
          <h1 className="mt-3 text-2xl font-bold text-gray-900 dark:text-white">Saved Jobs</h1>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">Jobs you've bookmarked to apply to later.</p>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-28 bg-gray-200 dark:bg-gray-800 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-3">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">No saved jobs yet</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Bookmark jobs from the listings page to save them here.</p>
            <Link to="/jobs" className="mt-4 inline-block text-sm text-teal-600 dark:text-teal-400 hover:underline">Browse Jobs</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {entries.map(({ job, created_at }) => {
              const salary = formatSalary(job.salary_min, job.salary_max, job.salary_currency);
              return (
                <div key={job.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <Link to={`/jobs/${job.id}`} className="text-base font-semibold text-teal-600 dark:text-teal-400 hover:underline">
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
                      {job.company_name && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{job.company_name}</p>
                      )}
                      <div className="flex flex-wrap gap-2">
                        {job.employment_type && (
                          <span className="px-2.5 py-0.5 text-xs rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">{job.employment_type}</span>
                        )}
                        {job.location && (
                          <span className="px-2.5 py-0.5 text-xs rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">{job.location}</span>
                        )}
                        {salary && (
                          <span className="px-2.5 py-0.5 text-xs rounded-full bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 border border-teal-100 dark:border-teal-800 font-medium">{salary}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <p className="text-xs text-gray-400 dark:text-gray-500">Saved {formatDate(created_at)}</p>
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/jobs/${job.id}`}
                          className="px-3 py-1.5 text-xs font-medium rounded-lg border border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-colors"
                        >
                          View Job
                        </Link>
                        <button
                          onClick={() => handleRemove(job.id)}
                          disabled={removingId === job.id}
                          className="px-3 py-1.5 text-xs font-medium rounded-lg border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
