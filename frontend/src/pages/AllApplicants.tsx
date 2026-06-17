import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api/api";
import Navbar from "../components/Navbar";
import { useAuthStore } from "../store/authStore";

const API_BASE = "http://127.0.0.1:8000";

interface Applicant {
  id: number;
  full_name: string;
  email: string;
  avatar_url: string | null;
  headline: string | null;
  location: string | null;
  years_of_experience: number | null;
  skills: string | null;
  resume_url: string | null;
}

interface JobOption {
  id: number;
  title: string;
  company_name: string | null;
}

interface JobApplication {
  user_id: number;
  status: string;
  ai_score: number;
}

const STATUS_OPTIONS = [
  { value: "applied", label: "Applied" },
  { value: "under_review", label: "Under Review" },
  { value: "shortlisted", label: "Shortlisted" },
  { value: "interview_scheduled", label: "Interview Scheduled" },
  { value: "rejected", label: "Rejected" },
  { value: "hired", label: "Hired" },
];

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

function scoreColor(score: number): string {
  if (score >= 90) return "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800";
  if (score >= 70) return "bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400 border border-teal-200 dark:border-teal-800";
  if (score >= 40) return "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800";
  return "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800";
}

export default function AllApplicants() {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [savedIds, setSavedIds] = useState<Set<number>>(new Set());
  const [jobs, setJobs] = useState<JobOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookmarkingId, setBookmarkingId] = useState<number | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [selectedSkills, setSelectedSkills] = useState<Set<string>>(new Set());
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [bookmarkedOnly, setBookmarkedOnly] = useState(false);

  // Job-scoped application data (loaded when a job is selected)
  const [jobApplications, setJobApplications] = useState<JobApplication[] | null>(null);
  const [jobFilterLoading, setJobFilterLoading] = useState(false);

  const canManage = user && ["admin", "hr", "recruiter"].includes(user.role);

  useEffect(() => {
    if (!canManage) { navigate("/jobs"); return; }
    Promise.all([
      api.get<Applicant[]>("/users/"),
      api.get("/saved-applicants/"),
      api.get("/jobs?page_size=50"),
    ]).then(([usersRes, savedRes, jobsRes]) => {
      setApplicants(usersRes.data);
      setSavedIds(new Set(savedRes.data.map((e: { applicant: { id: number } }) => e.applicant.id)));
      setJobs(jobsRes.data.jobs ?? []);
    }).finally(() => setLoading(false));
  }, [canManage, navigate]);

  async function handleJobFilter(jobId: number | null) {
    setSelectedJobId(jobId);
    setSelectedStatus("");
    if (!jobId) { setJobApplications(null); return; }
    setJobFilterLoading(true);
    try {
      const res = await api.get(`/applications/job/${jobId}`);
      setJobApplications(
        res.data.applications.map((a: { user: { id: number }; status: string; ai_score: number }) => ({
          user_id: a.user.id,
          status: a.status,
          ai_score: a.ai_score,
        }))
      );
    } catch {
      setJobApplications(null);
    } finally {
      setJobFilterLoading(false);
    }
  }

  function toggleSkill(skill: string) {
    setSelectedSkills((prev) => {
      const next = new Set(prev);
      if (next.has(skill)) next.delete(skill); else next.add(skill);
      return next;
    });
  }

  function clearFilters() {
    setSearch("");
    setSelectedSkills(new Set());
    handleJobFilter(null);
    setSelectedStatus("");
    setBookmarkedOnly(false);
  }

  async function toggleBookmark(e: React.MouseEvent, applicantId: number) {
    e.preventDefault();
    e.stopPropagation();
    if (bookmarkingId === applicantId) return;
    setBookmarkingId(applicantId);
    try {
      if (savedIds.has(applicantId)) {
        await api.delete(`/saved-applicants/${applicantId}`);
        setSavedIds((prev) => { const next = new Set(prev); next.delete(applicantId); return next; });
      } else {
        await api.post(`/saved-applicants/${applicantId}`);
        setSavedIds((prev) => new Set(prev).add(applicantId));
      }
    } catch { /* ignore */ } finally {
      setBookmarkingId(null);
    }
  }

  // Extract all unique skills from applicant profiles
  const allSkills = useMemo(() => {
    const set = new Set<string>();
    applicants.forEach((a) => {
      (a.skills ?? "").split(",").map((s) => s.trim()).filter(Boolean).forEach((s) => set.add(s));
    });
    return Array.from(set).sort();
  }, [applicants]);

  // Apply all filters
  const filtered = useMemo(() => {
    return applicants.filter((a) => {
      // Search
      if (search.trim()) {
        const q = search.toLowerCase();
        const hit = [a.full_name, a.email, a.headline ?? ""].some((f) => f.toLowerCase().includes(q));
        if (!hit) return false;
      }
      // Skill pills (OR logic — any selected skill)
      if (selectedSkills.size > 0) {
        const aSkills = new Set((a.skills ?? "").split(",").map((s) => s.trim()).filter(Boolean));
        if (![...selectedSkills].some((s) => aSkills.has(s))) return false;
      }
      // Job scope
      if (jobApplications !== null) {
        const app = jobApplications.find((ja) => ja.user_id === a.id);
        if (!app) return false;
        // Status sub-filter (only relevant when a job is selected)
        if (selectedStatus && app.status !== selectedStatus) return false;
      }
      // Bookmarked only
      if (bookmarkedOnly && !savedIds.has(a.id)) return false;
      return true;
    });
  }, [applicants, search, selectedSkills, jobApplications, selectedStatus, bookmarkedOnly, savedIds]);

  const hasActiveFilter = search || selectedSkills.size > 0 || selectedJobId || bookmarkedOnly;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-200">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Applicants</h1>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">Browse and bookmark candidates for your job listings.</p>
        </div>

        {/* Filter panel */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 mb-6">
          {/* Main filter row: search (flex-1) + compact controls group */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            {/* Search */}
            <div className="relative flex-1 min-w-0">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, email, or headline..."
                className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-colors"
              />
            </div>

            {/* Compact controls group — stays on one line */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Job filter */}
              <div className="relative">
                <select
                  value={selectedJobId ?? ""}
                  onChange={(e) => handleJobFilter(e.target.value ? Number(e.target.value) : null)}
                  className="appearance-none pl-3 pr-7 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-colors w-36"
                >
                  <option value="">All Jobs</option>
                  {jobs.map((j) => (
                    <option key={j.id} value={j.id}>{j.title}</option>
                  ))}
                </select>
                <svg className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
                {jobFilterLoading && (
                  <div className="absolute right-7 top-1/2 -translate-y-1/2 w-3 h-3 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
                )}
              </div>

              {/* Status filter — only visible when a job is selected */}
              {selectedJobId && (
                <div className="relative">
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="appearance-none pl-3 pr-7 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-colors w-32"
                  >
                    <option value="">All Statuses</option>
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                  <svg className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </div>
              )}

              {/* Bookmarked toggle */}
              <button
                onClick={() => setBookmarkedOnly((b) => !b)}
                title={bookmarkedOnly ? "Show all" : "Show bookmarked only"}
                className={`flex items-center gap-1.5 px-3 py-2 text-sm rounded-xl border transition-colors shrink-0 ${
                  bookmarkedOnly
                    ? "border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400"
                    : "border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                }`}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill={bookmarkedOnly ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                </svg>
                Saved
              </button>

              {/* Clear — only visible when something is active */}
              {hasActiveFilter && (
                <button
                  onClick={clearFilters}
                  title="Clear all filters"
                  className="p-2 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors shrink-0"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Skill pills */}
          {allSkills.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
              <div className="flex items-center flex-wrap gap-1.5">
                <span className="text-xs text-gray-400 dark:text-gray-500 mr-1 shrink-0">Skills:</span>
                {allSkills.map((skill) => {
                  const active = selectedSkills.has(skill);
                  return (
                    <button
                      key={skill}
                      onClick={() => toggleSkill(skill)}
                      className={`px-2.5 py-0.5 text-xs rounded-full border transition-colors ${
                        active
                          ? "border-teal-500 bg-teal-500 text-white"
                          : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-teal-400 dark:hover:border-teal-600 hover:text-teal-700 dark:hover:text-teal-400"
                      }`}
                    >
                      {skill}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Result count */}
          {!loading && (
            <p className="mt-2.5 text-xs text-gray-400 dark:text-gray-500">
              {filtered.length} {filtered.length === 1 ? "applicant" : "applicants"} found
              {selectedJobId && jobApplications !== null && " · filtered by job"}
            </p>
          )}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-52 bg-gray-200 dark:bg-gray-800 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-3">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {hasActiveFilter ? "No applicants match your filters" : "No applicants yet"}
            </p>
            {hasActiveFilter && (
              <button onClick={clearFilters} className="mt-2 text-xs text-teal-600 dark:text-teal-400 hover:underline">
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((applicant) => {
              const avatarSrc = applicant.avatar_url ? `${API_BASE}${applicant.avatar_url}` : null;
              const skills = applicant.skills
                ? applicant.skills.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 4)
                : [];
              const isSaved = savedIds.has(applicant.id);
              const resumeSrc = applicant.resume_url ? `${API_BASE}${applicant.resume_url}` : null;
              const jobApp = jobApplications?.find((ja) => ja.user_id === applicant.id);

              return (
                <div key={applicant.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 hover:border-teal-200 dark:hover:border-teal-800 transition-colors flex flex-col">
                  {/* Top: avatar + bookmark */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <Link to={`/applicants/${applicant.id}`} className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center shrink-0">
                        {avatarSrc ? (
                          <img src={avatarSrc} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-sm font-bold text-teal-700 dark:text-teal-300">{initials(applicant.full_name)}</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white hover:text-teal-600 dark:hover:text-teal-400 transition-colors truncate">{applicant.full_name}</p>
                        {applicant.headline && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">{applicant.headline}</p>
                        )}
                      </div>
                    </Link>
                    <button
                      onClick={(e) => toggleBookmark(e, applicant.id)}
                      disabled={bookmarkingId === applicant.id}
                      title={isSaved ? "Remove bookmark" : "Bookmark applicant"}
                      className={`p-1.5 rounded-lg border transition-colors disabled:opacity-50 shrink-0 ${
                        isSaved
                          ? "border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400"
                          : "border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-amber-500"
                      }`}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill={isSaved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                      </svg>
                    </button>
                  </div>

                  {/* AI score badge (only when job is selected) */}
                  {jobApp && (
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${scoreColor(jobApp.ai_score)}`}>
                        AI Score: {jobApp.ai_score}%
                      </span>
                      <span className="text-xs text-gray-400 dark:text-gray-500 capitalize">{jobApp.status.replace("_", " ")}</span>
                    </div>
                  )}

                  {/* Meta */}
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-gray-400 dark:text-gray-500 mb-3">
                    {applicant.location && <span>{applicant.location}</span>}
                    {applicant.years_of_experience != null && (
                      <span>{applicant.location ? "·" : ""} {applicant.years_of_experience}yr exp</span>
                    )}
                  </div>

                  {/* Skills */}
                  {skills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {skills.map((s) => (
                        <span
                          key={s}
                          className={`px-2 py-0.5 text-xs rounded-full border transition-colors cursor-pointer ${
                            selectedSkills.has(s)
                              ? "bg-teal-500 text-white border-teal-500"
                              : "bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 border-teal-100 dark:border-teal-800 hover:border-teal-400"
                          }`}
                          onClick={() => toggleSkill(s)}
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="mt-auto flex items-center gap-2 pt-3 border-t border-gray-100 dark:border-gray-800">
                    {resumeSrc && (
                      <a
                        href={resumeSrc}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1.5 text-xs font-medium rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        Resume
                      </a>
                    )}
                    <Link
                      to={`/applicants/${applicant.id}`}
                      className="flex-1 text-center px-2.5 py-1.5 text-xs font-medium rounded-lg border border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-colors"
                    >
                      View Profile
                    </Link>
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
