import { z } from 'zod';

export const slideSchema = z.object({
  url: z.url(),
  caption: z.string().max(200).optional(),
  clickUrl: z.url().optional().or(z.literal('')),
});

const baseAdSchema = z.object({
  title: z.string().min(1).max(120),
  caption: z.string().max(200).optional().or(z.literal('')),
  clickUrl: z.url().optional().or(z.literal('')),
  isActive: z.boolean().optional(),
  displayOrder: z.number().int().min(0).optional(),
});

export const createSingleAdSchema = baseAdSchema.extend({
  kind: z.literal('single'),
  mediaType: z.enum(['image', 'video']),
  mediaUrl: z.url(),
});

export const createCarouselAdSchema = baseAdSchema.extend({
  kind: z.literal('carousel'),
  slides: z.array(slideSchema).min(1, 'Carousel needs at least one slide').max(20),
});

export const createAdSchema = z.discriminatedUnion('kind', [createSingleAdSchema, createCarouselAdSchema]);

export const updateAdSchema = z
  .object({
    title: z.string().min(1).max(120).optional(),
    caption: z.string().max(200).optional().or(z.literal('')),
    clickUrl: z.url().optional().or(z.literal('')),
    mediaType: z.enum(['image', 'video']).optional(),
    mediaUrl: z.url().optional(),
    slides: z.array(slideSchema).min(1).max(20).optional(),
    isActive: z.boolean().optional(),
    displayOrder: z.number().int().min(0).optional(),
  })
  .refine((d) => Object.keys(d).length > 0, { message: 'Nothing to update' });

export type CreateAdPayload = z.infer<typeof createAdSchema>;
export type UpdateAdPayload = z.infer<typeof updateAdSchema>;
export type SlidePayload = z.infer<typeof slideSchema>;
