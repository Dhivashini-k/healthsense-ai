import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useApp } from "../../context/AppContext";
import { ShieldCheck, Lock, User, LogIn } from "lucide-react";

const DEMO_ROLES = [
  {
    role: "nurse",
    label: "Nurse",
    email: "nurse@healthsense.demo",
    password: "Nurse@123",
    description: "Register patients, screen risk, and manage referrals."
  },
  {
    role: "diabetes",
    label: "Diabetes Specialist",
    email: "diabetes@healthsense.demo",
    password: "Diabetes@123",
    description: "Review diabetes referrals and sign reports."
  },
  {
    role: "hypertension",
    label: "Hypertension Specialist",
    email: "hypertension@healthsense.demo",
    password: "Hypertension@123",
    description: "Review hypertension referrals and order labs."
  },
  {
    role: "cardiovascular",
    label: "Cardiovascular Specialist",
    email: "cardio@healthsense.demo",
    password: "Cardio@123",
    description: "Review CVD high-risk patients and sign reports."
  },
  {
    role: "stroke",
    label: "Stroke Specialist",
    email: "stroke@healthsense.demo",
    password: "Stroke@123",
    description: "Review stroke high-risk patients and sign reports."
  },
  {
    role: "ckd",
    label: "CKD Specialist",
    email: "ckd@healthsense.demo",
    password: "CKD@123",
    description: "Review CKD referrals and approve lab orders."
  }
];

export default function LoginPage() {
  const { loginUser, authError } = useApp();
  const [loading, setLoading] = useState(false);
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors }
  } = useForm({ defaultValues: { email: "", password: "" } });

  const onSubmit = async (data) => {
    setLoading(true);
    await loginUser(data);
    setLoading(false);
  };

  const handleAutofill = (credentials) => {
    setValue("email", credentials.email);
    setValue("password", credentials.password);
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.16),transparent_42%),linear-gradient(180deg,_#031f11_0%,_#071b15_100%)] text-white flex items-center justify-center py-10 px-4">
      <div className="w-full max-w-6xl grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="bg-slate-950/90 border border-slate-800 rounded-3xl p-10 shadow-2xl shadow-emerald-900/20 backdrop-blur-xl">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-14 h-14 rounded-3xl bg-emerald-500/15 text-emerald-300 flex items-center justify-center">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-emerald-300 font-semibold">HealthSense AI</p>
              <h1 className="mt-3 text-3xl font-black text-white">Select your role</h1>
            </div>
          </div>

          <p className="text-sm text-slate-300 leading-relaxed max-w-md">
            Choose your role to automatically fill the demo credentials for the respective dashboards.
          </p>

          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {DEMO_ROLES.map((portal) => (
              <button
                key={portal.role}
                type="button"
                onClick={() => handleAutofill(portal)}
                className="group w-full rounded-3xl border border-slate-700/80 bg-slate-900/80 px-5 py-4 text-left transition hover:border-emerald-400 hover:bg-slate-800"
              >
                <div className="flex flex-col gap-1">
                  <p className="text-xs font-bold uppercase tracking-[0.1em] text-emerald-300">{portal.label}</p>
                  <p className="text-xs text-slate-400">Demo account</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-3xl p-8 shadow-xl border border-slate-200">
          <div className="mb-6">
            <p className="text-xs uppercase tracking-[0.25em] text-emerald-600 font-black">Secure Login</p>
            <h2 className="mt-3 text-2xl font-black text-slate-900">Sign in to your HealthSense Portal</h2>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <label className="block text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
              Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                {...register("email", { required: "Email is required" })}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                placeholder="email@healthsense.demo"
              />
              <User className="absolute right-4 top-3.5 text-slate-400" />
            </div>
            {errors.email && <p className="text-[11px] text-rose-600">{errors.email.message}</p>}

            <label className="block text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
              Password (Demo)
            </label>
            <div className="relative">
              <input
                type="text"
                {...register("password", { required: "Password is required" })}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                placeholder="Enter secure password"
              />
              <Lock className="absolute right-4 top-3.5 text-slate-400" />
            </div>
            {errors.password && <p className="text-[11px] text-rose-600">{errors.password.message}</p>}

            {authError && <div className="rounded-2xl bg-rose-50 border border-rose-200 p-3 text-sm text-rose-700">{authError}</div>}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-black uppercase tracking-[0.18em] text-white shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-700 disabled:opacity-60"
            >
              <LogIn className="w-5 h-5" />
              {loading ? "Signing in..." : "Sign In"}
            </button>

            <p className="text-xs text-slate-500 text-center">
              Click on a role card to automatically populate the demo credentials.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
