'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Buyer } from '@/lib/types';
import { format, formatDistanceToNow } from 'date-fns';
import { PaginationControls } from './pagination-controls';
import { StatusBadge } from './status-badge';
import { AuthContext } from '@/lib/auth';
import { useContext } from 'react';

type BuyersTableProps = {
  leads: Buyer[];
  total: number;
};

export function BuyersTable({ leads, total }: BuyersTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useContext(AuthContext);

  const page = Number(searchParams.get('page')) || 1;
  const limit = Number(searchParams.get('limit')) || 10;
  
  const formatCurrency = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined) return 'N/A';
    if (amount >= 10000000) {
      return `${(amount / 10000000).toFixed(2)} Cr`;
    }
    if (amount >= 100000) {
      return `${(amount / 100000).toFixed(2)} Lac`;
    }
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="hidden md:table-cell">Phone</TableHead>
              <TableHead className="hidden lg:table-cell">City</TableHead>
              <TableHead className="hidden lg:table-cell">Property Type</TableHead>
              <TableHead>Budget</TableHead>
              <TableHead className="hidden md:table-cell">Timeline</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden md:table-cell">Updated</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads.length > 0 ? (
              leads.map((lead) => (
                <TableRow key={lead.id}>
                  <TableCell className="font-medium">{lead.fullName}</TableCell>
                  <TableCell className="hidden md:table-cell">{lead.phone}</TableCell>
                  <TableCell className="hidden lg:table-cell">{lead.city}</TableCell>
                  <TableCell className="hidden lg:table-cell">{lead.propertyType}</TableCell>
                  <TableCell>
                    {formatCurrency(lead.budgetMin)} - {formatCurrency(lead.budgetMax)}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{lead.timeline}</TableCell>
                  <TableCell>
                    <StatusBadge status={lead.status} />
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {formatDistanceToNow(new Date(lead.updatedAt), { addSuffix: true })}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push(`/buyers/${lead.id}`)}
                    >
                      View / Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={9} className="h-24 text-center">
                  No leads found. Try adjusting your filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {total > limit && (
         <PaginationControls
            currentPage={page}
            totalItems={total}
            itemsPerPage={limit}
        />
      )}
    </div>
  );
}
