'use server';

import { revalidatePath } from 'next/cache';
import { Buyer, BuyerSchema, PartialBuyerSchema } from './schema';
import {
  createLead as dbCreateLead,
  updateLead as dbUpdateLead,
  getLeads as dbGetLeads,
} from './data';
import { z } from 'zod';
import { getCurrentUser } from './auth';

type FormState = {
  success: boolean;
  error?: string;
  errors?: {
    row: number;
    errors: string[];
  }[];
  importedCount?: number;
  data?: any;
};

// CREATE LEAD
export async function createLead(data: Buyer): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: 'Unauthorized' };
  }

  const validatedFields = BuyerSchema.safeParse(data);
  if (!validatedFields.success) {
    return {
      success: false,
      error: 'Invalid fields. ' + JSON.stringify(validatedFields.error.flatten().fieldErrors),
    };
  }

  try {
    await dbCreateLead({ ...validatedFields.data, ownerId: user.id });
    revalidatePath('/buyers');
    return { success: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to create lead.';
    return { success: false, error: message };
  }
}

// UPDATE LEAD
export async function updateLead(data: Buyer): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: 'Unauthorized' };
  }
  
  const validatedFields = BuyerSchema.safeParse(data);
  if (!validatedFields.success) {
    return {
      success: false,
      error: 'Invalid fields: ' + JSON.stringify(validatedFields.error.flatten().fieldErrors),
    };
  }
  
  try {
    const result = await dbUpdateLead(validatedFields.data, user);
    if (!result.success) {
      return { success: false, error: result.error };
    }
    revalidatePath('/buyers');
    revalidatePath(`/buyers/${data.id}`);
    return { success: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to update lead.';
    return { success: false, error: message };
  }
}

// IMPORT LEADS
export async function importLeads(csvData: string): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: 'Unauthorized' };
  }

  const lines = csvData.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  const rows = lines.slice(1);

  if (rows.length > 200) {
    return { success: false, error: 'CSV file cannot exceed 200 rows.' };
  }

  const errors: { row: number; errors: string[] }[] = [];
  const validLeads: Buyer[] = [];

  for (const [index, line] of rows.entries()) {
    if (!line.trim()) continue; // Skip empty lines
    const values = line.split(',');
    const rowData: any = headers.reduce((obj, header, i) => {
      const value = values[i]?.trim();
      if (value !== undefined && value !== '') {
        if (header === 'tags') obj[header] = value.split(';').map(t => ({ value: t.trim() }));
        else if (header === 'budgetMin' || header === 'budgetMax') obj[header] = Number(value);
        else obj[header] = value;
      }
      return obj;
    }, {} as any);
    
    const fullLeadData = {
        ...rowData,
        ownerId: user.id,
        status: rowData.status || 'New',
    };

    const validationResult = PartialBuyerSchema.safeParse(fullLeadData);

    if (validationResult.success) {
        const fullValidation = BuyerSchema.safeParse(validationResult.data);
        if (fullValidation.success) {
            validLeads.push(fullValidation.data);
        } else {
            const fieldErrors = fullValidation.error.flatten().fieldErrors;
            const errorMessages = Object.entries(fieldErrors).map(([field, messages]) => `${field}: ${messages.join(', ')}`);
            errors.push({ row: index + 2, errors: errorMessages });
        }
    } else {
        const fieldErrors = validationResult.error.flatten().fieldErrors;
        const errorMessages = Object.entries(fieldErrors).map(([field, messages]) => `${field}: ${messages.join(', ')}`);
        errors.push({ row: index + 2, errors: errorMessages });
    }
  }

  // Transactional insert
  if (errors.length === 0 && validLeads.length > 0) {
    for (const lead of validLeads) {
      await dbCreateLead({ ...lead, ownerId: user.id });
    }
    revalidatePath('/buyers');
    return { success: true, errors: [], importedCount: validLeads.length };
  } else if (validLeads.length > 0 && errors.length > 0) {
    // This case implements partial import: only valid rows.
    // The prompt requires transactional insert which means all or nothing.
    // I am choosing all-or-nothing based on the prompt.
    return { success: false, error: "CSV contains errors. No leads were imported.", errors, importedCount: 0 };
  } else if (errors.length > 0) {
    return { success: false, error: "CSV contains errors. No leads were imported.", errors, importedCount: 0 };
  }

  return { success: true, errors: [], importedCount: 0 };
}


// EXPORT LEADS
export async function exportLeads(searchParams: string): Promise<FormState> {
  const params = new URLSearchParams(searchParams);
  const { leads } = await dbGetLeads({
    page: 1,
    limit: 1000, // Export limit
    sort: params.get('sort') || undefined,
    filters: {
      city: params.get('city') || undefined,
      propertyType: params.get('propertyType') || undefined,
      status: params.get('status') || undefined,
      timeline: params.get('timeline') || undefined,
      search: params.get('search') || undefined,
    },
  });

  if (leads.length === 0) {
    return { success: false, error: 'No leads found for the current filters.' };
  }
  
  const headers = [
    'id', 'fullName', 'email', 'phone', 'city', 'propertyType', 'bhk', 'purpose', 
    'budgetMin', 'budgetMax', 'timeline', 'source', 'status', 'notes', 'tags', 'ownerId', 'updatedAt'
  ];
  
  let csvContent = headers.join(',') + '\n';
  
  leads.forEach(lead => {
    const row = headers.map(header => {
      let value = lead[header as keyof Buyer];
      if (header === 'tags' && Array.isArray(value)) {
        return `"${(value as {value: string}[]).map(t => t.value).join(';')}"`;
      }
      if (typeof value === 'string' && value.includes(',')) {
        return `"${value}"`;
      }
      return value === null || value === undefined ? '' : value;
    });
    csvContent += row.join(',') + '\n';
  });
  
  return { success: true, data: csvContent };
}