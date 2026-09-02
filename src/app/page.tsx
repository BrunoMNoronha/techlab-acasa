export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-16 text-slate-950 sm:px-10 lg:px-16">
      <section
        aria-labelledby="page-title"
        className="mx-auto flex min-h-[70vh] max-w-5xl flex-col justify-center"
      >
        <p className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-slate-600">
          TechLab+ ACASA
        </p>

        <h1
          id="page-title"
          className="max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl"
        >
          Fundação técnica pronta para evoluir.
        </h1>

        <p className="mt-6 max-w-2xl text-lg text-slate-700">
          Esta aplicação inicia a base executável do sistema de gestão da ACASA,
          sem antecipar regras de negócio ainda não implementadas.
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Foco atual</h2>
            <p className="mt-2 text-slate-600">
              Qualidade de código, testes, acessibilidade e uma estrutura simples
              para crescimento incremental.
            </p>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Próximo passo</h2>
            <p className="mt-2 text-slate-600">
              Evoluir banco, autenticação e módulos somente conforme requisitos e
              decisões versionados no repositório.
            </p>
          </article>
        </div>
      </section>
    </main>
  );
}
