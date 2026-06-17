import { useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { useThemeStore } from "./store/themeStore";
import { useAuthStore } from "./store/authStore";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Jobs from "./pages/Jobs";
import PostJob from "./pages/PostJob";
import EditJob from "./pages/EditJob";
import JobDetail from "./pages/JobDetail";
import Profile from "./pages/Profile";
import MyApplications from "./pages/MyApplications";
import Applicants from "./pages/Applicants";
import Pipeline from "./pages/Pipeline";
import ApplicantProfile from "./pages/ApplicantProfile";
import SavedApplicants from "./pages/SavedApplicants";
import SavedJobs from "./pages/SavedJobs";
import UserManagement from "./pages/UserManagement";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

export default function App() {
  const { init } = useThemeStore();

  useEffect(() => {
    init();
  }, [init]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        {/* public — guests can browse and view, but not apply or see salary */}
        <Route path="/jobs" element={<Jobs />} />
        <Route
          path="/jobs/new"
          element={
            <ProtectedRoute>
              <PostJob />
            </ProtectedRoute>
          }
        />
        {/* public — must come after /jobs/new so "new" isn't treated as an id */}
        <Route path="/jobs/:id" element={<JobDetail />} />
        <Route
          path="/jobs/:id/edit"
          element={
            <ProtectedRoute>
              <EditJob />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-applications"
          element={
            <ProtectedRoute>
              <MyApplications />
            </ProtectedRoute>
          }
        />
        <Route
          path="/jobs/:id/applicants"
          element={
            <ProtectedRoute>
              <Applicants />
            </ProtectedRoute>
          }
        />
        <Route
          path="/jobs/:id/pipeline"
          element={
            <ProtectedRoute>
              <Pipeline />
            </ProtectedRoute>
          }
        />
        <Route
          path="/applicants/:id"
          element={
            <ProtectedRoute>
              <ApplicantProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/saved-applicants"
          element={
            <ProtectedRoute>
              <SavedApplicants />
            </ProtectedRoute>
          }
        />
        <Route
          path="/saved-jobs"
          element={
            <ProtectedRoute>
              <SavedJobs />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute>
              <UserManagement />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/jobs" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
