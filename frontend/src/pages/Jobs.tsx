import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/api";
import JobCard from "../components/JobCard";
import type { Job } from "../components/JobCard";
import Navbar from "../components/Navbar";
import { useAuthStore } from "../store/authStore";

const EMPLOYMENT_TYPES = ["Full-time", "Part-time", "Contract", "Remote"];

interface JobListResponse {
  jobs: Job[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

const MANAGE_ROLES = ["admin", "hr", "recruiter"];

export default function Jobs() {
  const { user, isAuthenticated } = useAuthStore();
  const canManage = user ? MANAGE_ROLES.includes(user.role) : false;
  const [data, setData] = useState<JobListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [employmentType, setEmploymentType] = useState("");
  const [location, setLocation] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [locationInput, setLocationInput] = useState("");
  const [myListings, setMyListings] = useState(canManage);
  const [savedJobIds, setSavedJobIds] = useState<Set<number>>(new Set());
  const [appliedJobIds, setAppliedJobIds] = useState<Set<number>>(new Set());

  // Load saved jobs + applied job IDs for non-manager authenticated users
  useEffect(() => {
    if (isAuthenticated && !canManage) {
      Promise.all([
        api.get("/saved-jobs/"),
        user?.role === "applicant" ? api.get("/applications/me") : Promise.resolve({ data: { applications: [] } }),
      ]).then(([savedRes, appsRes]) => {
        setSavedJobIds(new Set(savedRes.data.map((s: { job: { id: number } }) => s.job.id)));
        setAppliedJobIds(new Set(appsRes.data.applications.map((a: { job_id: number }) => a.job_id)));
      }).catch(() => {});
    }
  }, [isAuthenticated, canManage, user?.role]);

  function handleSavedChange(jobId: number, saved: boolean) {
    setSavedJobIds((prev) => {
      const next = new Set(prev);
      if (saved) next.add(jobId); else next.delete(jobId);
      return next;
    });
  }

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("page_size", "10");
    if (search) params.set("search", search);
    if (employmentType) params.set("employment_type", employmentType);
    if (location) params.set("location", location);
    if (canManage && myListings && user?.id) params.set("posted_by_id", String(user.id));

    api
      .get<JobListResponse>(`/jobs/?${params.toString()}`)
      .then((res) => setData(res.data))
      .finally(() => setLoading(false));
  }, [page, search, employmentType, location, myListings, canManage, user?.id]);

  function handleSearch(e: { preventDefault(): void }) {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput);
    setLocation(locationInput);
  }

  function handleTypeChange(type: string) {
    setPage(1);
    setEmploymentType((prev) => (prev === type ? "" : type));
  }

  function handleClear() {
    setSearchInput("");
    setLocationInput("");
    setSearch("");
    setLocation("");
    setEmploymentType("");
    setPage(1);
  }

  function handleListingsToggle(mine: boolean) {
    setMyListings(mine);
    setPage(1);
  }

  function handleJobDeleted(id: number) {
    setData((prev) =>
      prev
        ? { ...prev, jobs: prev.jobs.filter((j) => j.id !== id), total: prev.total - 1 }
        : prev
    );
  }

  const totalPages = data?.total_pages ?? 1;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-200">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Page header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {canManage && myListings ? "My Job Listings" : "Explore The Jobs"}
            </h1>
            {data && (
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {data.total} {data.total === 1 ? "position" : "positions"} {canManage && myListings ? "posted" : "available"}
              </p>
            )}
          </div>
          {canManage && (
            <Link
              to="/jobs/new"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-xl bg-teal-600 hover:bg-teal-700 text-white shadow-sm transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Post Job
            </Link>
          )}
        </div>

        {/* Filter card */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 mb-6 shadow-sm">
          <form onSubmit={handleSearch}>
            {/* Row 1: search inputs */}
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  type="text"
                  placeholder="Search by title or description..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-colors"
                />
              </div>
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
                </svg>
                <input
                  type="text"
                  placeholder="Location..."
                  value={locationInput}
                  onChange={(e) => setLocationInput(e.target.value)}
                  className="pl-9 pr-3 py-2 w-40 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-colors"
                />
              </div>
              <button
                type="submit"
                className="px-5 py-2 text-sm font-medium rounded-xl bg-teal-600 hover:bg-teal-700 text-white transition-colors shrink-0"
              >
                Search
              </button>
            </div>

            {/* Row 2: all filter pills + clear — single unified row */}
            <div className="flex items-center gap-1.5 flex-wrap mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
              {/* My Listings / All Jobs toggle — managers only, styled as a tab group */}
              {canManage && (
                <>
                  <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden mr-1">
                    <button
                      type="button"
                      onClick={() => handleListingsToggle(true)}
                      className={`px-3 py-1 text-xs font-medium transition-colors ${
                        myListings
                          ? "bg-teal-600 text-white"
                          : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                      }`}
                    >
                      Mine
                    </button>
                    <button
                      type="button"
                      onClick={() => handleListingsToggle(false)}
                      className={`px-3 py-1 text-xs font-medium border-l border-gray-200 dark:border-gray-700 transition-colors ${
                        !myListings
                          ? "bg-teal-600 text-white"
                          : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                      }`}
                    >
                      All
                    </button>
                  </div>
                  <div className="w-px h-4 bg-gray-200 dark:bg-gray-700 mx-0.5" />
                </>
              )}

              {/* Employment type pills */}
              {EMPLOYMENT_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => handleTypeChange(type)}
                  className={`px-3 py-1 text-xs font-medium rounded-full border transition-colors ${
                    employmentType === type
                      ? "bg-teal-600 border-teal-600 text-white"
                      : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-teal-400 hover:text-teal-600 dark:hover:text-teal-400"
                  }`}
                >
                  {type}
                </button>
              ))}

              {/* Clear — only when a filter is active */}
              {(search || location || employmentType) && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="ml-auto flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                  Clear
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Job list */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-32 rounded-2xl bg-gray-200 dark:bg-gray-800 animate-pulse"
              />
            ))}
          </div>
        ) : data && data.jobs.length > 0 ? (
          <div className="space-y-3">
            {data.jobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                canManage={canManage}
                onDeleted={handleJobDeleted}
                saved={savedJobIds.has(job.id)}
                onSavedChange={handleSavedChange}
                applied={appliedJobIds.has(job.id)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-gray-400 dark:text-gray-600">
            <p className="text-lg font-medium">No jobs found</p>
            <p className="text-sm mt-1">Try adjusting your filters</p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 text-sm rounded-md border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400 disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-9 h-9 text-sm rounded-md border transition-colors ${
                  p === page
                    ? "bg-teal-600 border-teal-600 text-white"
                    : "border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 text-sm rounded-md border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400 disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
