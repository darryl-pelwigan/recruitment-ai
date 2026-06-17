import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api/api";
import Navbar from "../components/Navbar";
import { useAuthStore, type User } from "../store/authStore";

const ROLE_LABELS: Record<string, string> = { admin: "Admin", hr: "HR", recruiter: "Recruiter", applicant: "Applicant" };
const ROLE_COLORS: Record<string, string> = {
  admin: "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  hr: "bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  recruiter: "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  applicant: "bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400",
};
const ALL_ROLES = ["applicant", "recruiter", "hr", "admin"] as const;
const API_BASE = "http://127.0.0.1:8000";

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function UserManagement() {
  const { user: currentUser } = useAuthStore();
  const navigate = useNavigate();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("all");

  // Password modal
  const [pwModal, setPwModal] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSaving, setPwSaving] = useState(false);
  const [pwSuccess, setPwSuccess] = useState(false);

  // Role change
  const [roleChangingId, setRoleChangingId] = useState<number | null>(null);

  useEffect(() => {
    if (currentUser?.role !== "admin") { navigate("/dashboard"); return; }
    api.get("/admin/users")
      .then((res) => setUsers(res.data))
      .finally(() => setLoading(false));
  }, [currentUser, navigate]);

  async function handleRoleChange(userId: number, newRole: string) {
    setRoleChangingId(userId);
    try {
      const res = await api.patch(`/admin/users/${userId}/role`, { role: newRole });
      setUsers((prev) => prev.map((u) => (u.id === userId ? res.data : u)));
    } catch {
      alert("Failed to change role.");
    } finally {
      setRoleChangingId(null);
    }
  }

  async function handlePasswordSave() {
    if (!pwModal) return;
    setPwError(null);
    setPwSuccess(false);
    if (!newPassword || newPassword.length < 8) {
      setPwError("Password must be at least 8 characters.");
      return;
    }
    setPwSaving(true);
    try {
      await api.patch(`/admin/users/${pwModal.id}/password`, { new_password: newPassword });
      setPwSuccess(true);
      setNewPassword("");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? "Failed to change password.";
      setPwError(msg);
    } finally {
      setPwSaving(false);
    }
  }

  function openPwModal(user: User) {
    setPwModal(user);
    setNewPassword("");
    setPwError(null);
    setPwSuccess(false);
  }

  const filtered = users.filter((u) => {
    const matchSearch = search === "" || u.full_name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = filterRole === "all" || u.role === filterRole;
    return matchSearch && matchRole;
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-200">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Back to Dashboard
          </button>
          <h1 className="mt-3 text-2xl font-bold text-gray-900 dark:text-white">User Management</h1>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{users.length} users total</p>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 mb-6 flex flex-wrap gap-3">
          <div className="flex-1 min-w-48 relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-colors"
            />
          </div>
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="all">All Roles</option>
            {ALL_ROLES.map((r) => (
              <option key={r} value={r}>{ROLE_LABELS[r]}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 dark:bg-gray-800 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400 dark:text-gray-600">
            <p className="text-sm">No users match your filters.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((u) => {
              const avatarSrc = u.avatar_url ? `${API_BASE}${u.avatar_url}` : null;
              const isSelf = u.id === currentUser?.id;
              return (
                <div key={u.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl px-5 py-4">
                  <div className="flex items-center gap-4 flex-wrap">
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center shrink-0">
                      {avatarSrc ? (
                        <img src={avatarSrc} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xs font-bold text-teal-700 dark:text-teal-300">{initials(u.full_name)}</span>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{u.full_name}</p>
                        {isSelf && <span className="text-xs text-gray-400 dark:text-gray-500">(you)</span>}
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${ROLE_COLORS[u.role] ?? "bg-gray-100 text-gray-600"}`}>
                          {ROLE_LABELS[u.role] ?? u.role}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{u.email}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Joined {formatDate(u.created_at)}</p>
                    </div>

                    {/* Actions */}
                    {!isSelf && (
                      <div className="flex items-center gap-2 shrink-0">
                        <select
                          value={u.role}
                          disabled={roleChangingId === u.id}
                          onChange={(e) => handleRoleChange(u.id, e.target.value)}
                          className="text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-50"
                        >
                          {ALL_ROLES.map((r) => (
                            <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                          ))}
                        </select>
                        <button
                          onClick={() => openPwModal(u)}
                          className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        >
                          Change Password
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Change Password Modal */}
      {pwModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100 dark:border-gray-800">
              <div>
                <h2 className="text-base font-semibold text-gray-900 dark:text-white">Change Password</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{pwModal.full_name} ({pwModal.email})</p>
              </div>
              <button onClick={() => setPwModal(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => { setNewPassword(e.target.value); setPwError(null); setPwSuccess(false); }}
                  placeholder="Min 8 characters"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 transition-colors"
                  autoComplete="new-password"
                />
              </div>
              {pwError && <p className="text-xs text-red-500">{pwError}</p>}
              {pwSuccess && <p className="text-xs text-emerald-600 dark:text-emerald-400">Password changed successfully.</p>}
            </div>

            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={() => setPwModal(null)}
                className="flex-1 py-2.5 text-sm font-medium rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Close
              </button>
              <button
                onClick={handlePasswordSave}
                disabled={pwSaving}
                className="flex-1 py-2.5 text-sm font-medium rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white transition-colors"
              >
                {pwSaving ? "Saving..." : "Save Password"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
