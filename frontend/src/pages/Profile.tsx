import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "react-router-dom";
import { api } from "../api/api";
import Navbar from "../components/Navbar";
import { useAuthStore } from "../store/authStore";
import { profileSchema, type ProfileData } from "../lib/schemas";

const API_BASE = "http://127.0.0.1:8000";

const inputClass =
  "w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-colors";

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

export default function Profile() {
  const { user, updateUser } = useAuthStore();
  const [serverError, setServerError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProfileData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: user?.full_name ?? "",
      email: user?.email ?? "",
      current_password: "",
      new_password: "",
    },
  });

  async function onSubmit(data: ProfileData) {
    setServerError(null);
    setSaveSuccess(false);
    try {
      const payload: Record<string, string | undefined> = {
        full_name: data.full_name,
        email: data.email,
      };
      if (data.new_password) {
        payload.current_password = data.current_password;
        payload.new_password = data.new_password;
      }
      const res = await api.put("/auth/profile", payload);
      updateUser(res.data);
      setSaveSuccess(true);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail ?? "Failed to save profile. Please try again.";
      setServerError(msg);
    }
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await api.post("/auth/avatar", form);
      updateUser(res.data);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail ?? "Failed to upload avatar.";
      alert(msg);
    } finally {
      setAvatarUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  const avatarSrc = user?.avatar_url ? `${API_BASE}${user.avatar_url}` : null;
  const initials = user?.full_name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) ?? "?";

  const roleLabel: Record<string, string> = { hr: "HR", admin: "Admin", recruiter: "Recruiter", applicant: "Applicant" };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-200">
      <Navbar />

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Back to Dashboard
          </Link>
          <h1 className="mt-3 text-2xl font-bold text-gray-900 dark:text-white">My Profile</h1>
        </div>

        {/* Avatar card */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 mb-6">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Profile Picture</h2>
          <div className="flex items-center gap-5">
            <div className="relative shrink-0">
              <div className="w-20 h-20 rounded-full overflow-hidden bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center">
                {avatarSrc ? (
                  <img src={avatarSrc} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl font-bold text-teal-700 dark:text-teal-300">{initials}</span>
                )}
              </div>
              {avatarUploading && (
                <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">{user?.full_name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {roleLabel[user?.role ?? ""] ?? user?.role}
              </p>
              <label className={`mt-3 inline-flex cursor-pointer items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${avatarUploading ? "opacity-60 pointer-events-none" : ""}`}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                {avatarSrc ? "Change Photo" : "Upload Photo"}
                <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={handleAvatarChange} disabled={avatarUploading} />
              </label>
              <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">JPEG, PNG, WebP, GIF · max 5 MB</p>
            </div>
          </div>
        </div>

        {/* Edit info card */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-5">Account Details</h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <Field label="Full Name" error={errors.full_name?.message}>
              <input {...register("full_name")} placeholder="Your full name" className={inputClass} />
            </Field>

            <Field label="Email Address" error={errors.email?.message}>
              <input {...register("email")} type="email" placeholder="you@example.com" className={inputClass} />
            </Field>

            <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Change Password <span className="text-xs font-normal text-gray-400">(leave blank to keep current)</span></p>

              <div className="space-y-4">
                <Field label="Current Password" error={errors.current_password?.message}>
                  <input {...register("current_password")} type="password" placeholder="••••••••" className={inputClass} autoComplete="current-password" />
                </Field>

                <Field label="New Password" error={errors.new_password?.message}>
                  <input {...register("new_password")} type="password" placeholder="Min 8 chars, 1 uppercase, 1 number" className={inputClass} autoComplete="new-password" />
                </Field>
              </div>
            </div>

            {serverError && (
              <p className="text-sm text-red-500">{serverError}</p>
            )}
            {saveSuccess && (
              <p className="text-sm text-emerald-600 dark:text-emerald-400">Profile updated successfully.</p>
            )}

            <div className="flex items-center justify-end pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 text-sm font-medium rounded-lg bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white transition-colors"
              >
                {isSubmitting ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
