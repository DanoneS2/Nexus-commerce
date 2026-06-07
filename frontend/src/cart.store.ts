import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { api } from '@/lib/api';

export interface CartItem {
  productId: string;
  variantId?: string;
  quantity: number;
  product?: {
    id: string;
    name: string | Record<string, string>;
    slug: string;
    basePrice: number;
    images: Array<{ url: string }>;
  };
  variant?: {
    id: string;
    name: string;
    price: number;
    sku: string;
  };
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  isLoading: boolean;
  couponCode: string | null;
  couponDiscount: number;

  // Actions
  setItems: (items: CartItem[]) => void;
  addItem: (item: { productId: string; variantId?: string; quantity?: number }) => void;
  removeItem: (productId: string, variantId?: string) => void;
  updateQuantity: (productId: string, variantId: string | undefined, quantity: number) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  applyCoupon: (code: string) => Promise<void>;
  removeCoupon: () => void;
  syncWithServer: () => Promise<void>;

  // Computed
  totalItems: () => number;
  subtotal: () => number;
  total: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      isLoading: false,
      couponCode: null,
      couponDiscount: 0,

      setItems: (items) => set({ items }),

      addItem: (newItem) => {
        set((state) => {
          const existing = state.items.find(
            (i) => i.productId === newItem.productId && i.variantId === newItem.variantId
          );

          if (existing) {
            return {
              items: state.items.map((i) =>
                i.productId === newItem.productId && i.variantId === newItem.variantId
                  ? { ...i, quantity: i.quantity + (newItem.quantity || 1) }
                  : i
              ),
            };
          }

          return {
            items: [...state.items, { ...newItem, quantity: newItem.quantity || 1 }],
          };
        });

        // Sync to server if authenticated
        get().syncWithServer().catch(() => {});
      },

      removeItem: (productId, variantId) => {
        set((state) => ({
          items: state.items.filter(
            (i) => !(i.productId === productId && i.variantId === variantId)
          ),
        }));
        get().syncWithServer().catch(() => {});
      },

      updateQuantity: (productId, variantId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId, variantId);
          return;
        }
        set((state) => ({
          items: state.items.map((i) =>
            i.productId === productId && i.variantId === variantId
              ? { ...i, quantity }
              : i
          ),
        }));
        get().syncWithServer().catch(() => {});
      },

      clearCart: () => {
        set({ items: [], couponCode: null, couponDiscount: 0 });
      },

      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set((s) => ({ isOpen: !s.isOpen })),

      applyCoupon: async (code) => {
        set({ isLoading: true });
        try {
          const { data } = await api.post('/coupons/validate', {
            code,
            subtotal: get().subtotal(),
          });
          set({
            couponCode: code,
            couponDiscount: data.discountAmount,
          });
        } finally {
          set({ isLoading: false });
        }
      },

      removeCoupon: () => set({ couponCode: null, couponDiscount: 0 }),

      syncWithServer: async () => {
        try {
          const items = get().items;
          if (items.length === 0) return;
          await api.put('/cart/sync', { items });
        } catch {
          // Silent fail — local cart is source of truth when offline
        }
      },

      // Computed values
      totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),

      subtotal: () =>
        get().items.reduce((sum, i) => {
          const price = i.variant?.price ?? i.product?.basePrice ?? 0;
          return sum + price * i.quantity;
        }, 0),

      total: () => {
        const subtotal = get().subtotal();
        const discount = get().couponDiscount;
        return Math.max(0, subtotal - discount);
      },
    }),
    {
      name: 'nexus-cart',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        items: state.items,
        couponCode: state.couponCode,
        couponDiscount: state.couponDiscount,
      }),
    }
  )
);
