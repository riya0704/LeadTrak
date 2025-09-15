import { Buyer, BuyerHistory, User } from './types';
import { v4 as uuidv4 } from 'uuid';

// In-memory store. In a real app, this would be a database.
let buyers: Buyer[] = [];
let buyerHistory: BuyerHistory[] = [];

// Seed data if the store is empty
function seedData() {
    buyers = [
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
        updatedAt: new Date('2023-10-26T10:00:00Z').toISOString(),
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
        updatedAt: new Date('2023-10-25T14:30:00Z').toISOString(),
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
        updatedAt: new Date('2023-10-24T11:00:00Z').toISOString(),
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
        updatedAt: new Date('2023-10-22T16:20:00Z').toISOString(),
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
        updatedAt: new Date(Date.now() - i * 1000 * 3600 * 24).toISOString(),
    })),
    ];
    
    buyerHistory = [
        {
            id: 'hist-1',
            buyerId: '2',
            changedAt: new Date('2023-10-25T14:30:00Z').toISOString(),
            changedBy: { id: 'admin-user-id', name: 'Admin User', role: 'ADMIN' },
            diff: { status: ['New', 'Qualified'] }
        }
    ];
}

if (buyers.length === 0) {
    seedData();
}

// Mock data access functions
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
  let filteredBuyers = [...buyers];

  // Filtering
  if (filters) {
    if (filters.city) {
      filteredBuyers = filteredBuyers.filter((b) => b.city === filters.city);
    }
    if (filters.propertyType) {
      filteredBuyers = filteredBuyers.filter((b) => b.propertyType === filters.propertyType);
    }
    if (filters.status) {
      filteredBuyers = filteredBuyers.filter((b) => b.status === filters.status);
    }
    if (filters.timeline) {
      filteredBuyers = filteredBuyers.filter((b) => b.timeline === filters.timeline);
    }
    if (filters.search) {
      const searchTerms = filters.search.toLowerCase().split(' ').filter(Boolean);
      filteredBuyers = filteredBuyers.filter(b => {
        const leadText = `${b.fullName} ${b.email} ${b.phone}`.toLowerCase();
        return searchTerms.every(term => leadText.includes(term));
      });
    }
  }

  // Sorting
  const [sortField, sortOrder] = sort.split(':') as [keyof Buyer, 'asc' | 'desc'];
  filteredBuyers.sort((a, b) => {
    const valA = a[sortField];
    const valB = b[sortField];
    if (valA === undefined || valA === null) return 1;
    if (valB === undefined || valB === null) return -1;

    let comparison = 0;
    if (valA > valB) {
      comparison = 1;
    } else if (valA < valB) {
      comparison = -1;
    }
    return sortOrder === 'desc' ? comparison * -1 : comparison;
  });

  // Pagination
  const start = (page - 1) * limit;
  const end = start + limit;
  const paginatedBuyers = filteredBuyers.slice(start, end);

  return { leads: paginatedBuyers, total: filteredBuyers.length };
}

export async function getLeadById(id: string): Promise<Buyer | undefined> {
  return buyers.find((b) => b.id === id);
}

export async function createLead(data: Buyer): Promise<Buyer> {
  const newLead: Buyer = {
    ...data,
    id: uuidv4(),
    updatedAt: new Date().toISOString(),
  };
  buyers.unshift(newLead);
  return newLead;
}

export async function updateLead(data: Buyer, user: User): Promise<{success: boolean, error?: string}> {
  const index = buyers.findIndex((b) => b.id === data.id);
  if (index === -1) {
    throw new Error('Lead not found');
  }

  const oldLead = buyers[index];
  
  if (user.role !== 'ADMIN' && oldLead.ownerId !== user.id) {
    return { success: false, error: 'You do not have permission to edit this lead.'};
  }
  
  if (new Date(oldLead.updatedAt).getTime() > new Date(data.updatedAt || 0).getTime()) {
      return { success: false, error: 'This record has been updated by someone else. Please refresh and try again.' };
  }
  
  const updatedLead = { ...data, updatedAt: new Date().toISOString() };
  buyers[index] = updatedLead;

  const diff: Record<string, [any, any]> = {};
  (Object.keys(updatedLead) as Array<keyof Buyer>).forEach(key => {
      if(key !== 'updatedAt' && key !== 'id' && JSON.stringify(oldLead[key]) !== JSON.stringify(updatedLead[key])){
          diff[key] = [oldLead[key], updatedLead[key]];
      }
  });

  if (Object.keys(diff).length > 0) {
      buyerHistory.unshift({
          id: uuidv4(),
          buyerId: updatedLead.id,
          changedAt: updatedLead.updatedAt,
          changedBy: { id: user.id, name: user.name, role: user.role },
          diff: diff
      });
  }

  return { success: true };
}

export async function getLeadHistory(buyerId: string, limit: number = 5): Promise<BuyerHistory[]> {
    return buyerHistory.filter(h => h.buyerId === buyerId).slice(0, limit);
}
