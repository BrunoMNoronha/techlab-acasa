import type { MemberInput, MemberListParams, PersonType } from "./types";

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

/**
 * Escapa caracteres especiais de padrão ILIKE/LIKE (% e _) e barra invertida (\)
 * para garantir que a busca textual no banco seja estritamente literal e segura.
 */
export function sanitizeIlikePattern(query: string): string {
  return query.replace(/[%_\\]/g, "\\$&");
}

/**
 * Normaliza e valida parâmetros de consulta de associados (P2-03).
 * Trata query parameters da URL como entrada não confiável:
 * - `q`: remove espaços excedentes; se vazio, indefere; limita tamanho defensivamente a 100 caracteres.
 * - `personType`: aceita somente 'PF' ou 'PJ'; qualquer outro valor é descartado.
 * - `category`: remove espaços excedentes; se vazio, indefere.
 * - `page`: converte para número inteiro >= 1. Valores inválidos, negativos, zero ou NaN viram 1.
 */
export function normalizeMemberListParams(
  raw: Record<string, unknown> | undefined,
): MemberListParams {
  if (!raw || typeof raw !== "object") {
    return { page: 1 };
  }

  // 1. Termo de busca
  let q: string | undefined;
  if (typeof raw.q === "string") {
    const trimmed = raw.q.trim();
    if (trimmed.length > 0) {
      q = trimmed.slice(0, 100);
    }
  }

  // 2. Tipo de pessoa
  let personType: PersonType | undefined;
  if (typeof raw.personType === "string") {
    const upper = raw.personType.trim().toUpperCase();
    if (upper === "PF" || upper === "PJ") {
      personType = upper;
    }
  }

  // 3. Categoria estatutária
  let category: string | undefined;
  if (typeof raw.category === "string") {
    const trimmed = raw.category.trim();
    if (trimmed.length > 0) {
      category = trimmed.slice(0, 50);
    }
  }

  // 4. Página (validação estrita: apenas inteiro seguro >= 1; sem decimais ou partes alfabéticas)
  let page = 1;
  if (raw.page !== undefined && raw.page !== null) {
    if (typeof raw.page === "number") {
      if (Number.isSafeInteger(raw.page) && raw.page >= 1) {
        page = raw.page;
      }
    } else if (typeof raw.page === "string") {
      const trimmed = raw.page.trim();
      if (/^[1-9]\d*$/.test(trimmed)) {
        const parsed = Number(trimmed);
        if (Number.isSafeInteger(parsed) && parsed >= 1) {
          page = parsed;
        }
      }
    }
  }

  const result: MemberListParams = { page };
  if (q) result.q = q;
  if (personType) result.personType = personType;
  if (category) result.category = category;

  return result;
}
