#!/usr/bin/env node
/**
 * Verificação determinística contra marcadores de segredo em arquivos
 * versionados. Complementa (não substitui) o secret scanning/push protection
 * do GitHub, revisão de PR e `.gitignore`.
 *
 * Só considera arquivos rastreados pelo Git (`git ls-files`), portanto nunca
 * inspeciona `.env.local` e similares. Padrões exigem comprimento mínimo para
 * não acusar menções documentais como "sb_secret_".
 */
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const PATTERNS = [
  { name: "Supabase secret key", regex: /sb_secret_[A-Za-z0-9_-]{20,}/ },
  { name: "JWT (possível service_role/anon legado)", regex: /eyJ[A-Za-z0-9_-]{20,}\.eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}/ },
  { name: "Chave privada PEM", regex: /-----BEGIN [A-Z ]*PRIVATE KEY-----/ },
  { name: "Token GitHub", regex: /\bgh[pousr]_[A-Za-z0-9]{30,}\b/ },
  { name: "Token Vercel/Supabase CLI", regex: /\bsbp_[a-f0-9]{30,}\b/ },
];

const IGNORED_FILES = new Set(["package-lock.json"]);

const trackedFiles = execFileSync("git", ["ls-files", "-z"], { encoding: "utf8" })
  .split("\0")
  .filter((file) => file.length > 0 && !IGNORED_FILES.has(file));

const findings = [];

for (const file of trackedFiles) {
  let content;

  try {
    content = readFileSync(file, "utf8");
  } catch {
    continue;
  }

  if (content.includes("\u0000")) {
    continue; // binário
  }

  const lines = content.split("\n");

  lines.forEach((line, index) => {
    for (const pattern of PATTERNS) {
      if (pattern.regex.test(line)) {
        // Nunca imprimir o valor: apenas arquivo, linha e tipo do padrão.
        findings.push(`${file}:${index + 1}: possível ${pattern.name}`);
      }
    }
  });
}

if (findings.length > 0) {
  console.error("Marcadores de segredo encontrados em arquivos versionados:");
  for (const finding of findings) {
    console.error(`  - ${finding}`);
  }
  console.error("Remova o valor, revogue/rotacione a credencial e use variáveis de ambiente.");
  process.exit(1);
}

console.log(`check-secret-markers: nenhum marcador encontrado em ${trackedFiles.length} arquivos.`);
