import type { Metadata } from 'next';
import { getLeads } from '@/lib/data';
import { BuyersClientPage } from '@/components/buyers/buyers-client-page';
import { searchLeadsWithAI } from '@/ai/flows/search-leads-ai';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata: Metadata = {
  title: 'Buyer Leads | LeadTrak',
};

export type BuyersPageSearchParams = {
  page?: string;
  limit?: string;
  sort?: string;
  city?: string;
  propertyType?: string;
  status?: string;
  timeline?: string;
  search?: string;
};

type BuyersPageProps = {
  searchParams: BuyersPageSearchParams;
};

function PageSkeleton() {
    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <Skeleton className="h-9 w-48 mb-2" />
                    <Skeleton className="h-5 w-72" />
                </div>
                <div className="flex gap-2">
                    <Skeleton className="h-10 w-24" />
                    <Skeleton className="h-10 w-24" />
                    <Skeleton className="h-10 w-28" />
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <Skeleton className="h-10 lg:col-span-2" />
                <Skeleton className="h-10" />
                <Skeleton className="h-10" />
                <Skeleton className="h-10" />
            </div>
            <Skeleton className="h-96 w-full" />
        </div>
    )
}

async function LeadsList({ searchParams }: BuyersPageProps) {
  const page = Number(searchParams.page) || 1;
  const limit = Number(searchParams.limit) || 10;
  const sort = searchParams.sort || 'updatedAt:desc';
  const city = searchParams.city;
  const propertyType = searchParams.propertyType;
  const status = searchParams.status;
  const timeline = searchParams.timeline;
  let search = searchParams.search;

  if (search) {
     try {
      const aiResponse = await searchLeadsWithAI({ searchQuery: search });
      search = aiResponse.processedQuery;
    } catch (error) {
      console.error('AI search processing failed, falling back to raw query:', error);
    }
  }

  const { leads, total } = await getLeads({
    page,
    limit,
    sort,
    filters: {
      city,
      propertyType,
      status,
      timeline,
      search,
    },
  });

  return <BuyersClientPage leads={leads} total={total} />;
}

export default function BuyersPage({ searchParams }: BuyersPageProps) {
    return (
        <Suspense fallback={<PageSkeleton />}>
            <LeadsList searchParams={searchParams} />
        </Suspense>
    )
}
