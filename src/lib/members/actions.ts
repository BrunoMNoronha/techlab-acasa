"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireMemberAdministration } from "@/lib/auth/member-administration";
import { logger } from "@/lib/observability/logger";
import { insertMember, updateMember } from "./repository";
import type { MemberFormState } from "./types";
import { isValidUuid, validateMemberInput } from "./validation";

function extractFormData(formData: FormData): Record<string, unknown> {
  return {
    person_type: formData.get("person_type"),
    name: formData.get("name"),
    membership_category_code: formData.get("membership_category_code"),
    email: formData.get("email"),
    phone: formData.get("phone"),
  };
}

/**
 * Server Action para cadastrar novo associado com os dados mínimos da P2-02.
 * Exige autorização server-side fail-closed com requireMemberAdministration().
 * Não registra PII em logs e sanitiza entradas.
 */
export async function createMemberAction(
  _prevState: MemberFormState,
  formData: FormData,
): Promise<MemberFormState> {
  await requireMemberAdministration();

  const rawInput = extractFormData(formData);
  const validation = validateMemberInput(rawInput);

  if (!validation.success) {
    return {
      status: "error",
      message: "Por favor, corrija as informações indicadas no formulário.",
      fieldErrors: validation.errors,
    };
  }

  let createdId: string;

  try {
    const member = await insertMember(validation.data);
    createdId = member.id;
  } catch (error) {
    logger.warn("members.create_failed", {
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    return {
      status: "error",
      message: "Não foi possível cadastrar o associado. Verifique os dados e tente novamente.",
    };
  }

  revalidatePath("/area-restrita/associados");
  redirect(`/area-restrita/associados/${createdId}?status=cadastrado`);
}

/**
 * Server Action para editar associado existente com os dados mínimos da P2-02.
 * Exige autorização server-side fail-closed com requireMemberAdministration().
 * Não permite mutação de id ou timestamps.
 */
export async function updateMemberAction(
  memberId: string,
  _prevState: MemberFormState,
  formData: FormData,
): Promise<MemberFormState> {
  await requireMemberAdministration();

  if (!isValidUuid(memberId)) {
    return {
      status: "error",
      message: "Identificador de associado inválido.",
    };
  }

  const rawInput = extractFormData(formData);
  const validation = validateMemberInput(rawInput);

  if (!validation.success) {
    return {
      status: "error",
      message: "Por favor, corrija as informações indicadas no formulário.",
      fieldErrors: validation.errors,
    };
  }

  try {
    await updateMember(memberId, validation.data);
  } catch (error) {
    logger.warn("members.update_failed", {
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    return {
      status: "error",
      message: "Não foi possível atualizar o associado. Verifique os dados e tente novamente.",
    };
  }

  revalidatePath("/area-restrita/associados");
  revalidatePath(`/area-restrita/associados/${memberId}`);
  redirect(`/area-restrita/associados/${memberId}?status=atualizado`);
}
