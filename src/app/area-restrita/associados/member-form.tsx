"use client";

import Link from "next/link";
import { useActionState } from "react";
import type { Member, MemberFormState, MembershipCategory } from "@/lib/members/types";

interface MemberFormProps {
  initialData?: Member | null;
  categories: MembershipCategory[];
  action: (state: MemberFormState, formData: FormData) => Promise<MemberFormState>;
  submitLabel: string;
}

const initialState: MemberFormState = {
  status: "idle",
};

export function MemberForm({
  initialData,
  categories,
  action,
  submitLabel,
}: MemberFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form action={formAction} noValidate className="mt-8 space-y-6 max-w-2xl">
      {state.status === "error" && state.message && (
        <div
          role="alert"
          aria-live="polite"
          className="rounded-md border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-800"
        >
          {state.message}
        </div>
      )}

      {/* Tipo de Pessoa */}
      <fieldset className="space-y-2">
        <legend className="text-sm font-semibold text-slate-900">
          Tipo de pessoa <span className="text-red-600">*</span>
        </legend>
        <div className="flex gap-6 mt-1">
          <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-800">
            <input
              type="radio"
              name="person_type"
              value="PF"
              defaultChecked={initialData ? initialData.person_type === "PF" : true}
              className="h-4 w-4 border-slate-300 text-slate-900 focus:ring-2 focus:ring-slate-900"
              aria-describedby={state.fieldErrors?.person_type ? "person_type-error" : undefined}
            />
            Pessoa Física (PF)
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-800">
            <input
              type="radio"
              name="person_type"
              value="PJ"
              defaultChecked={initialData?.person_type === "PJ"}
              className="h-4 w-4 border-slate-300 text-slate-900 focus:ring-2 focus:ring-slate-900"
              aria-describedby={state.fieldErrors?.person_type ? "person_type-error" : undefined}
            />
            Pessoa Jurídica (PJ)
          </label>
        </div>
        {state.fieldErrors?.person_type && (
          <p id="person_type-error" className="text-sm text-red-600 font-medium">
            {state.fieldErrors.person_type}
          </p>
        )}
      </fieldset>

      {/* Nome ou Razão Social */}
      <div>
        <label htmlFor="name" className="block text-sm font-semibold text-slate-900">
          Nome completo ou Razão social <span className="text-red-600">*</span>
        </label>
        <input
          type="text"
          id="name"
          name="name"
          defaultValue={initialData?.name ?? ""}
          required
          aria-describedby={state.fieldErrors?.name ? "name-error" : undefined}
          className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 sm:text-sm"
        />
        {state.fieldErrors?.name && (
          <p id="name-error" className="mt-1 text-sm text-red-600 font-medium">
            {state.fieldErrors.name}
          </p>
        )}
      </div>

      {/* Categoria Estatutária */}
      <div>
        <label
          htmlFor="membership_category_code"
          className="block text-sm font-semibold text-slate-900"
        >
          Categoria estatutária <span className="text-red-600">*</span>
        </label>
        <select
          id="membership_category_code"
          name="membership_category_code"
          defaultValue={initialData?.membership_category_code ?? ""}
          required
          aria-describedby={
            state.fieldErrors?.membership_category_code ? "category-error" : undefined
          }
          className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 sm:text-sm"
        >
          <option value="" disabled>
            Selecione uma categoria estatutária
          </option>
          {categories.map((cat) => (
            <option key={cat.code} value={cat.code}>
              {cat.name}
            </option>
          ))}
        </select>
        {state.fieldErrors?.membership_category_code && (
          <p id="category-error" className="mt-1 text-sm text-red-600 font-medium">
            {state.fieldErrors.membership_category_code}
          </p>
        )}
      </div>

      {/* E-mail */}
      <div>
        <label htmlFor="email" className="block text-sm font-semibold text-slate-900">
          E-mail <span className="text-xs font-normal text-slate-500">(opcional)</span>
        </label>
        <input
          type="email"
          id="email"
          name="email"
          defaultValue={initialData?.email ?? ""}
          aria-describedby={state.fieldErrors?.email ? "email-error" : undefined}
          className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 sm:text-sm"
        />
        {state.fieldErrors?.email && (
          <p id="email-error" className="mt-1 text-sm text-red-600 font-medium">
            {state.fieldErrors.email}
          </p>
        )}
      </div>

      {/* Telefone */}
      <div>
        <label htmlFor="phone" className="block text-sm font-semibold text-slate-900">
          Telefone <span className="text-xs font-normal text-slate-500">(opcional)</span>
        </label>
        <input
          type="tel"
          id="phone"
          name="phone"
          defaultValue={initialData?.phone ?? ""}
          aria-describedby={state.fieldErrors?.phone ? "phone-error" : undefined}
          className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 sm:text-sm"
        />
        {state.fieldErrors?.phone && (
          <p id="phone-error" className="mt-1 text-sm text-red-600 font-medium">
            {state.fieldErrors.phone}
          </p>
        )}
      </div>

      {/* Ações */}
      <div className="flex items-center gap-4 pt-4">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex justify-center rounded-md border border-transparent bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Salvando..." : submitLabel}
        </button>

        <Link
          href="/area-restrita/associados"
          className="rounded-md px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-900"
        >
          Cancelar
        </Link>
      </div>
    </form>
  );
}
