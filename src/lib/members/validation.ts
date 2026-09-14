import type { MemberInput, PersonType } from "./types";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Valida se a string fornecida possui formato de UUID válido. */
export function isValidUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_REGEX.test(value);
}

/** Validação técnica conservadora de formato de e-mail. */
export function isValidEmailFormat(email: string): boolean {
  return EMAIL_REGEX.test(email);
}

export type ValidationResult =
  | { success: true; data: MemberInput }
  | { success: false; errors: Partial<Record<keyof MemberInput, string>> };

/**
 * Valida e sanitiza os campos de negócio autorizados para a P2-02.
 * Converte strings vazias de campos opcionais (email, phone) em `null`.
 * Não impõe categorias hardcoded nem unicidade de dados de contato.
 */
export function validateMemberInput(
  input: Record<string, unknown>,
): ValidationResult {
  const errors: Partial<Record<keyof MemberInput, string>> = {};

  // 1. Tipo de pessoa
  const rawPersonType =
    typeof input.person_type === "string" ? input.person_type.trim().toUpperCase() : "";
  let personType: PersonType | undefined;
  if (rawPersonType === "PF" || rawPersonType === "PJ") {
    personType = rawPersonType;
  } else {
    errors.person_type = "Tipo de pessoa deve ser PF (Pessoa Física) ou PJ (Pessoa Jurídica).";
  }

  // 2. Nome / Razão social
  const rawName = typeof input.name === "string" ? input.name.trim() : "";
  if (!rawName) {
    errors.name = "Nome ou razão social é obrigatório.";
  }

  // 3. Categoria estatutária
  const rawCategory =
    typeof input.membership_category_code === "string"
      ? input.membership_category_code.trim()
      : "";
  if (!rawCategory) {
    errors.membership_category_code = "Categoria estatutária é obrigatória.";
  }

  // 4. E-mail (opcional)
  let email: string | null = null;
  if (typeof input.email === "string") {
    const trimmed = input.email.trim();
    if (trimmed) {
      if (isValidEmailFormat(trimmed)) {
        email = trimmed;
      } else {
        errors.email = "Formato de e-mail inválido.";
      }
    }
  }

  // 5. Telefone (opcional)
  let phone: string | null = null;
  if (typeof input.phone === "string") {
    const trimmed = input.phone.trim();
    if (trimmed) {
      phone = trimmed;
    }
  }

  if (Object.keys(errors).length > 0 || !personType) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: {
      person_type: personType,
      name: rawName,
      membership_category_code: rawCategory,
      email,
      phone,
    },
  };
}
