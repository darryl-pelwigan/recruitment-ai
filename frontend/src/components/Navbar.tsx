import { useState, useRef, useEffect, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { api } from "../api/api";
import BrandLogo from "./BrandLogo";
import ThemeToggle from "./ThemeToggle";

const API_BASE = "http://127.0.0.1:8000";
const MANAGE_ROLES = ["admin", "hr", "recruiter"];
const LAST_READ_KEY = "notif_last_read";

const NAV_LINKS = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/jobs", label: "Jobs" },
];

interface Notification {
  id: number;
  job_id: number;
  created_at: string;
  user: { id: number; full_name: string; avatar_url: string | null };
  job: { id: number; title: string; company_name: string | null };
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function Avatar({ name, avatarUrl, size = 9 }: { name: string; avatarUrl: string | null; size?: number }) {
  const initials = name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  const src = avatarUrl ? `${API_BASE}${avatarUrl}` : null;
  const cls = `w-${size} h-${size} rounded-full overflow-hidden bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center shrink-0`;
  return (
    <div className={cls}>
      {src ? (
        <img src={src} alt={name} className="w-full h-full object-cover" />
      ) : (
        <span className="text-xs font-bold text-teal-700 dark:text-teal-300">{initials}</span>
      )}
    </div>
  );
}

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [lastRead, setLastRead] = useState<number>(() => {
    const stored = localStorage.getItem(LAST_READ_KEY);
    return stored ? parseInt(stored, 10) : 0;
  });

  const menuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const canManage = user ? MANAGE_ROLES.includes(user.role) : false;

  const unreadCount = notifications.filter(
    (n) => new Date(n.created_at).getTime() > lastRead
  ).length;

  const fetchNotifications = useCallback(() => {
    if (!canManage) return;
    api.get<{ applications: Notification[] }>("/applications/recent")
      .then((res) => setNotifications(res.data.applications))
      .catch(() => {});
  }, [canManage]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  function openNotif() {
    setNotifOpen((o) => {
      if (!o) {
        fetchNotifications();
      }
      return !o;
    });
  }

  function markAllRead() {
    const now = Date.now();
    localStorage.setItem(LAST_READ_KEY, String(now));
    setLastRead(now);
  }

  useEffect(() => {
    if (notifOpen) markAllRead();
  }, [notifOpen]);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const userInitials = user?.full_name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) ?? "?";

  const avatarSrc = user?.avatar_url ? `${API_BASE}${user.avatar_url}` : null;
  const roleLabel: Record<string, string> = { hr: "HR", admin: "Admin", recruiter: "Recruiter", applicant: "Applicant" };

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">

          {/* Left: brand + nav links */}
          <div className="flex items-center gap-8">
            <Link to={isAuthenticated ? "/dashboard" : "/jobs"} className="flex items-center gap-2">
              <BrandLogo />
              <span className="text-sm font-semibold text-gray-900 dark:text-white hidden sm:block">
                RecruitAI
              </span>
            </Link>

