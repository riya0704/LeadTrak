
import { Buyer, BuyerHistory, User } from './types';
import { v4 as uuidv4 } from 'uuid';
import { db } from './db';
import { buyers, buyerHistory as buyerHistoryTable, users } from './db/schema';
import { and, desc, eq, ilike, or, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { User as SupabaseUser } from '@supabase/supabase-js';


async function seedData(userId: string) {
  // Check if buyers exist, if not, create them
  const existingBuyersCountResult = await db.select({ count: sql<number>`count(*)` }).from(buyers);
  const existingBuyersCount = existingBuyersCountResult[0]?.count ?? 0;
  
  if (existingBuyersCount === 0) {
    console.log("No buyers found, seeding initial data...");
    const initialLeads: Omit<Buyer, 'id' | 'updatedAt' | 'ownerId'>[] = [
      {
        fullName: 'Aarav Sharma',
        email: 'aarav.sharma@email.com',
        phone: '9876543210',
        city: 'Chandigarh',
        propertyType: 'Apartment',
        bhk: '3',
        purpose: 'Buy',
        budgetMin: 7000000,
        budgetMax: 9000000,
        timeline: '3-6m',
        source: 'Website',
        status: 'New',
        notes: 'Looking for a spacious 3BHK in a prime location. Prefers gated communities.',
        tags: [{ value: 'family' }, { value: 'premium' }],
      },
      {
        fullName: 'Priya Patel',
        email: 'priya.patel@email.com',
        phone: '8765432109',
        city: 'Mohali',
        propertyType: 'Plot',
        purpose: 'Buy',
        budgetMin: 10000000,
        budgetMax: 15000000,
        timeline: '0-3m',
        source: 'Referral',
        status: 'Qualified',
        notes: 'Wants to invest in a residential plot for future construction. Good connectivity is a must.',
        tags: [{ value: 'investment' }],
      },
      {
        fullName: 'Rohan Mehta',
        email: 'rohan.mehta@email.com',
        phone: '7654321098',
        city: 'Zirakpur',
        propertyType: 'Office',
        purpose: 'Rent',
        budgetMin: 50000,
        budgetMax: 75000,
        timeline: '>6m',
        source: 'Call',
        status: 'Contacted',
        notes: 'Startup looking for a small office space. Needs to be furnished.',
        tags: [{ value: 'startup' }, { value: 'furnished' }],
      },
    ];

    for (const lead of initialLeads) {
        await createLead({ ...lead, ownerId: userId });
    }
    console.log("Seeding complete.");
  }
}

// This is a server-side "session" store for the demo.
// In a real app, this would be a secure, server-side session management system.
export async function getCurrentUser(): Promise<User | null> {
    const cookieStore = cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            get(name: string) {
              return cookieStore.get(name)?.value;
            },
          },
        }
    );
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
  const { id, ...updateData } = data;
  if (!id) {
    return { success: false, error: 'Lead ID is missing' };
  }
  
  const oldLead = await getLeadById(id);

  if (!oldLead) {
    return { success: false, error: 'Lead not found' };
  }

  // With Supabase RLS, the database will enforce ownership.
  // We can keep this check for a better UX, but RLS is the security boundary.
  if (user.role !== 'ADMIN' && oldLead.ownerId !== user.id) {
    return { success: false, error: 'You do not have permission to edit this lead.' };
  }

  if (data.updatedAt && new Date(oldLead.updatedAt).getTime() > new Date(data.updatedAt).getTime()) {
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
          id: uuidv4(),
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

  // Check if this is the very first user
  const existingUsersCountResult = await db.select({ count: sql<number>`count(*)` }).from(users);
  const isFirstUser = (existingUsersCountResult[0]?.count ?? 0) === 0;

  // Create a new user in our public.users table
  const newUser: User = {
    id: supabaseUser.id,
    name: supabaseUser.email?.split('@')[0] || 'New User',
    email: supabaseUser.email,
    // Make the first user an ADMIN
    role: isFirstUser ? 'ADMIN' : 'USER',
  };
  
  await db.insert(users).values(newUser).onConflictDoNothing();

  // If this is the first user, seed data for them.
  if (isFirstUser) {
      await seedData(newUser.id);
  }

  return newUser;
}
