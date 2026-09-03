import { describeError, type LogContext } from "./logger";

/**
 * Subconjunto do contrato de `Instrumentation.onRequestError` do Next.js
 * consumido por esta aplicação. Declarado localmente para que o mapeamento
 * seja testável sem depender do tipo completo (que inclui `headers`).
 */
export type RequestErrorRequest = Readonly<{
  method: string;
}>;

export type RequestErrorContext = Readonly<{
  routerKind: string;
  routePath: string;
  routeType: string;
  renderSource?: string;
  revalidateReason?: string;
}>;

export const REQUEST_ERROR_EVENT = "server.request_error";

/**
 * Seleciona somente campos seguros do erro capturado pelo servidor Next.js.
 *
 * Deliberadamente NÃO usa `request.path` (contém query string e identificadores
 * dinâmicos) nem `request.headers` (cookies, Authorization). O template
 * `context.routePath` é suficiente para diagnóstico.
 */
export function buildRequestErrorContext(
  error: unknown,
  request: RequestErrorRequest,
  context: RequestErrorContext,
): LogContext {
  return {
    ...describeError(error),
    method: request.method,
    routePath: context.routePath,
    routeType: context.routeType,
    routerKind: context.routerKind,
    renderSource: context.renderSource,
    revalidateReason: context.revalidateReason,
  };
}
