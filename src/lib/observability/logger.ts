/**
 * Logger server-side mínimo do projeto.
 *
 * Fundação provider-agnostic: escreve um evento JSON por linha em
 * stdout/stderr, que qualquer plataforma de execução (local, Vercel ou outra)
 * pode capturar sem acoplamento a SDKs. Um provedor de observabilidade, se
 * adotado no futuro, deve ser plugado aqui (via `sink`), sem espalhar chamadas
 * específicas pelo código.
 *
 * Política de minimização (allow-list): apenas os campos declarados em
 * `LOG_CONTEXT_FIELDS` são serializados. Objetos de request, headers, cookies,
 * erros, usuário, claims ou `process.env` nunca devem ser passados ao logger.
 */

export type LogLevel = "info" | "warn" | "error";

/**
 * Contexto permitido em um evento de log. Todos os campos são opcionais e
 * limitados a primitivos. Não adicione aqui campos que possam carregar
 * segredos ou dados pessoais (e-mail, token, cookie, path concreto, body).
 */
export type LogContext = {
  /** Método HTTP (GET, POST...). */
  method?: string;
  /** Template da rota (ex.: `/app/area-restrita/page`), nunca o path concreto. */
  routePath?: string;
  /** Contexto do Next.js em que o erro ocorreu: render, route, action, proxy. */
  routeType?: string;
  /** App Router ou Pages Router. */
  routerKind?: string;
  /** Origem da renderização informada pelo Next.js. */
  renderSource?: string;
  /** Motivo de revalidação informado pelo Next.js. */
  revalidateReason?: string;
  /** Nome/tipo do erro (`error.name`). */
  errorName?: string;
  /** `digest` do Next.js/React; correlaciona com o identificador exibido ao cliente. */
  digest?: string;
  /** Código estável conhecido (ex.: `error.code` do Supabase Auth). */
  errorCode?: string;
  /** Status HTTP associado, quando existir. */
  status?: number;
  /**
   * Mensagem do erro. Só é registrada em `development` (ver `describeError`);
   * mensagens de dependências podem conter entradas do usuário.
   */
  errorMessage?: string;
};

export type LogEvent = {
  timestamp: string;
  level: LogLevel;
  event: string;
  environment: string;
} & LogContext;

/** Allow-list de campos serializáveis. Qualquer outra chave é descartada. */
const LOG_CONTEXT_FIELDS = [
  "method",
  "routePath",
  "routeType",
  "routerKind",
  "renderSource",
  "revalidateReason",
  "errorName",
  "digest",
  "errorCode",
  "status",
  "errorMessage",
] as const satisfies ReadonlyArray<keyof LogContext>;

/** Limite defensivo para valores de texto; evita despejar payloads longos. */
const MAX_STRING_LENGTH = 200;

export type LogSink = (level: LogLevel, line: string) => void;

export type Logger = {
  info(event: string, context?: LogContext): void;
  warn(event: string, context?: LogContext): void;
  error(event: string, context?: LogContext): void;
};

type LoggerOptions = {
  sink?: LogSink;
  environment?: () => string;
  now?: () => Date;
};

function truncate(value: string): string {
  return value.length > MAX_STRING_LENGTH ? `${value.slice(0, MAX_STRING_LENGTH)}…` : value;
}

function toSafePrimitive(value: unknown): string | number | boolean | undefined {
  if (typeof value === "string") {
    return truncate(value);
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : undefined;
  }

  if (typeof value === "boolean") {
    return value;
  }

  // undefined, null, objetos, arrays, funções, símbolos e bigint são descartados.
  return undefined;
}

/**
 * Seleciona somente os campos permitidos, coagindo cada valor a um primitivo
 * seguro e descartando `undefined`/não serializáveis.
 */
export function pickAllowedContext(context: LogContext | undefined): LogContext {
  const picked: Record<string, string | number | boolean> = {};

  if (!context || typeof context !== "object") {
    return picked;
  }

  for (const field of LOG_CONTEXT_FIELDS) {
    const value = toSafePrimitive((context as Record<string, unknown>)[field]);

    if (value !== undefined) {
      picked[field] = value;
    }
  }

  return picked;
}

/** `true` somente no servidor de desenvolvimento (`next dev`). */
export function isDevelopmentRuntime(): boolean {
  return process.env.NODE_ENV === "development";
}

function currentEnvironment(): string {
  return process.env.NODE_ENV ?? "development";
}

const consoleSink: LogSink = (level, line) => {
  if (level === "error") {
    console.error(line);
  } else if (level === "warn") {
    console.warn(line);
  } else {
    console.log(line);
  }
};

export function formatLogEvent(
  level: LogLevel,
  event: string,
  context: LogContext | undefined,
  options: Required<Pick<LoggerOptions, "environment" | "now">>,
): LogEvent {
  return {
    timestamp: options.now().toISOString(),
    level,
    event,
    environment: options.environment(),
    ...pickAllowedContext(context),
  };
}

export function createLogger(options: LoggerOptions = {}): Logger {
  const sink = options.sink ?? consoleSink;
  const environment = options.environment ?? currentEnvironment;
  const now = options.now ?? (() => new Date());

  const write = (level: LogLevel, event: string, context?: LogContext) => {
    const payload = formatLogEvent(level, event, context, { environment, now });

    sink(level, JSON.stringify(payload));
  };

  return {
    info: (event, context) => write("info", event, context),
    warn: (event, context) => write("warn", event, context),
    error: (event, context) => write("error", event, context),
  };
}

/** Logger padrão da aplicação (stdout/stderr). Uso exclusivo em código server-side. */
export const logger: Logger = createLogger();

/**
 * Extrai de um valor `unknown` apenas metadados seguros para diagnóstico:
 * nome do erro, `digest` e código conhecido. `message` é incluída somente em
 * desenvolvimento; `stack` nunca é registrada (o `next dev` já a exibe no
 * terminal e mensagens/stacks podem carregar entradas do usuário).
 */
export function describeError(error: unknown): LogContext {
  const context: LogContext = {};

  if (typeof error !== "object" || error === null) {
    context.errorName = typeof error;
    return context;
  }

  const candidate = error as { name?: unknown; digest?: unknown; code?: unknown; message?: unknown };

  context.errorName =
    typeof candidate.name === "string" && candidate.name.length > 0 ? candidate.name : "Error";

  if (typeof candidate.digest === "string") {
    context.digest = candidate.digest;
  }

  if (typeof candidate.code === "string") {
    context.errorCode = candidate.code;
  }

  if (isDevelopmentRuntime() && typeof candidate.message === "string") {
    context.errorMessage = candidate.message;
  }

  return context;
}
