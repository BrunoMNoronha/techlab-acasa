import type { Instrumentation } from "next";
import { logger } from "@/lib/observability/logger";
import { REQUEST_ERROR_EVENT, buildRequestErrorContext } from "@/lib/observability/request-error";

/**
 * Captura central de erros inesperados do servidor (Server Components, Route
 * Handlers, Server Actions e Proxy), conforme a convenção `instrumentation.ts`
 * do Next.js. Encaminha ao logger apenas metadados seguros; o objeto `request`
 * (path com query string e headers/cookies) nunca é repassado.
 *
 * `register()` não é exportado por não existir inicialização com uso concreto
 * nesta fase (nenhum provedor externo de observabilidade).
 */
export const onRequestError: Instrumentation.onRequestError = (error, request, context) => {
  logger.error(REQUEST_ERROR_EVENT, buildRequestErrorContext(error, request, context));
};
