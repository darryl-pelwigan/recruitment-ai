import { useEffect, useState } from "react";
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

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

export default function AllApplicants() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [savedIds, setSavedIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [bookmarkingId, setBookmarkingId] = useState<number | null>(null);

  const canManage = user && ["admin", "hr", "recruiter"].includes(user.role);

  useEffect(() => {
    if (!canManage) { navigate("/jobs"); return; }
    Promise.all([
      api.get<Applicant[]>("/users/"),
      api.get("/saved-applicants/"),
    ]).then(([usersRes, savedRes]) => {
      setApplicants(usersRes.data);
      setSavedIds(new Set(savedRes.data.map((e: { applicant: { id: number } }) => e.applicant.id)));
    }).finally(() => setLoading(false));
  }, [canManage, navigate]);

  async function toggleBookmark(applicantId: number) {
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
    } catch {
      // ignore
    } finally {
      setBookmarkingId(null);
    }
  }

  const filtered = search.trim()
    ? applicants.filter((a) =>
        a.full_name.toLowerCase().includes(search.toLowerCase()) ||
        a.email.toLowerCase().includes(search.toLowerCase()) ||
        (a.headline ?? "").toLowerCase().includes(search.toLowerCase())
      )
    : applicants;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-200">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Applicants</h1>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
            Browse and bookmark candidates for your job listings.
          </p>
        </div>

        {/* Search */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 mb-6">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, or headline..."
              className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-colors"
            />
          </div>
          {!loading && (
            <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
              {filtered.length} {filtered.length === 1 ? "applicant" : "applicants"} found
            </p>
          )}
        </div>

        {loading ? (
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 dark:bg-gray-800 rounded-2xl animate-pulse" />
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
              {search ? "No applicants match your search" : "No applicants yet"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((applicant) => {
              const avatarSrc = applicant.avatar_url ? `${API_BASE}${applicant.avatar_url}` : null;
              const skills = applicant.skills
                ? applicant.skills.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 4)
                : [];
              const isSaved = savedIds.has(applicant.id);
              const resumeSrc = applicant.resume_url ? `${API_BASE}${applicant.resume_url}` : null;

              return (
                <div key={applicant.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 hover:border-teal-200 dark:hover:border-teal-800 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="w-11 h-11 rounded-full overflow-hidden bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center shrink-0">
                      {avatarSrc ? (
                        <img src={avatarSrc} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-sm font-bold text-teal-700 dark:text-teal-300">{initials(applicant.full_name)}</span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">{applicant.full_name}</p>
                          {applicant.headline && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{applicant.headline}</p>
                          )}
                          <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-gray-400 dark:text-gray-500">
                            <span>{applicant.email}</span>
                            {applicant.location && <span>· {applicant.location}</span>}
                            {applicant.years_of_experience != null && (
                              <span>· {applicant.years_of_experience}yr exp</span>
                            )}
                          </div>
                          {skills.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {skills.map((s) => (
                                <span key={s} className="px-2 py-0.5 text-xs rounded-full bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 border border-teal-100 dark:border-teal-800">
                                  {s}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
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
                            className="px-2.5 py-1.5 text-xs font-medium rounded-lg border border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-colors"
                          >
                            View Profile
                          </Link>
                          <button
                            onClick={() => toggleBookmark(applicant.id)}
                            disabled={bookmarkingId === applicant.id}
                            title={isSaved ? "Remove bookmark" : "Bookmark applicant"}
                            className={`p-1.5 rounded-lg border transition-colors disabled:opacity-50 ${
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
