import { Buyer, BuyerHistory, User } from './types';
import { v4 as uuidv4 } from 'uuid';
import { db } from './db';
import { buyers, buyerHistory as buyerHistoryTable, users } from './db/schema';
import { and, desc, eq, ilike, or, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { supabase } from './supabase/client';
import type { User as SupabaseUser } from '@supabase/supabase-js';


async function seedData() {
    // Check if users exist, if not, create them
    const existingUsers = await db.select().from(users);
    if (existingUsers.length === 0) {
        // With Supabase auth, we don't need to seed users this way.
        // Users will be created in the 'auth.users' table upon signup.
        // We might need to handle profile creation via triggers later.
    }
  
    // Check if buyers exist, if not, create them
    const existingBuyersCount = await db.select({ count: sql<number>`count(*)` }).from(buyers);
    if (existingBuyersCount[0].count === 0) {
        const adminUser = { id: 'admin-user-id', name: 'Admin User', role: 'ADMIN' as const };
        const standardUser = { id: 'standard-user-id', name: 'Standard User', role: 'USER' as const };

        // For seeding, we'll need some user IDs. In a real scenario, these would
        // come from your actual Supabase users. For now, we can't be sure what the IDs
        // will be, so we can't reliably seed data owned by specific users.
        // We will make all seeded data owned by a placeholder or skip ownership for seeds.
        // Or, we check for a user from supabase and assign it.
        // For this demo, let's assume we can't know the user ID, so we can't seed.
        console.log("Database is empty, but cannot seed without a logged-in user to own the data.");
    }
}

// Seed only if db is empty
// seedData().catch(console.error);

// This is a server-side "session" store for the demo.
// In a real app, this would be a secure, server-side session management system.
export async function getCurrentUser(): Promise<User | null> {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const appUser = await getUserById(session.user.id);
      return appUser || null;
    }
    return null;
}

export async function getLeads({
  page = 1,
  limit = 10,
  sort = 'updatedAt:desc',
  filters,
}: {
  page?: number;
  limit?: number;
  sort?: string;
  filters?: { [key: string]: string | undefined };
}) {
  const whereClauses = [];
  if (filters) {
    if (filters.city) {
      whereClauses.push(eq(buyers.city, filters.city));
    }
    if (filters.propertyType) {
      whereClauses.push(eq(buyers.propertyType, filters.propertyType));
    }
    if (filters.status) {
      whereClauses.push(eq(buyers.status, filters.status));
    }
    if (filters.timeline) {
      whereClauses.push(eq(buyers.timeline, filters.timeline));
    }
    if (filters.search) {
      const searchTerms = filters.search.toLowerCase().split(' ').filter(Boolean);
      const searchClauses = searchTerms.map(term => or(
        ilike(buyers.fullName, `%${term}%`),
        ilike(buyers.email, `%${term}%`),
        ilike(buyers.phone, `%${term}%`)
      ));
      whereClauses.push(...searchClauses);
    }
  }

  const [sortField, sortOrder] = sort.split(':') as [keyof Buyer, 'asc' | 'desc'];
  
  const query = db.select().from(buyers)
    .where(and(...whereClauses))
    .limit(limit)
    .offset((page - 1) * limit)
    .orderBy(sortOrder === 'asc' ? buyers[sortField] : desc(buyers[sortField]));

  const totalQuery = db.select({ count: sql<number>`count(*)` }).from(buyers).where(and(...whereClauses));

  const [leads, totalResult] = await Promise.all([query, totalQuery]);
  
  const total = totalResult[0].count;

  return { leads: leads.map(l => ({...l, updatedAt: l.updatedAt.toISOString()})), total };
}

export async function getLeadById(id: string): Promise<Buyer | undefined> {
  const result = await db.select().from(buyers).where(eq(buyers.id, id));
  if (result.length === 0) return undefined;
  const lead = result[0];
  return {...lead, updatedAt: lead.updatedAt.toISOString() };
}

export async function createLead(data: Omit<Buyer, 'id' | 'updatedAt'>): Promise<Buyer> {
  const newLead: Omit<Buyer, 'id' | 'updatedAt'> & {id: string, updatedAt: Date} = {
    ...data,
    id: uuidv4(),
    updatedAt: new Date(),
  };

  const [inserted] = await db.insert(buyers).values(newLead).returning();
  return {...inserted, updatedAt: inserted.updatedAt.toISOString()};
}

export async function updateLead(data: Buyer, user: User): Promise<{success: boolean, error?: string}> {
  const { id, updatedAt, ...updateData } = data;
  
  const [oldLead] = await db.select().from(buyers).where(eq(buyers.id, id));

  if (!oldLead) {
    return { success: false, error: 'Lead not found' };
  }

  // With Supabase RLS, the database will enforce ownership.
  // We can keep this check for a better UX, but RLS is the security boundary.
  if (user.role !== 'ADMIN' && oldLead.ownerId !== user.id) {
    return { success: false, error: 'You do not have permission to edit this lead.' };
  }

  if (updatedAt && new Date(oldLead.updatedAt).getTime() > new Date(updatedAt).getTime()) {
    return { success: false, error: 'This record has been updated by someone else. Please refresh and try again.' };
  }

  const newUpdatedAt = new Date();
  const [updated] = await db.update(buyers)
    .set({ ...updateData, updatedAt: newUpdatedAt })
    .where(eq(buyers.id, id))
    .returning();

  const diff: Record<string, [any, any]> = {};
  (Object.keys(updateData) as Array<keyof typeof updateData>).forEach(key => {
      if(key !== 'updatedAt' && key !== 'id' && JSON.stringify(oldLead[key]) !== JSON.stringify(updated[key])){
          diff[key] = [oldLead[key], updated[key]];
      }
  });

  if (Object.keys(diff).length > 0) {
      await db.insert(buyerHistoryTable).values({
          buyerId: id,
          changedAt: newUpdatedAt,
          changedBy: { id: user.id, name: user.name, role: user.role },
          diff: diff
      });
  }

  return { success: true };
}

export async function getLeadHistory(buyerId: string, limit: number = 5): Promise<BuyerHistory[]> {
    const history = await db.select()
        .from(buyerHistoryTable)
        .where(eq(buyerHistoryTable.buyerId, buyerId))
        .orderBy(desc(buyerHistoryTable.changedAt))
        .limit(limit);
    
    return history.map(h => ({ ...h, changedAt: h.changedAt.toISOString()}));
}

export async function getUserById(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    if (result.length > 0) {
      return result[0];
    }
    return undefined;
}

export async function getOrCreateAppUser(supabaseUser: SupabaseUser): Promise<User> {
  const existingUser = await getUserById(supabaseUser.id);
  if (existingUser) {
    return existingUser;
  }

  // Create a new user in our public.users table
  const newUser: User = {
    id: supabaseUser.id,
    name: supabaseUser.email || 'New User',
    email: supabaseUser.email,
    role: 'USER',
  };
  
  await db.insert(users).values(newUser).onConflictDoNothing();

  return newUser;
}
