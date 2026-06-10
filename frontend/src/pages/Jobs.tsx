import { useEffect, useState } from "react";
import { api } from "../api/api";
import JobCard from "../components/JobCard";
import type { Job } from "../components/JobCard";
import Navbar from "../components/Navbar";

const EMPLOYMENT_TYPES = ["Full-time", "Part-time", "Contract", "Remote"];

interface JobListResponse {
  jobs: Job[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export default function Jobs() {
  const [data, setData] = useState<JobListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [employmentType, setEmploymentType] = useState("");
  const [location, setLocation] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [locationInput, setLocationInput] = useState("");

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("page_size", "10");
    if (search) params.set("search", search);
    if (employmentType) params.set("employment_type", employmentType);
    if (location) params.set("location", location);

    api
      .get<JobListResponse>(`/jobs/?${params.toString()}`)
      .then((res) => setData(res.data))
      .finally(() => setLoading(false));
  }, [page, search, employmentType, location]);

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

  const totalPages = data?.total_pages ?? 1;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-200">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          Explore The Jobs
        </h1>

        {/* Filter bar */}
        <form onSubmit={handleSearch} className="mb-6 space-y-3">
          <div className="flex gap-3 flex-wrap">
            <input
              type="text"
              placeholder="Search by title or description..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="flex-1 min-w-48 px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <input
              type="text"
              placeholder="Location..."
              value={locationInput}
              onChange={(e) => setLocationInput(e.target.value)}
              className="w-40 px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium rounded-lg bg-teal-600 hover:bg-teal-700 text-white transition-colors"
            >
              Search
            </button>
            {(search || location || employmentType) && (
              <button
                type="button"
                onClick={handleClear}
                className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                Clear
              </button>
            )}
          </div>

          {/* Employment type pills */}
          <div className="flex flex-wrap gap-2">
            {EMPLOYMENT_TYPES.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => handleTypeChange(type)}
                className={`px-3 py-1 text-xs font-medium rounded-full border transition-colors ${
                  employmentType === type
                    ? "bg-teal-600 border-teal-600 text-white"
                    : "border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-teal-500 hover:text-teal-600 dark:hover:text-teal-400"
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </form>

        {/* Results count */}
        {data && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            {data.total} {data.total === 1 ? "job" : "jobs"} found
          </p>
        )}

        {/* Job list */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-28 rounded-xl bg-gray-200 dark:bg-gray-800 animate-pulse"
              />
            ))}
          </div>
        ) : data && data.jobs.length > 0 ? (
          <div className="space-y-4">
            {data.jobs.map((job) => (
              <JobCard key={job.id} job={job} />
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
