import { Link, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import BrandLogo from "./BrandLogo";
import ThemeToggle from "./ThemeToggle";

const NAV_LINKS = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/jobs", label: "Jobs" },
];

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const location = useLocation();

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
              </div>
            )}
          </div>

          {/* Right: theme + auth */}
          <div className="flex items-center gap-3">
            <ThemeToggle />

            {isAuthenticated ? (
              <>
                <span className="hidden sm:block text-sm text-gray-600 dark:text-gray-400">
                  {user?.full_name}
                  <span className="ml-1.5 px-1.5 py-0.5 text-xs rounded bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                    {({ hr: "HR", admin: "Admin", recruiter: "Recruiter" } as Record<string, string>)[user?.role ?? ""] ?? user?.role}
                  </span>
                </span>
                <button
                  onClick={logout}
                  className="px-3 py-1.5 rounded-md text-sm font-medium bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-700 dark:hover:bg-gray-100 transition-colors"
                >
                  Logout
                </button>
              </>
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
    </nav>
  );
}
