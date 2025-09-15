import { z } from 'zod';

export const CityOptions = [
  'Chandigarh',
  'Mohali',
  'Zirakpur',
  'Panchkula',
  'Other',
] as const;
export const CityEnum = z.enum(CityOptions);

export const PropertyTypeOptions = [
  'Apartment',
  'Villa',
  'Plot',
  'Office',
  'Retail',
] as const;
export const PropertyTypeEnum = z.enum(PropertyTypeOptions);

export const BHKOptions = ['1', '2', '3', '4', 'Studio'] as const;
export const BHKEnum = z.enum(BHKOptions);

export const PurposeOptions = ['Buy', 'Rent'] as const;
export const PurposeEnum = z.enum(PurposeOptions);

export const TimelineOptions = ['0-3m', '3-6m', '>6m', 'Exploring'] as const;
export const TimelineEnum = z.enum(TimelineOptions);

export const SourceOptions = [
  'Website',
  'Referral',
  'Walk-in',
  'Call',
  'Other',
] as const;
export const SourceEnum = z.enum(SourceOptions);

export const StatusOptions = [
  'New',
  'Qualified',
  'Contacted',
  'Visited',
  'Negotiation',
  'Converted',
  'Dropped',
] as const;
export const StatusEnum = z.enum(StatusOptions);
