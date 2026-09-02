import { MIN_PASSWORD_LENGTH } from "./validation";

/**
 * Mensagens genéricas por desenho: não confirmam a existência de contas nem
 * detalham a causa de falhas de autenticação.
 */
export const authMessages = {
  missingCredentials: "Informe o e-mail e a senha.",
  loginFailed: "Não foi possível entrar. Verifique o e-mail e a senha informados.",
  invalidEmail: "Informe um e-mail válido.",
  recoveryRequested:
    "Se existir uma conta para este e-mail, enviaremos instruções para redefinir a senha.",
  recoveryLinkInvalid:
    "O link de recuperação é inválido ou expirou. Solicite um novo link.",
  recoverySessionInvalid:
    "A sessão de recuperação é inválida ou expirou. Solicite um novo link.",
  passwordTooShort: `A senha deve ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`,
  passwordMismatch: "As senhas informadas não coincidem.",
  passwordSameAsCurrent: "A nova senha deve ser diferente da senha atual.",
  passwordUpdateFailed: "Não foi possível atualizar a senha. Tente novamente.",
  passwordUpdated: "Senha atualizada com sucesso. Entre com a nova senha.",
  sessionEnded: "Sessão encerrada.",
  logoutFailed: "Não foi possível encerrar a sessão. Tente novamente.",
} as const;

/** Avisos exibidos via query string; somente chaves conhecidas são aceitas. */
export const loginNotices: Record<string, string> = {
  "senha-atualizada": authMessages.passwordUpdated,
  "sessao-encerrada": authMessages.sessionEnded,
};

export const recoveryNotices: Record<string, string> = {
  "link-invalido": authMessages.recoveryLinkInvalid,
  "sessao-invalida": authMessages.recoverySessionInvalid,
};

export function resolveNotice(
  notices: Record<string, string>,
  key: string | string[] | undefined,
): string | undefined {
  return typeof key === "string" ? notices[key] : undefined;
}
