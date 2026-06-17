import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api/api";
import Navbar from "../components/Navbar";
import { useAuthStore } from "../store/authStore";
import { getCurrencySymbol } from "../lib/schemas";

const API_BASE = "http://127.0.0.1:8000";

interface SavedApplicantUser {
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

interface SavedApplicantEntry {
  id: number;
  applicant: SavedApplicantUser;
  created_at: string;
}

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

export default function SavedApplicants() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [entries, setEntries] = useState<SavedApplicantEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<number | null>(null);

  const canManage = user && ["admin", "hr", "recruiter"].includes(user.role);

  useEffect(() => {
    if (!canManage) { navigate("/jobs"); return; }
    api.get("/saved-applicants/")
      .then((res) => setEntries(res.data))
      .finally(() => setLoading(false));
  }, [canManage, navigate]);

  async function handleRemove(applicantId: number) {
    setRemovingId(applicantId);
    try {
      await api.delete(`/saved-applicants/${applicantId}`);
      setEntries((prev) => prev.filter((e) => e.applicant.id !== applicantId));
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-200">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Bookmarked Applicants</h1>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">Applicants you've saved for future job listings.</p>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 dark:bg-gray-800 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-3">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">No bookmarked applicants</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Bookmark applicants from their profile page to save them here.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {entries.map(({ applicant }) => {
              const avatarSrc = applicant.avatar_url ? `${API_BASE}${applicant.avatar_url}` : null;
              const skills = applicant.skills ? applicant.skills.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 4) : [];
              const resumeSrc = applicant.resume_url ? `${API_BASE}${applicant.resume_url}` : null;

              return (
                <div key={applicant.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5">
                  <div className="flex items-start gap-4">
                    <div className="w-11 h-11 rounded-full overflow-hidden bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center shrink-0">
                      {avatarSrc ? (
                        <img src={avatarSrc} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-sm font-bold text-teal-700 dark:text-teal-300">{initials(applicant.full_name)}</span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">{applicant.full_name}</p>
                          {applicant.headline && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{applicant.headline}</p>
                          )}
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            <span className="text-xs text-gray-400 dark:text-gray-500">{applicant.email}</span>
                            {applicant.location && (
                              <span className="text-xs text-gray-400 dark:text-gray-500">· {applicant.location}</span>
                            )}
                            {applicant.years_of_experience != null && (
                              <span className="text-xs text-gray-400 dark:text-gray-500">· {applicant.years_of_experience}yr exp</span>
                            )}
                          </div>
                          {skills.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {skills.map((s) => (
                                <span key={s} className="px-2 py-0.5 text-xs rounded-full bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 border border-teal-100 dark:border-teal-800">{s}</span>
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
                            onClick={() => handleRemove(applicant.id)}
                            disabled={removingId === applicant.id}
                            className="px-2.5 py-1.5 text-xs font-medium rounded-lg border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                          >
                            Remove
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
