import { z } from 'zod';
import {
  CityEnum,
  PropertyTypeEnum,
  BHKEnum,
  PurposeEnum,
  TimelineEnum,
  SourceEnum,
  StatusEnum,
  BuyerSchema,
  TagSchema,
} from './schema';

export type City = z.infer<typeof CityEnum>;
export type PropertyType = z.infer<typeof PropertyTypeEnum>;
export type BHK = z.infer<typeof BHKEnum>;
export type Purpose = z.infer<typeof PurposeEnum>;
export type Timeline = z.infer<typeof TimelineEnum>;
export type Source = z.infer<typeof SourceEnum>;
export type Status = z.infer<typeof StatusEnum>;
export type Tag = z.infer<typeof TagSchema>;

export type Buyer = z.infer<typeof BuyerSchema> & { id: string, updatedAt: string };

export type User = {
  id: string;
  name: string;
  role: 'USER' | 'ADMIN';
};

export type BuyerHistory = {
    id: string;
    buyerId: string;
    changedBy: Pick<User, 'id' | 'name' | 'role'>;
    changedAt: string;
    diff: Record<string, [any, any]>;
}
