import { useEffect, useRef, useState } from "react";
import { Navigate } from "react-router-dom";
import { api } from "../api/api";
import Navbar from "../components/Navbar";
import { useAuthStore } from "../store/authStore";

const API_BASE = "http://127.0.0.1:8000";

interface AppResume {
  id: number;
  resume_url: string;
  status: string;
  created_at: string;
  job: { id: number; title: string; company_name: string | null };
}

const STATUS_LABELS: Record<string, string> = {
  applied: "Applied",
  under_review: "Under Review",
  shortlisted: "Shortlisted",
  interview_scheduled: "Interview",
  rejected: "Rejected",
  hired: "Hired",
};

const STATUS_COLORS: Record<string, string> = {
  applied: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  under_review: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
  shortlisted: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  interview_scheduled: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
  rejected: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  hired: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function PdfIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
}

function PreviewModal({
  url,
  title,
  onClose,
}: {
  url: string;
  title: string;
  onClose: () => void;
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col overflow-hidden"
        style={{ maxHeight: "90vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <PdfIcon className="text-red-600 dark:text-red-400 w-3.5 h-3.5" />
            </div>
            <span className="text-sm font-semibold text-gray-900 dark:text-white truncate max-w-lg">
              {title}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <a
              href={url}
              download="resume.pdf"
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              Download
            </a>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* PDF iframe */}
        <div className="flex-1 overflow-hidden" style={{ minHeight: "60vh" }}>
          <iframe
            src={url}
            title={title}
            className="w-full h-full border-0"
            style={{ minHeight: "60vh" }}
          />
        </div>
      </div>
    </div>
  );
}

export default function Resumes() {
  const { user, updateUser } = useAuthStore();
  const [appResumes, setAppResumes] = useState<AppResume[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isApplicant = user?.role === "applicant";

  useEffect(() => {
    if (!isApplicant) return;
    api
      .get<{ applications: AppResume[] }>("/applications/me")
      .then((r) => {
        setAppResumes(r.data.applications.filter((a) => !!a.resume_url));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isApplicant]);

  if (!isApplicant) {
    return <Navigate to="/dashboard" replace />;
  }

  const profileResumeUrl = user?.resume_url ? `${API_BASE}${user.resume_url}` : null;

  function openPreview(url: string, title: string) {
    setPreviewUrl(url);
    setPreviewTitle(title);
  }

  async function handleFileChange(e: { target: HTMLInputElement }) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      alert("Only PDF files are allowed.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("File size must be under 5 MB.");
      return;
    }
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await api.post("/auth/resume", form);
      updateUser(res.data);
    } catch {
      alert("Failed to upload resume. Please try again.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-200">
      <Navbar />

      {previewUrl && (
        <PreviewModal
          url={previewUrl}
          title={previewTitle}
          onClose={() => setPreviewUrl(null)}
        />
      )}

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Resume Storage</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage, preview, and download your resume files.
          </p>
        </div>

        {/* Profile Resume */}
        <section className="mb-8">
          <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
            Profile Resume
          </h2>
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-5">
            {profileResumeUrl ? (
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
                  <PdfIcon className="text-red-600 dark:text-red-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Profile Resume
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    PDF · auto-linked when you apply for jobs
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => openPreview(profileResumeUrl, "Profile Resume")}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  >
                    Preview
                  </button>
                  <a
                    href={profileResumeUrl}
                    download="profile-resume.pdf"
                    className="px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  >
                    Download
                  </a>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-60 transition-colors"
                  >
                    {uploading ? "Uploading…" : "Replace"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center py-6">
                <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-3">
                  <PdfIcon className="text-gray-400 dark:text-gray-500 w-6 h-6" />
                </div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  No profile resume uploaded
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 text-center">
                  Upload a PDF to auto-link it when applying for jobs.
                </p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-60 transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  {uploading ? "Uploading…" : "Upload Resume"}
                </button>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf"
              className="hidden"
              onChange={handleFileChange}
              disabled={uploading}
            />
          </div>
        </section>

        {/* Application Resumes */}
        <section>
          <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
            Application Resumes
          </h2>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-5">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-gray-200 dark:bg-gray-700 shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3.5 bg-gray-200 dark:bg-gray-700 rounded w-48" />
                      <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-32" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : appResumes.length === 0 ? (
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-8 text-center">
              <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-3">
                <PdfIcon className="text-gray-400 dark:text-gray-500 w-6 h-6" />
              </div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">No application resumes</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Resumes submitted with job applications will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {appResumes.map((app) => {
                const resumeUrl = `${API_BASE}${app.resume_url}`;
                const label = `${app.job.title}${app.job.company_name ? ` · ${app.job.company_name}` : ""}`;
                return (
                  <div
                    key={app.id}
                    className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-4 flex items-center gap-4"
                  >
                    <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
                      <PdfIcon className="text-red-600 dark:text-red-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {app.job.title}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        {app.job.company_name && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {app.job.company_name}
                          </span>
                        )}
                        <span className="text-xs text-gray-400 dark:text-gray-500">
                          {formatDate(app.created_at)}
                        </span>
                        <span
                          className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${STATUS_COLORS[app.status] ?? "bg-gray-100 text-gray-600"}`}
                        >
                          {STATUS_LABELS[app.status] ?? app.status}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => openPreview(resumeUrl, label)}
                        className="px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                      >
                        Preview
                      </button>
                      <a
                        href={resumeUrl}
                        download="resume.pdf"
                        className="px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                      >
                        Download
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
