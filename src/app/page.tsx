import { Suspense } from "react";
import ClientProducts from "@/components/ClientProducts";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export default function Home() {
  return (
    <ErrorBoundary>
      <main className="min-h-screen bg-background">
        <section className="border-b bg-muted/30">
          <div className="container mx-auto px-4 py-10 text-center sm:py-14">
            <p className="text-sm font-semibold uppercase tracking-widest text-primary">Loja online</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-5xl">Encontre seu próximo par</h1>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground sm:text-base">
              Confira nossos produtos, escolha seu tamanho e cor e compre de forma simples e segura.
            </p>
          </div>
        </section>

        <section className="container mx-auto px-4 py-6 sm:py-8" aria-label="Produtos">
          <Suspense fallback={<div className="flex min-h-[240px] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>}>
            <ClientProducts />
          </Suspense>
        </section>
      </main>
    </ErrorBoundary>
  );
}