            {isAuthenticated && (
              <div className="hidden md:flex items-center gap-1">
                {NAV_LINKS.map(({ to, label }) => (
                  <Link
                    key={to}
                    to={to}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      location.pathname === to
                        ? "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white"
                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800"
                    }`}
                  >
                    {label}
                  </Link>
                ))}
                {user?.role === "applicant" && (
                  <Link
                    to="/my-applications"
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      location.pathname === "/my-applications"
                        ? "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white"
                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800"
                    }`}
                  >
                    My Applications
                  </Link>
                )}
                {canManage && (
                  <Link
                    to="/applicants"
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      location.pathname === "/applicants"
                        ? "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white"
                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800"
                    }`}
                  >
                    Applicants
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* Right: theme + auth */}
          <div className="flex items-center gap-3">
            {/* Hamburger — mobile only */}
            {isAuthenticated && (
              <button
                onClick={() => setMobileOpen((o) => !o)}
                className="md:hidden p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Toggle navigation"
              >
                {mobileOpen ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
                  </svg>
                )}
              </button>
            )}
            <ThemeToggle />

            {/* Notification bell — managers only */}
            {canManage && (
              <div className="relative" ref={notifRef}>
                <button
                  onClick={openNotif}
                  className="relative p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                  </svg>
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 flex items-center justify-center rounded-full bg-teal-600 text-white text-[10px] font-bold leading-none">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </button>

                {notifOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl z-50 overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Notifications</h3>
                      {notifications.length > 0 && (
                        <button
                          onClick={markAllRead}
                          className="text-xs text-teal-600 dark:text-teal-400 hover:underline font-medium"
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>

                    {/* List */}
                    <div className="max-h-96 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800">
                      {notifications.length === 0 ? (
                        <div className="px-4 py-10 text-center">
                          <svg className="mx-auto mb-2 text-gray-300 dark:text-gray-600" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                          </svg>
                          <p className="text-sm text-gray-400 dark:text-gray-500">No notifications yet</p>
                          <p className="text-xs text-gray-400 dark:text-gray-600 mt-0.5">You'll see new applicants here</p>
                        </div>
                      ) : (
                        notifications.map((n) => {
                          const isUnread = new Date(n.created_at).getTime() > lastRead;
                          return (
                            <button
                              key={n.id}
                              onClick={() => {
                                setNotifOpen(false);
                                navigate(`/jobs/${n.job.id}/applicants`);
                              }}
                              className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/60 ${
                                isUnread ? "bg-teal-50/60 dark:bg-teal-900/10" : ""
                              }`}
                            >
                              <div className="relative shrink-0 mt-0.5">
                                <Avatar name={n.user.full_name} avatarUrl={n.user.avatar_url} size={9} />
                                {isUnread && (
                                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-teal-500 border-2 border-white dark:border-gray-900" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-gray-800 dark:text-gray-200 leading-snug">
                                  <span className="font-semibold">{n.user.full_name}</span>
                                  {" applied for "}
                                  <span className="font-semibold text-teal-600 dark:text-teal-400">{n.job.title}</span>
                                </p>
                                {n.job.company_name && (
                                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 truncate">{n.job.company_name}</p>
                                )}
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{timeAgo(n.created_at)}</p>
                              </div>
                              {isUnread && (
                                <span className="shrink-0 mt-2 w-2 h-2 rounded-full bg-teal-500" />
                              )}
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {isAuthenticated ? (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen((o) => !o)}
                  className="flex items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  {/* Avatar */}
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center shrink-0">
                    {avatarSrc ? (
                      <img src={avatarSrc} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs font-bold text-teal-700 dark:text-teal-300">{userInitials}</span>
                    )}
                  </div>
                  <span className="hidden sm:block text-sm text-gray-700 dark:text-gray-300 font-medium max-w-32 truncate">
                    {user?.full_name}
                  </span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 hidden sm:block">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>

                {menuOpen && (
                  <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg py-1 z-50">
                    <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-800">
                      <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">{user?.full_name}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{roleLabel[user?.role ?? ""] ?? user?.role}</p>
                    </div>
                    <Link
                      to="/profile"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                      My Profile
                    </Link>
                    {user?.role === "applicant" && (
                      <>
                        <Link
                          to="/my-applications"
                          onClick={() => setMenuOpen(false)}
                          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                          </svg>
                          My Applications
                        </Link>
                        <Link
                          to="/saved-jobs"
                          onClick={() => setMenuOpen(false)}
                          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                          </svg>
                          Saved Jobs
                        </Link>
                      </>
                    )}
                    {canManage && (
                      <Link
                        to="/saved-applicants"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                          <circle cx="9" cy="7" r="4" />
                          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                        Bookmarked Applicants
                      </Link>
                    )}
                    {user?.role === "admin" && (
                      <Link
                        to="/admin/users"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                          <circle cx="9" cy="7" r="4" />
                          <line x1="23" y1="11" x2="17" y2="11" />
                          <line x1="20" y1="8" x2="20" y2="14" />
                        </svg>
                        User Management
                      </Link>
                    )}
                    <button
                      onClick={() => { setMenuOpen(false); logout(); }}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                        <polyline points="16 17 21 12 16 7" />
                        <line x1="21" y1="12" x2="9" y2="12" />
                      </svg>
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-3 py-1.5 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-3 py-1.5 rounded-md text-sm font-medium bg-teal-600 hover:bg-teal-700 text-white transition-colors"
                >
                  Register
                </Link>
              </>
            )}
          </div>

        </div>
      </div>

      {/* Mobile navigation panel */}
      {mobileOpen && isAuthenticated && (
        <div className="md:hidden border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-3 space-y-1">
          {NAV_LINKS.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                location.pathname === to
                  ? "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              {label}
            </Link>
          ))}
          {user?.role === "applicant" && (
            <Link
              to="/my-applications"
              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                location.pathname === "/my-applications"
                  ? "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              My Applications
            </Link>
          )}
          {canManage && (
            <Link
              to="/applicants"
              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                location.pathname === "/applicants"
                  ? "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              Applicants
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}
