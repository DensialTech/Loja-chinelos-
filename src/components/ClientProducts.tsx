"use client";

import { motion, AnimatePresence } from "motion/react";
import { Input } from "@/components/ui/input";
import { ProductCard } from "@/components/ProductCard";
import { useProducts, FilterOptions } from "@/hooks/queries";
import { ProductType } from "@/types";
import { ErrorState } from "@/components/ErrorState";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ProductFilter } from "@/components/ProductFilter";
import { useMemo, useState } from "react";
import { normalizeText } from "@/lib/store/format";

const sortProducts = (products: ProductType[], sortBy: FilterOptions["sortBy"]) => {
  const sorted = [...products];
  switch (sortBy) {
    case "price-asc": return sorted.sort((a, b) => a.price - b.price);
    case "price-desc": return sorted.sort((a, b) => b.price - a.price);
    case "name-asc": return sorted.sort((a, b) => a.title.localeCompare(b.title, "pt-BR"));
    case "name-desc": return sorted.sort((a, b) => b.title.localeCompare(a.title, "pt-BR"));
    default: return sorted;
  }
};

const filterProducts = (products: ProductType[], filters: FilterOptions) => {
  let filtered = [...products];
  if (filters.stockFilter === "in-stock") filtered = filtered.filter((product) => (product.stock ?? 0) > 0);
  if (filters.stockFilter === "out-of-stock") filtered = filtered.filter((product) => (product.stock ?? 0) <= 0);
  return filtered;
};

export default function ClientProducts() {
  const { data: products = [], isLoading: loading, error, refetch: retry } = useProducts();
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<FilterOptions>({ sortBy: "default", stockFilter: "all", categoryFilter: "all" });

  const processedProducts = useMemo(() => {
    const query = normalizeText(searchTerm);
    let processed = products.filter((product) => {
      if (!query) return true;
      return normalizeText(product.title).includes(query) || normalizeText(product.description).includes(query);
    });
    processed = filterProducts(processed, filters);
    return sortProducts(processed, filters.sortBy);
  }, [products, searchTerm, filters]);

  const reset = () => {
    setFilters({ sortBy: "default", stockFilter: "all", categoryFilter: "all" });
    setSearchTerm("");
  };

  return (
    <ErrorBoundary>
      <div className="space-y-4">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mx-auto w-full max-w-xl">
          <Input type="search" placeholder="Buscar produtos..." value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} aria-label="Buscar produtos" />
        </motion.div>

        <ProductFilter filters={filters} onFilterChange={setFilters} />

        <div className="flex flex-col items-center justify-between gap-3 rounded-lg bg-muted/50 p-4 sm:flex-row">
          <span className="text-sm text-muted-foreground">
            Mostrando {processedProducts.length} de {products.length} produtos
          </span>
          {(filters.sortBy !== "default" || filters.stockFilter !== "all" || filters.categoryFilter !== "all" || searchTerm.trim()) && (
            <button onClick={reset} className="rounded px-3 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/10">
              Limpar filtros
            </button>
          )}
        </div>

        <div className="py-2">
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div key="loader" className="flex min-h-[240px] items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </motion.div>
            ) : error ? (
              <ErrorState title="Não foi possível carregar os produtos" description="Verifique sua conexão e tente novamente." onRetry={retry} error={error} type="network" />
            ) : processedProducts.length === 0 ? (
              <div className="py-16 text-center">
                <p className="text-lg font-semibold">{products.length === 0 ? "Nenhum produto disponível" : "Nenhum produto encontrado"}</p>
                <p className="mt-1 text-sm text-muted-foreground">{products.length === 0 ? "Volte em breve para conferir as novidades." : "Tente outra busca ou limpe os filtros."}</p>
                {products.length > 0 && <button onClick={reset} className="mt-4 rounded bg-primary px-4 py-2 text-sm text-primary-foreground">Limpar filtros</button>}
              </div>
            ) : (
              <motion.div key="products" className="grid grid-cols-2 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                {processedProducts.map((product) => <ProductCard key={product.product_id} product={product} />)}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </ErrorBoundary>
  );
}
