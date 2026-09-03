#!/usr/bin/env node
/**
 * Verificação determinística do fim de linha dos arquivos versionados.
 *
 * O `.gitattributes` normaliza texto para LF no índice; este script confirma
 * que a normalização de fato ocorreu, evitando que um arquivo com CRLF entre
 * no repositório e torne a reprodução do banco e do build dependente do
 * sistema operacional de quem contribui.
 *
 * Só inspeciona o que o Git rastreia (`git ls-files --eol`) e considera apenas
 * o estado do índice (`i/`), não o da árvore de trabalho (`w/`): em Windows é
 * legítimo que a cópia local esteja com CRLF.
 */
import { execFileSync } from "node:child_process";

const INVALID_INDEX_EOL = new Set(["crlf", "mixed"]);

const records = execFileSync("git", ["ls-files", "--eol", "-z"], { encoding: "utf8" })
  .split("\0")
  .filter((record) => record.length > 0);

const findings = [];

for (const record of records) {
  const separator = record.indexOf("\t");

  if (separator === -1) {
    continue;
  }

  const attributes = record.slice(0, separator);
  const file = record.slice(separator + 1);
  const indexEol = attributes.trim().split(/\s+/)[0]?.replace(/^i\//, "");

  if (indexEol && INVALID_INDEX_EOL.has(indexEol)) {
    findings.push(`${file}: fim de linha ${indexEol.toUpperCase()} no índice`);
  }
}

if (findings.length > 0) {
  console.error("Arquivos versionados com fim de linha inesperado:");
  for (const finding of findings) {
    console.error(`  - ${finding}`);
  }
  console.error("Renormalize com `git add --renormalize .` e confirme com `git ls-files --eol`.");
  process.exit(1);
}

console.log(`check-line-endings: ${records.length} arquivos rastreados com fim de linha esperado.`);
