import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/api";
import JobCard from "../components/JobCard";
import type { Job } from "../components/JobCard";
import Navbar from "../components/Navbar";
import FilterDropdown from "../components/FilterDropdown";
import { useAuthStore } from "../store/authStore";

const EMPLOYMENT_TYPE_OPTIONS = [
  { label: "Full-time", value: "Full-time" },
  { label: "Part-time", value: "Part-time" },
  { label: "Contract", value: "Contract" },
  { label: "Intern", value: "Intern" },
];

const LOCATION_OPTIONS = [
  { label: "Remote", value: "Remote" },
  { label: "Hybrid", value: "Hybrid" },
];

const STATUS_OPTIONS = [
  { label: "Open", value: "open" },
  { label: "Closed", value: "closed" },
];

const APPLICANT_STAGE_OPTIONS = [
  { label: "Applied", value: "applied" },
  { label: "Under Review", value: "under_review" },
  { label: "Shortlisted", value: "shortlisted" },
  { label: "Interview Scheduled", value: "interview_scheduled" },
  { label: "Rejected", value: "rejected" },
  { label: "Hired", value: "hired" },
];

const POSTED_OPTIONS = [
  { label: "1 day ago", value: "1" },
  { label: "3 days ago", value: "3" },
  { label: "1 week ago", value: "7" },
  { label: "2 weeks ago", value: "14" },
  { label: "1 month ago", value: "30" },
];

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

  // Search
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  // Filters (all default to empty = "All")
  const [employmentTypes, setEmploymentTypes] = useState<string[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  const [statuses, setStatuses] = useState<string[]>([]);
  const [postedWithin, setPostedWithin] = useState<string[]>([]);
  const [applicantStages, setApplicantStages] = useState<string[]>([]);

  // Manager-only: Mine vs All listings
  const [myListings, setMyListings] = useState(canManage);

  // Bookmarked / applied job IDs for non-manager authenticated users
  const [savedJobIds, setSavedJobIds] = useState<Set<number>>(new Set());
  const [appliedJobIds, setAppliedJobIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (isAuthenticated && !canManage) {
      Promise.all([
        api.get("/saved-jobs/"),
        user?.role === "applicant"
          ? api.get("/applications/me")
          : Promise.resolve({ data: { applications: [] } }),
      ])
        .then(([savedRes, appsRes]) => {
          setSavedJobIds(new Set(savedRes.data.map((s: { job: { id: number } }) => s.job.id)));
          setAppliedJobIds(new Set(appsRes.data.applications.map((a: { job_id: number }) => a.job_id)));
        })
        .catch(() => {});
    }
  }, [isAuthenticated, canManage, user?.role]);

  function handleSavedChange(jobId: number, saved: boolean) {
    setSavedJobIds(prev => {
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
    employmentTypes.forEach(t => params.append("employment_type", t));
    locations.forEach(l => params.append("location", l));
    if (canManage) {
      statuses.forEach(s => params.append("status", s));
    } else {
      // Non-managers only ever see open jobs
      params.append("status", "open");
    }
    if (canManage && myListings && user?.id) params.set("posted_by_id", String(user.id));
    if (postedWithin.length === 1) params.set("posted_within_days", postedWithin[0]);
    if (canManage) applicantStages.forEach(s => params.append("applicant_status", s));

    api
      .get<JobListResponse>(`/jobs/?${params.toString()}`)
      .then(res => setData(res.data))
      .finally(() => setLoading(false));
  }, [page, search, employmentTypes, locations, statuses, postedWithin, applicantStages, myListings, canManage, user?.id]);

  function handleSearch(e: { preventDefault(): void }) {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput);
  }

  function handleFilterChange<T extends string[]>(setter: (v: T) => void, values: T) {
    setter(values);
    setPage(1);
  }

  function handleClear() {
    setSearchInput("");
    setSearch("");
    setEmploymentTypes([]);
    setLocations([]);
    setStatuses([]);
    setPostedWithin([]);
    setApplicantStages([]);
    setPage(1);
  }

  function handleJobDeleted(id: number) {
    setData(prev =>
      prev ? { ...prev, jobs: prev.jobs.filter(j => j.id !== id), total: prev.total - 1 } : prev
    );
  }

  function handleJobStatusChanged(id: number, newStatus: string) {
    setData(prev => {
      if (!prev) return prev;
      if (statuses.length > 0 && !statuses.includes(newStatus)) {
        return { ...prev, jobs: prev.jobs.filter(j => j.id !== id), total: prev.total - 1 };
      }
      return { ...prev, jobs: prev.jobs.map(j => j.id === id ? { ...j, status: newStatus } : j) };
    });
  }

  const hasActiveFilter =
    !!search ||
    employmentTypes.length > 0 ||
    locations.length > 0 ||
    statuses.length > 0 ||
    postedWithin.length > 0 ||
    applicantStages.length > 0;

  const totalPages = data?.total_pages ?? 1;

  const pageTitle = canManage
    ? myListings ? "My Job Listings" : "All Job Listings"
    : "Explore Jobs";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-200">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Page header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{pageTitle}</h1>
            {data && (
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {data.total} {data.total === 1 ? "position" : "positions"} found
              </p>
            )}
          </div>
          {canManage && (
            <Link
              to="/jobs/new"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-xl bg-teal-600 hover:bg-teal-700 text-white shadow-sm transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Post Job
            </Link>
          )}
        </div>

        {/* Filter card */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 mb-6 shadow-sm">
          {/* Search bar */}
          <form onSubmit={handleSearch}>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  type="text"
                  placeholder="Search by title or description…"
                  value={searchInput}
                  onChange={e => setSearchInput(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-colors"
                />
              </div>
              <button
                type="submit"
                className="px-5 py-2 text-sm font-medium rounded-xl bg-teal-600 hover:bg-teal-700 text-white transition-colors shrink-0"
              >
                Search
              </button>
            </div>
          </form>

          {/* Filter dropdowns */}
          <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">

            {/* Mine / All toggle — managers only */}
            {canManage && (
              <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                <button
                  type="button"
                  onClick={() => { setMyListings(true); setPage(1); }}
                  className={`px-3 py-2 text-xs font-medium transition-colors ${
                    myListings ? "bg-teal-600 text-white" : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                >
                  Mine
                </button>
                <button
                  type="button"
                  onClick={() => { setMyListings(false); setPage(1); }}
                  className={`px-3 py-2 text-xs font-medium border-l border-gray-200 dark:border-gray-700 transition-colors ${
                    !myListings ? "bg-teal-600 text-white" : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                >
                  All
                </button>
              </div>
            )}

            {/* Employment Type */}
            <FilterDropdown
              label="Job Type"
              options={EMPLOYMENT_TYPE_OPTIONS}
              selected={employmentTypes}
              onChange={v => handleFilterChange(setEmploymentTypes, v)}
            />

            {/* Location */}
            <FilterDropdown
              label="Location"
              options={LOCATION_OPTIONS}
              selected={locations}
              onChange={v => handleFilterChange(setLocations, v)}
              allowCustomInput
              customInputPlaceholder="e.g. New York, Manila…"
            />

            {/* Status — managers only */}
            {canManage && (
              <FilterDropdown
                label="Status"
                options={STATUS_OPTIONS}
                selected={statuses}
                onChange={v => handleFilterChange(setStatuses, v)}
              />
            )}

            {/* Posted Date — single select */}
            <FilterDropdown
              label="Posted"
              options={POSTED_OPTIONS}
              selected={postedWithin}
              onChange={v => handleFilterChange(setPostedWithin, v)}
              multiSelect={false}
            />

            {/* Applicant Stage — managers only */}
            {canManage && (
              <FilterDropdown
                label="Applicant Stage"
                options={APPLICANT_STAGE_OPTIONS}
                selected={applicantStages}
                onChange={v => handleFilterChange(setApplicantStages, v)}
              />
            )}

            {/* Clear */}
            {hasActiveFilter && (
              <button
                type="button"
                onClick={handleClear}
                className="ml-auto flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
                Clear all
              </button>
            )}
          </div>
        </div>

        {/* Job list */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 rounded-2xl bg-gray-200 dark:bg-gray-800 animate-pulse" />
            ))}
          </div>
        ) : data && data.jobs.length > 0 ? (
          <div className="space-y-3">
            {data.jobs.map(job => (
              <JobCard
                key={job.id}
                job={job}
                canManage={canManage}
                onDeleted={handleJobDeleted}
                onStatusChanged={handleJobStatusChanged}
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
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 text-sm rounded-md border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400 disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
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
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
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
