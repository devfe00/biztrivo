import { z } from 'zod';

export const cartItemSchema = z.object({
  key: z.string().min(1).max(80),
  productId: z.string().min(1).max(200),
  variantId: z.string().min(1).max(80).optional(),
  quantity: z.number().int().positive().max(1_000_000),
  value: z.number().positive().finite().max(100_000_000),
  label: z.string().max(300),
});

export type CartItem = z.infer<typeof cartItemSchema>;

export const caixaDraftSchema = z.object({
  version: z.literal(1),
  cart: z.array(cartItemSchema).max(50),
  value: z.string().max(40),
  description: z.string().max(500),
  category: z.string().max(40),
  selectedProductId: z.string().max(200),
  selectedVariantId: z.string().max(80),
  quantity: z.number().int().positive().max(1_000_000),
  isPersonal: z.boolean(),
});

export type CaixaDraft = z.infer<typeof caixaDraftSchema>;

export const caixaDraftKey = (uid: string) => `biztrivo:caixa_draft:${uid}`;

export function parseCaixaDraft(raw: unknown): CaixaDraft | null {
  const result = caixaDraftSchema.safeParse(raw);
  return result.success ? result.data : null;
}