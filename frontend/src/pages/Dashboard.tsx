import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/api";
import Navbar from "../components/Navbar";
import { useAuthStore } from "../store/authStore";

interface Analytics {
  active_jobs: number;
  total_applicants: number;
  conversion_rate: { applied: number; hired: number; rate: number };
  applicants_per_job: { job_id: number; job_title: string; count: number }[];
  top_skills: { skill: string; count: number }[];
}

interface AppSummary {
  total: number;
  by_status: Record<string, number>;
}

const STATUS_LABELS: Record<string, string> = {
  applied: "Applied",
  under_review: "Under Review",
  shortlisted: "Shortlisted",
  interview_scheduled: "Interview",
  rejected: "Rejected",
  hired: "Hired",
};

const ALL_STATUSES = ["applied", "under_review", "shortlisted", "interview_scheduled", "rejected", "hired"];

function StatCard({
  label,
  value,
  colorClass,
}: {
  label: string;
  value: string | number;
  colorClass: string;
}) {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-5">
      <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">{label}</p>
      <p className={`mt-1 text-3xl font-bold ${colorClass}`}>{value}</p>
    </div>
  );
}

function ManagerDashboard({ analytics }: { analytics: Analytics | null }) {
  const maxJob = analytics ? Math.max(...analytics.applicants_per_job.map((j) => j.count), 1) : 1;
  const maxSkill = analytics ? Math.max(...analytics.top_skills.map((s) => s.count), 1) : 1;

  return (
    <>
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Active Jobs"
          value={analytics ? analytics.active_jobs : "—"}
          colorClass="text-indigo-600 dark:text-indigo-400"
        />
        <StatCard
          label="Total Applicants"
          value={analytics ? analytics.total_applicants : "—"}
          colorClass="text-teal-600 dark:text-teal-400"
        />
        <StatCard
          label="Hired"
          value={analytics ? analytics.conversion_rate.hired : "—"}
          colorClass="text-green-600 dark:text-green-400"
        />
        <StatCard
          label="Conversion Rate"
          value={analytics ? `${analytics.conversion_rate.rate}%` : "—"}
          colorClass="text-purple-600 dark:text-purple-400"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Applicants per Job */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
            Applicants per Job
          </h2>
          {!analytics ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="flex justify-between mb-1">
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-36" />
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5" />
                  </div>
                  <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full">
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full" style={{ width: `${30 + i * 15}%` }} />
                  </div>
                </div>
              ))}
            </div>
          ) : analytics.applicants_per_job.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-gray-500">No applications yet.</p>
          ) : (
            <div className="space-y-3">
              {analytics.applicants_per_job.slice(0, 8).map((job) => (
                <div key={job.job_id}>
                  <div className="flex items-center justify-between mb-1">
                    <Link
                      to={`/jobs/${job.job_id}/applicants`}
                      className="text-xs text-gray-700 dark:text-gray-300 hover:text-teal-600 dark:hover:text-teal-400 truncate max-w-50 transition-colors"
                    >
                      {job.job_title}
                    </Link>
                    <span className="text-xs font-semibold text-gray-900 dark:text-white ml-2 shrink-0">
                      {job.count}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-teal-500 dark:bg-teal-400 rounded-full transition-all duration-500"
                      style={{ width: `${(job.count / maxJob) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Skills */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
            Top Skills in Applicant Pool
          </h2>
          {!analytics ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="flex justify-between mb-1">
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24" />
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5" />
                  </div>
                  <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full">
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full" style={{ width: `${50 - i * 10}%` }} />
                  </div>
                </div>
              ))}
            </div>
          ) : analytics.top_skills.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-gray-500">No skills data yet.</p>
          ) : (
            <div className="space-y-3">
              {analytics.top_skills.map((s) => (
                <div key={s.skill}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-700 dark:text-gray-300 truncate max-w-50">
                      {s.skill}
                    </span>
                    <span className="text-xs font-semibold text-gray-900 dark:text-white ml-2 shrink-0">
                      {s.count}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 dark:bg-indigo-400 rounded-full transition-all duration-500"
                      style={{ width: `${(s.count / maxSkill) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          to="/jobs/new"
          className="flex items-center gap-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-5 hover:shadow-md dark:hover:shadow-gray-800/50 transition-shadow"
        >
          <div className="p-2.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/30">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-600 dark:text-indigo-400">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">Post a Job</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Create a new listing</p>
          </div>
        </Link>
        <Link
          to="/applicants"
          className="flex items-center gap-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-5 hover:shadow-md dark:hover:shadow-gray-800/50 transition-shadow"
        >
          <div className="p-2.5 rounded-lg bg-teal-50 dark:bg-teal-900/30">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-teal-600 dark:text-teal-400">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">View All Applicants</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Browse the talent pool</p>
          </div>
        </Link>
      </div>
    </>
  );
}

function ApplicantDashboard({ appSummary }: { appSummary: AppSummary | null }) {
  return (
    <>
      {/* Application status breakdown */}
      {appSummary !== null && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              My Applications
            </h2>
            <Link
              to="/my-applications"
              className="text-xs text-teal-600 dark:text-teal-400 hover:underline font-medium"
            >
              View all →
            </Link>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-2">
            {ALL_STATUSES.map((status) => (
              <div
                key={status}
                className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-3 text-center"
              >
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {appSummary.by_status[status] ?? 0}
                </p>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 leading-tight">
                  {STATUS_LABELS[status]}
                </p>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            {appSummary.total} application{appSummary.total !== 1 ? "s" : ""} total
          </p>
        </div>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          to="/jobs"
          className="flex items-center gap-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-5 hover:shadow-md dark:hover:shadow-gray-800/50 transition-shadow"
        >
          <div className="p-2.5 rounded-lg bg-teal-50 dark:bg-teal-900/30">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-teal-600 dark:text-teal-400">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
              <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">Browse Jobs</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Explore open positions</p>
          </div>
        </Link>
        <Link
          to="/my-applications"
          className="flex items-center gap-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-5 hover:shadow-md dark:hover:shadow-gray-800/50 transition-shadow"
        >
          <div className="p-2.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/30">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-600 dark:text-indigo-400">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">My Applications</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Track your progress</p>
          </div>
        </Link>
        <Link
          to="/resumes"
          className="flex items-center gap-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-5 hover:shadow-md dark:hover:shadow-gray-800/50 transition-shadow"
        >
          <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-900/30">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-rose-600 dark:text-rose-400">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">My Resumes</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Upload, preview & download</p>
          </div>
        </Link>
        <Link
          to="/saved-jobs"
          className="flex items-center gap-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-5 hover:shadow-md dark:hover:shadow-gray-800/50 transition-shadow"
        >
          <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-900/30">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-600 dark:text-amber-400">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">Saved Jobs</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Jobs you've bookmarked</p>
          </div>
        </Link>
      </div>
    </>
  );
}

export default function Dashboard() {
  const { user } = useAuthStore();
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [appSummary, setAppSummary] = useState<AppSummary | null>(null);

  const canManage = user ? ["admin", "hr", "recruiter"].includes(user.role) : false;

  useEffect(() => {
    if (canManage) {
      api
        .get<Analytics>("/analytics/dashboard")
        .then((r) => setAnalytics(r.data))
        .catch(() => {});
    } else {
      api
        .get<{ applications: { status: string }[] }>("/applications/me")
        .then((r) => {
          const by_status: Record<string, number> = {};
          r.data.applications.forEach((a) => {
            by_status[a.status] = (by_status[a.status] ?? 0) + 1;
          });
          setAppSummary({ total: r.data.applications.length, by_status });
        })
        .catch(() => {});
    }
  }, [canManage]);

  const roleLabel: Record<string, string> = {
    hr: "HR Manager",
    admin: "Administrator",
    recruiter: "Recruiter",
    applicant: "Applicant",
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-200">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Welcome back, {user?.full_name ?? "there"}
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {roleLabel[user?.role ?? ""] ?? user?.role}
          </p>
        </div>

        {canManage ? (
          <ManagerDashboard analytics={analytics} />
        ) : (
          <ApplicantDashboard appSummary={appSummary} />
        )}
      </main>
    </div>
  );
}
