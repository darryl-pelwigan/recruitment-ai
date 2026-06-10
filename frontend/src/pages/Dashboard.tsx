import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/api";
import Navbar from "../components/Navbar";
import { useAuthStore } from "../store/authStore";

interface Stats {
  total: number;
  open: number;
}

export default function Dashboard() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    api
      .get("/jobs/?page=1&page_size=1&status=open")
      .then((res) => {
        setStats({ total: res.data.total, open: res.data.total });
      })
      .catch(() => {});
  }, []);

  const canManage = user && ["admin", "hr", "recruiter"].includes(user.role);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-200">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Welcome back, {user?.full_name ?? "there"}
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 capitalize">
            Signed in as <span className="font-medium">{user?.role}</span>
          </p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-5">
            <p className="text-sm text-gray-500 dark:text-gray-400">Open Jobs</p>
            <p className="mt-1 text-3xl font-bold text-gray-900 dark:text-white">
              {stats ? stats.open : "—"}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-5">
            <p className="text-sm text-gray-500 dark:text-gray-400">Your Role</p>
            <p className="mt-1 text-3xl font-bold text-gray-900 dark:text-white capitalize">
              {user?.role ?? "—"}
            </p>
          </div>
        </div>

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
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Explore all open positions
              </p>
            </div>
          </Link>

          {canManage && (
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
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Create a new job listing
                </p>
              </div>
            </Link>
          )}
        </div>
      </main>
    </div>
  );
}
