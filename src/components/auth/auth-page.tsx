import Link from "next/link";
import type { ReactNode } from "react";

type AuthPageProps = {
  title: string;
  description: string;
  children: ReactNode;
};

export function AuthPage({ title, description, children }: AuthPageProps) {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-16 text-slate-950 sm:px-10">
      <section
        aria-labelledby="auth-title"
        className="mx-auto w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm"
      >
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-slate-600">
          <Link href="/" className="hover:underline">
            TechLab+ ACASA
          </Link>
        </p>

        <h1 id="auth-title" className="text-2xl font-semibold tracking-tight">
          {title}
        </h1>

        <p className="mt-2 text-slate-600">{description}</p>

        <div className="mt-8">{children}</div>
      </section>
    </main>
  );
}

export const labelClassName = "block text-sm font-medium text-slate-800";

export const inputClassName =
  "mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-950 shadow-sm focus:border-slate-500 aria-[invalid=true]:border-red-600";

export const buttonClassName =
  "inline-flex w-full items-center justify-center rounded-lg bg-slate-900 px-4 py-2.5 font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60";

export const linkClassName = "font-medium text-slate-800 underline underline-offset-4";
