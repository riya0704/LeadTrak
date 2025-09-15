import { Buyer, BuyerHistory, User } from './types';
import { v4 as uuidv4 } from 'uuid';
import { db } from './db';
import { buyers, buyerHistory as buyerHistoryTable, users } from './db/schema';
import { and, desc, eq, ilike, or, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';

async function seedData() {
    // Check if users exist, if not, create them
    const existingUsers = await db.select().from(users);
    if (existingUsers.length === 0) {
        await db.insert(users).values([
            { id: 'standard-user-id', name: 'Standard User', role: 'USER' },
            { id: 'admin-user-id', name: 'Admin User', role: 'ADMIN' },
        ]);
    }
  
    // Check if buyers exist, if not, create them
    const existingBuyers = await db.select().from(buyers);
    if (existingBuyers.length === 0) {
        await db.insert(buyers).values([
            {
                id: '1',
                fullName: 'Aarav Sharma',
                email: 'aarav.sharma@email.com',
                phone: '9876543210',
                city: 'Chandigarh',
                propertyType: 'Apartment',
                bhk: '3',
                purpose: 'Buy',
                budgetMin: 8000000,
                budgetMax: 10000000,
                timeline: '0-3m',
                source: 'Website',
                status: 'New',
                notes: 'Looking for a spacious apartment in a prime location.',
                tags: [{value: 'urgent'}, {value: 'family'}],
                ownerId: 'standard-user-id',
                updatedAt: new Date('2023-10-26T10:00:00Z'),
            },
            {
                id: '2',
                fullName: 'Priya Patel',
                phone: '8765432109',
                email: 'priya.patel@email.com',
                city: 'Mohali',
                propertyType: 'Villa',
                bhk: '4',
                purpose: 'Buy',
                budgetMin: 15000000,
                budgetMax: 20000000,
                timeline: '3-6m',
                source: 'Referral',
                status: 'Qualified',
                notes: 'Wants a villa with a garden. Referred by an old client.',
                tags: [{value: 'luxury'}, {value: 'garden'}],
                ownerId: 'admin-user-id',
                updatedAt: new Date('2023-10-25T14:30:00Z'),
            },
            {
                id: '3',
                fullName: 'Rohan Gupta',
                phone: '7654321098',
                email: '',
                city: 'Panchkula',
                propertyType: 'Plot',
                purpose: 'Buy',
                budgetMin: 5000000,
                budgetMax: 7000000,
                timeline: '>6m',
                source: 'Walk-in',
                status: 'Contacted',
                notes: 'Interested in investment plots. Visited the office yesterday.',
                tags: [{value: 'investment'}],
                bhk: undefined,
                ownerId: 'standard-user-id',
                updatedAt: new Date('2023-10-24T11:00:00Z'),
            },
            {
                id: '4',
                fullName: 'Sunita Singh',
                phone: '6543210987',
                email: 'sunita.singh@email.com',
                city: 'Zirakpur',
                propertyType: 'Apartment',
                bhk: '2',
                purpose: 'Rent',
                budgetMin: 15000,
                budgetMax: 20000,
                timeline: '0-3m',
                source: 'Call',
                status: 'Visited',
                notes: 'Needs a 2BHK for rent near her office. Visited 3 properties.',
                tags: [{value: 'rental'}, {value: 'urgent'}],
                ownerId: 'admin-user-id',
                updatedAt: new Date('2023-10-22T16:20:00Z'),
            },
            ...Array.from({ length: 16 }, (_, i) => ({
                id: `${i + 5}`,
                fullName: `Lead Number ${i + 5}`,
                email: `lead${i+5}@email.com`,
                phone: `99999999${(10 + i).toString().padStart(2, '0')}`,
                city: 'Chandigarh' as const,
                propertyType: 'Apartment' as const,
                bhk: '2' as const,
                purpose: 'Buy' as const,
                budgetMin: 5000000 + i * 100000,
                budgetMax: 6000000 + i * 100000,
                timeline: 'Exploring' as const,
                source: 'Website' as const,
                status: 'New' as const,
                notes: `This is a generated lead number ${i + 5}.`,
                tags: [],
                ownerId: 'standard-user-id',
                updatedAt: new Date(Date.now() - i * 1000 * 3600 * 24),
            })),
        ]);
        
        await db.insert(buyerHistoryTable).values([
            {
                id: 'hist-1',
                buyerId: '2',
                changedAt: new Date('2023-10-25T14:30:00Z'),
                changedBy: { id: 'admin-user-id', name: 'Admin User', role: 'ADMIN' },
                diff: { status: ['New', 'Qualified'] }
            }
        ]);
    }
}

// Seed only if db is empty
seedData().catch(console.error);

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

// Add this function to fetch a user by ID to resolve foreign key constraints
export async function getUserById(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
}
