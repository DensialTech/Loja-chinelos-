"use client";

import Image from "next/image";
import { ShoppingCart, Eye, Badge } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProductType } from "@/types";
import { useCart } from "@/context/CartContext";
import { useRouter } from "next/navigation";
import { formatBRL } from "@/lib/store/format";

interface ProductCardProps {
  product: ProductType;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart();
  const router = useRouter();
  const stock = Math.max(0, product.stock ?? 0);
  const inStock = stock > 0;

  const handleAddToCart = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (inStock) addToCart(product);
  };

  return (
    <Card
      className="group relative cursor-pointer overflow-hidden border-border/60 bg-card transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
      onClick={() => router.push(`/products/${product.product_id}`)}
    >
      <div className="relative aspect-square overflow-hidden bg-muted/30">
        {product.image ? (
          <Image
            src={product.image}
            alt={product.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <div className="text-center">
              <Badge className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" />
              <span className="text-xs font-medium text-muted-foreground/60">
                Sem imagem
              </span>
            </div>
          </div>
        )}

        {stock > 0 && stock <= 5 && (
          <span className="absolute bottom-2 left-2 rounded-md bg-background/90 px-2 py-1 text-xs font-medium shadow-sm">
            Últimas {stock} unidades
          </span>
        )}

        {!inStock && (
          <span className="absolute left-2 top-2 rounded-md bg-destructive px-2 py-1 text-xs font-semibold text-destructive-foreground">
            Esgotado
          </span>
        )}
      </div>

      <CardContent className="space-y-2 p-3">
        <div>
          <h3 className="line-clamp-1 text-sm font-semibold text-foreground transition-colors group-hover:text-primary">
            {product.title}
          </h3>
          <p className="line-clamp-2 text-xs text-muted-foreground">
            {product.description || "Confira os detalhes deste produto."}
          </p>
        </div>

        <div className="flex items-center justify-between gap-2">
          <span className="text-lg font-bold text-foreground">
            {formatBRL(product.price)}
          </span>
          <Button
            size="sm"
            onClick={handleAddToCart}
            disabled={!inStock}
            className="h-8 text-xs"
          >
            <ShoppingCart className="mr-1.5 h-3.5 w-3.5" />
            {inStock ? "Adicionar" : "Indisponível"}
          </Button>
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-full text-xs"
          onClick={(event) => {
            event.stopPropagation();
            router.push(`/products/${product.product_id}`);
          }}
        >
          <Eye className="mr-1.5 h-3.5 w-3.5" />
          Ver detalhes
        </Button>
      </CardContent>
    </Card>
  );
}
