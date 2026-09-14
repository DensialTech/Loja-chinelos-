'use client';

import { createContext, useContext, ReactNode, useEffect, useMemo, useState } from 'react';
import { ProductType, ProductVariantType } from '@/types';
import * as cartService from '@/services/cart/cartService';
import { toast } from 'sonner';
import { useAuth } from './AuthContext';

const STORAGE_KEY = 'densial-cart-v1';

export interface CartItem extends ProductType {
  quantity: number;
  cart_item_id?: number;
  variant?: ProductVariantType;
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (product: ProductType, variant?: ProductVariantType) => Promise<void>;
  removeFromCart: (productId: string, variantId?: string) => Promise<void>;
  updateQuantity: (productId: string, amount: number, variantId?: string) => Promise<void>;
  clearCart: () => Promise<void>;
  totalItems: number;
  subtotal: number;
  isLoading: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

function itemKey(productId: string, variantId?: string | null) {
  return `${productId}:${variantId ?? 'base'}`;
}

function calculateTotals(items: CartItem[]) {
  return {
    subtotal: items.reduce((sum, item) => sum + (item.variant?.price ?? item.price) * item.quantity, 0),
    totalItems: items.reduce((sum, item) => sum + item.quantity, 0),
  };
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCartId, setActiveCartId] = useState<number | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    let cancelled = false;
    async function loadCart() {
      setIsLoading(true);
      try {
        if (typeof window !== 'undefined') {
          const raw = window.localStorage.getItem(STORAGE_KEY);
          if (raw) {
            const parsed = JSON.parse(raw) as CartItem[];
            if (!cancelled && Array.isArray(parsed)) setCartItems(parsed);
          }
        }

        if (user) {
          const cart = await cartService.getOrCreateCart();
          if (cart) {
            const items = await cartService.getCartItems(cart.id);
            const formattedItems: CartItem[] = items.map((item) => ({
              ...item.product,
              quantity: item.quantity,
              cart_item_id: item.id,
              variant: item.variant,
            }));
            if (!cancelled) {
              setActiveCartId(cart.id);
              setCartItems(formattedItems);
            }
          }
        }
      } catch (error) {
        console.error('Erro ao carregar carrinho:', error);
        toast.error('Não foi possível carregar o carrinho.');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    loadCart();
    return () => { cancelled = true; };
  }, [user]);

  useEffect(() => {
    if (typeof window !== 'undefined' && !isLoading) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cartItems));
    }
  }, [cartItems, isLoading]);

  const totals = useMemo(() => calculateTotals(cartItems), [cartItems]);

  const addToCart = async (product: ProductType, variant?: ProductVariantType) => {
    const stock = variant?.stock ?? product.stock;
    if (stock <= 0) {
      toast.error('Este item está esgotado.');
      return;
    }

    const key = itemKey(product.product_id, variant?.id);
    const existing = cartItems.find((item) => itemKey(item.product_id, item.variant?.id) === key);
    if (existing && existing.quantity >= stock) {
      toast.error('Quantidade máxima disponível em estoque.');
      return;
    }

    if (user) {
      try {
        let cartId = activeCartId;
        if (!cartId) {
          const cart = await cartService.createCart();
          cartId = cart?.id ?? null;
          if (cartId) setActiveCartId(cartId);
        }
        if (cartId) {
          const result = await cartService.addItemToCart(cartId, product.product_id, variant?.price ?? product.price, 1);
          if (result) {
            setCartItems((prev) => existing
              ? prev.map((item) => itemKey(item.product_id, item.variant?.id) === key ? { ...item, quantity: item.quantity + 1, cart_item_id: result.id } : item)
              : [...prev, { ...product, quantity: 1, cart_item_id: result.id, variant }]
            );
            toast.success('Adicionado ao carrinho.');
            return;
          }
        }
      } catch (error) {
        console.error('Erro ao salvar carrinho:', error);
      }
    }

    setCartItems((prev) => existing
      ? prev.map((item) => itemKey(item.product_id, item.variant?.id) === key ? { ...item, quantity: item.quantity + 1 } : item)
      : [...prev, { ...product, quantity: 1, variant }]
    );
    toast.success('Adicionado ao carrinho.');
  };

  const removeFromCart = async (productId: string, variantId?: string) => {
    const item = cartItems.find((entry) => itemKey(entry.product_id, entry.variant?.id) === itemKey(productId, variantId));
    if (item?.cart_item_id) {
      try { await cartService.removeCartItem(item.cart_item_id); } catch (error) { console.error(error); }
    }
    setCartItems((prev) => prev.filter((entry) => itemKey(entry.product_id, entry.variant?.id) !== itemKey(productId, variantId)));
  };

  const updateQuantity = async (productId: string, amount: number, variantId?: string) => {
    const key = itemKey(productId, variantId);
    const item = cartItems.find((entry) => itemKey(entry.product_id, entry.variant?.id) === key);
    if (!item) return;
    const newQuantity = item.quantity + amount;
    if (newQuantity <= 0) return removeFromCart(productId, variantId);
    const stock = item.variant?.stock ?? item.stock;
    if (newQuantity > stock) {
      toast.error('Quantidade máxima disponível em estoque.');
      return;
    }
    if (item.cart_item_id) {
      try { await cartService.updateCartItemQuantity(item.cart_item_id, newQuantity); } catch (error) { console.error(error); }
    }
    setCartItems((prev) => prev.map((entry) => itemKey(entry.product_id, entry.variant?.id) === key ? { ...entry, quantity: newQuantity } : entry));
  };

  const clearCart = async () => {
    if (activeCartId) {
      try { await cartService.clearCart(activeCartId); } catch (error) { console.error(error); }
    }
    setCartItems([]);
    toast.success('Carrinho esvaziado.');
  };

  return (
    <CartContext.Provider value={{ ...totals, cartItems, addToCart, removeFromCart, updateQuantity, clearCart, isLoading }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
}
