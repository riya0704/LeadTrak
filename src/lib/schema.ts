import { z } from 'zod';
import {
  CityEnum,
  PropertyTypeEnum,
  BHKEnum,
  PurposeEnum,
  TimelineEnum,
  SourceEnum,
  StatusEnum,
} from './constants';

export const TagSchema = z.object({
  value: z.string(),
});

export const BaseBuyerSchema = z
  .object({
    id: z.string().uuid().optional(),
    fullName: z.string().min(2, 'Full name must be at least 2 characters.').max(80, 'Full name must be 80 characters or less.'),
    email: z.string().email('Invalid email address.').optional().or(z.literal('')),
    phone: z
      .string()
      .min(10, 'Phone number must be at least 10 digits.')
      .max(15, 'Phone number cannot exceed 15 digits.')
      .regex(/^\d+$/, 'Phone number must contain only digits.'),
    city: CityEnum,
    propertyType: PropertyTypeEnum,
    bhk: BHKEnum.optional(),
    purpose: PurposeEnum,
    budgetMin: z.number().int().positive('Budget must be a positive number.').optional(),
    budgetMax: z.number().int().positive('Budget must be a positive number.').optional(),
    timeline: TimelineEnum,
    source: SourceEnum,
    status: StatusEnum.default('New'),
    notes: z.string().max(1000, 'Notes cannot exceed 1000 characters.').optional(),
    tags: z.array(TagSchema).optional(),
    ownerId: z.string().optional(),
    updatedAt: z.string().optional(), // For concurrency control
  });

export const BuyerSchema = BaseBuyerSchema
  .refine(
    (data) => {
      if (
        (data.propertyType === 'Apartment' || data.propertyType === 'Villa') &&
        !data.bhk
      ) {
        return false;
      }
      return true;
    },
    {
      message: 'BHK is required for Apartments and Villas.',
      path: ['bhk'],
    }
  )
  .refine(
    (data) => {
      if (data.budgetMin && data.budgetMax && data.budgetMax < data.budgetMin) {
        return false;
      }
      return true;
    },
    {
      message: 'Max budget must be greater than or equal to min budget.',
      path: ['budgetMax'],
    }
  );

export type Buyer = z.infer<typeof BuyerSchema>;
export type PropertyType = z.infer<typeof PropertyTypeEnum>;

// A partial schema for imports where not all fields are required
export const PartialBuyerSchema = BaseBuyerSchema.partial().refine(
    (data) => data.fullName && data.phone, {
    message: "fullName and phone are required for import.",
});