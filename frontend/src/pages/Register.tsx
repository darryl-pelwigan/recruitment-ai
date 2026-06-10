import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import ThemeToggle from "../components/ThemeToggle";
import BrandLogo from "../components/BrandLogo";
import { registerSchema, type RegisterData } from "../lib/schemas";

function inputClass(hasError: boolean) {
  return (
    "w-full px-4 py-2.5 rounded-lg border text-sm bg-white dark:bg-gray-800 " +
    "text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 " +
    "focus:outline-none focus:ring-2 focus:border-transparent transition-colors " +
    (hasError
      ? "border-red-400 dark:border-red-500 focus:ring-red-400"
      : "border-gray-200 dark:border-gray-700 focus:ring-gray-900 dark:focus:ring-white")
  );
}

export default function Register() {
  const [serverError, setServerError] = useState("");
  const { register: signUp } = useAuthStore();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterData>({ resolver: zodResolver(registerSchema) });

  async function onSubmit(data: RegisterData) {
    setServerError("");
    try {
      await signUp(data.full_name, data.email, data.password, data.role);
      navigate("/login");
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        "Registration failed. Please try again.";
      setServerError(message);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-950 px-4 transition-colors duration-200">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-sm bg-white dark:bg-gray-900 rounded-2xl shadow-lg dark:shadow-gray-900/50 p-8 border border-gray-100 dark:border-gray-800">
        <div className="flex flex-col items-center mb-8">
          <BrandLogo />
          <h1 className="mt-3 text-lg font-semibold text-gray-900 dark:text-white tracking-tight">
            Recruitment AI
          </h1>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <input
              {...register("full_name")}
              type="text"
              placeholder="Full Name"
              autoComplete="name"
              className={inputClass(!!errors.full_name)}
            />
            {errors.full_name && (
              <p className="mt-1 text-xs text-red-500 dark:text-red-400">{errors.full_name.message}</p>
            )}
          </div>

          <div>
            <input
              {...register("email")}
              type="email"
              placeholder="Email"
              autoComplete="email"
              className={inputClass(!!errors.email)}
            />
            {errors.email && (
              <p className="mt-1 text-xs text-red-500 dark:text-red-400">{errors.email.message}</p>
            )}
          </div>

          <div>
            <input
              {...register("password")}
              type="password"
              placeholder="Password"
              autoComplete="new-password"
              className={inputClass(!!errors.password)}
            />
            {errors.password && (
              <p className="mt-1 text-xs text-red-500 dark:text-red-400">{errors.password.message}</p>
            )}
          </div>

          <div>
            <select
              {...register("role")}
              className={inputClass(!!errors.role) + " appearance-none cursor-pointer"}
            >
              <option value="applicant">Applicant</option>
              <option value="recruiter">Recruiter</option>
            </select>
            {errors.role && (
              <p className="mt-1 text-xs text-red-500 dark:text-red-400">{errors.role.message}</p>
            )}
          </div>

          {serverError && (
            <p className="text-sm text-red-500 dark:text-red-400 text-center">{serverError}</p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 rounded-lg bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-semibold text-sm hover:bg-gray-700 dark:hover:bg-gray-100 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Creating account…" : "Create Account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-semibold text-gray-900 dark:text-white hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
