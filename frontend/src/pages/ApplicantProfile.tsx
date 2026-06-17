import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../api/api";
import Navbar from "../components/Navbar";
import { useAuthStore, type User } from "../store/authStore";
import { getCurrencySymbol } from "../lib/schemas";

const API_BASE = "http://127.0.0.1:8000";

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide">{label}</p>
      <div className="text-sm text-gray-900 dark:text-white">{value}</div>
    </div>
  );
}

export default function ApplicantProfile() {
  const { id } = useParams<{ id: string }>();
  const { user: currentUser } = useAuthStore();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [bookmarking, setBookmarking] = useState(false);

  const canManage = currentUser && ["admin", "hr", "recruiter"].includes(currentUser.role);

  useEffect(() => {
    if (!canManage) return;
    Promise.all([
      api.get(`/users/${id}`),
      api.get(`/saved-applicants/check/${id}`),
    ])
      .then(([profileRes, checkRes]) => {
        setProfile(profileRes.data);
        setBookmarked(checkRes.data.saved);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id, canManage]);

  async function toggleBookmark() {
    if (!profile) return;
    setBookmarking(true);
    try {
      if (bookmarked) {
        await api.delete(`/saved-applicants/${profile.id}`);
        setBookmarked(false);
      } else {
        await api.post(`/saved-applicants/${profile.id}`);
        setBookmarked(true);
      }
    } catch {
      // silently ignore duplicate/not-found
    } finally {
      setBookmarking(false);
    }
  }

  if (!canManage) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 py-16 text-center">
          <p className="text-gray-500 dark:text-gray-400">Access denied.</p>
        </main>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-32 bg-gray-200 dark:bg-gray-800 rounded-2xl" />
            <div className="h-48 bg-gray-200 dark:bg-gray-800 rounded-2xl" />
          </div>
        </main>
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 py-16 text-center">
          <p className="text-gray-500 dark:text-gray-400">Applicant not found.</p>
          <button onClick={() => navigate(-1)} className="mt-4 inline-block text-sm text-teal-600 dark:text-teal-400 hover:underline">← Back</button>
        </main>
      </div>
    );
  }

  const avatarSrc = profile.avatar_url ? `${API_BASE}${profile.avatar_url}` : null;
  const resumeSrc = profile.resume_url ? `${API_BASE}${profile.resume_url}` : null;
  const skills = profile.skills ? profile.skills.split(",").map((s) => s.trim()).filter(Boolean) : [];
  const salaryLabel = profile.expected_salary
    ? `${getCurrencySymbol(profile.salary_currency ?? "PHP")}${profile.expected_salary.toLocaleString()} ${profile.salary_currency ?? "PHP"}`
    : null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-200">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors mb-6"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back
        </button>

        {/* Header card */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 mb-5">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-full overflow-hidden bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center shrink-0">
                {avatarSrc ? (
                  <img src={avatarSrc} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xl font-bold text-teal-700 dark:text-teal-300">{initials(profile.full_name)}</span>
                )}
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">{profile.full_name}</h1>
                {profile.headline && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{profile.headline}</p>
                )}
                <div className="flex flex-wrap items-center gap-3 mt-2">
                  <a href={`mailto:${profile.email}`} className="text-xs text-teal-600 dark:text-teal-400 hover:underline">{profile.email}</a>
                  {profile.phone && <span className="text-xs text-gray-500 dark:text-gray-400">{profile.phone}</span>}
                  {profile.location && (
                    <span className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
                      </svg>
                      {profile.location}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {resumeSrc && (
                <a
                  href={resumeSrc}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors inline-flex items-center gap-1.5"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                  Resume
                </a>
              )}
              <button
                onClick={toggleBookmark}
                disabled={bookmarking}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors inline-flex items-center gap-1.5 ${
                  bookmarked
                    ? "border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400"
                    : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                } disabled:opacity-50`}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill={bookmarked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                </svg>
                {bookmarked ? "Bookmarked" : "Bookmark"}
              </button>
            </div>
          </div>
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 space-y-4">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Professional Details</h2>
            {profile.years_of_experience != null && (
              <InfoRow label="Experience" value={`${profile.years_of_experience} year${profile.years_of_experience !== 1 ? "s" : ""}`} />
            )}
            {salaryLabel && <InfoRow label="Expected Salary" value={<span className="font-semibold text-teal-700 dark:text-teal-400">{salaryLabel}</span>} />}
            {profile.linkedin_url && (
              <InfoRow label="LinkedIn" value={<a href={profile.linkedin_url} target="_blank" rel="noreferrer" className="text-teal-600 dark:text-teal-400 hover:underline truncate block">{profile.linkedin_url}</a>} />
            )}
            {profile.portfolio_url && (
              <InfoRow label="Portfolio" value={<a href={profile.portfolio_url} target="_blank" rel="noreferrer" className="text-teal-600 dark:text-teal-400 hover:underline truncate block">{profile.portfolio_url}</a>} />
            )}
          </div>

          {skills.length > 0 && (
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Skills</h2>
              <div className="flex flex-wrap gap-2">
                {skills.map((skill) => (
                  <span key={skill} className="px-2.5 py-1 text-xs font-medium rounded-full bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 border border-teal-100 dark:border-teal-800">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {profile.summary && (
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Professional Summary</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-line">{profile.summary}</p>
          </div>
        )}
      </main>
    </div>
  );
}
