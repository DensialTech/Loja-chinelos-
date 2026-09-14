"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/CartContext";
import ShoppingSkeleton from "@/components/ShoppingSkeleton";

const formatBRL = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

export default function CartShoppingPage() {
  const { cartItems, removeFromCart, updateQuantity, subtotal, totalItems, isLoading } = useCart();

  if (isLoading) return <ShoppingSkeleton />;

  return (
    <div className="container mx-auto max-w-6xl p-4 sm:p-6">
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <Link href="/" className="flex items-center text-sm text-primary hover:underline">
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para a loja
        </Link>
        <h1 className="text-2xl font-bold sm:text-3xl">Seu carrinho</h1>
      </div>

      {cartItems.length === 0 ? (
        <Card className="mx-auto max-w-lg">
          <CardContent className="flex flex-col items-center p-10 text-center">
            <ShoppingBag className="mb-4 h-12 w-12 text-muted-foreground" />
            <h2 className="mb-2 text-xl font-semibold">Seu carrinho está vazio</h2>
            <p className="mb-6 text-sm text-muted-foreground">Adicione produtos para continuar sua compra.</p>
            <Link href="/"><Button>Continuar comprando</Button></Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="space-y-4 md:col-span-2">
            {cartItems.map((item) => {
              const variantId = item.variant?.id;
              const unitPrice = item.variant?.price ?? item.price;
              const stock = item.variant?.stock ?? item.stock;
              return (
                <Card key={`${item.product_id}:${variantId ?? "base"}`}>
                  <CardContent className="flex gap-4 p-4">
                    <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-md bg-muted sm:h-28 sm:w-28">
                      {item.image ? <Image src={item.image} alt={item.title} fill sizes="112px" className="object-cover" /> : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex justify-between gap-3">
                        <div>
                          <h2 className="font-semibold">{item.title}</h2>
                          {item.variant && (
                            <p className="mt-1 text-sm text-muted-foreground">
                              {item.variant.size ? `Tamanho: ${item.variant.size}` : ""}
                              {item.variant.size && item.variant.color ? " • " : ""}
                              {item.variant.color ? `Cor: ${item.variant.color}` : ""}
                            </p>
                          )}
                        </div>
                        <button aria-label="Remover produto" onClick={() => removeFromCart(item.product_id, variantId)} className="text-destructive hover:opacity-80">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <p className="mt-2 font-semibold">{formatBRL(unitPrice)}</p>
                      <div className="mt-3 flex items-center gap-2">
                        <Button size="icon" variant="outline" onClick={() => updateQuantity(item.product_id, -1, variantId)} aria-label="Diminuir quantidade"><Minus className="h-4 w-4" /></Button>
                        <span className="w-8 text-center font-medium">{item.quantity}</span>
                        <Button size="icon" variant="outline" disabled={item.quantity >= stock} onClick={() => updateQuantity(item.product_id, 1, variantId)} aria-label="Aumentar quantidade"><Plus className="h-4 w-4" /></Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Card className="h-fit md:sticky md:top-4">
            <CardHeader><CardTitle>Resumo do pedido</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm"><span>Produtos ({totalItems})</span><span>{formatBRL(subtotal)}</span></div>
              <div className="flex justify-between text-sm"><span>Frete</span><span className="text-muted-foreground">Calculado no checkout</span></div>
              <div className="flex justify-between border-t pt-4 text-lg font-bold"><span>Subtotal</span><span>{formatBRL(subtotal)}</span></div>
            </CardContent>
            <CardFooter>
              <Link href="/checkout" className="w-full"><Button className="w-full">Continuar para checkout</Button></Link>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
}
