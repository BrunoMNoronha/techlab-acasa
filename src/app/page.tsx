const repositoryUrl = "https://github.com/BrunoMNoronha/techlab-acasa";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto w-full max-w-3xl px-6 py-4">
          <p className="text-sm font-semibold tracking-wide text-zinc-700 dark:text-zinc-300">
            TechLab+ ACASA
          </p>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center gap-6 px-6 py-16">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          TechLab+ ACASA
        </h1>
        <p className="text-lg leading-8 text-zinc-700 dark:text-zinc-300">
          Sistema de gestão da ACASA para a administração da associação e o
          relacionamento com seus associados.
        </p>
        <p className="text-base leading-7 text-zinc-600 dark:text-zinc-400">
          A aplicação está em construção. Esta página confirma que a fundação
          técnica está em execução; as funcionalidades serão adicionadas de
          forma incremental.
        </p>
        <p>
          <a
            href={repositoryUrl}
            className="inline-flex min-h-11 items-center rounded-md border border-zinc-300 px-4 py-2 text-base font-medium text-zinc-900 underline-offset-4 transition-colors hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-900 dark:focus-visible:outline-zinc-100"
          >
            Documentação do projeto
          </a>
        </p>
      </main>

      <footer className="border-t border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto w-full max-w-3xl px-6 py-4 text-sm text-zinc-600 dark:text-zinc-400">
          TechLab+ ACASA — sistema de gestão da ACASA
        </div>
      </footer>
    </div>
  );
}
