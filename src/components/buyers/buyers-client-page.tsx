'use client';

import * as React from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Download, Filter, PlusCircle, Upload } from 'lucide-react';
import { useDebouncedCallback } from 'use-debounce';

import { Buyer } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { BuyersTable } from './buyers-table';
import {
  CityOptions,
  PropertyTypeOptions,
  StatusOptions,
  TimelineOptions,
} from '@/lib/constants';
import { ImportDialog } from './import-dialog';
import { exportLeads } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';

type BuyersClientPageProps = {
  leads: Buyer[];
  total: number;
};

export function BuyersClientPage({ leads, total }: BuyersClientPageProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [isImportOpen, setImportOpen] = React.useState(false);

  const createQueryString = React.useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(name, value);
      } else {
        params.delete(name);
      }
      if (name !== 'page') {
        params.set('page', '1');
      }
      return params.toString();
    },
    [searchParams]
  );
  
  const handleFilterChange = (name: string, value: string) => {
    router.push(pathname + '?' + createQueryString(name, value));
  };

  const debouncedSearch = useDebouncedCallback((value: string) => {
    handleFilterChange('search', value);
  }, 500);

  const handleExport = async () => {
    toast({ title: 'Exporting...', description: 'Your CSV file is being generated.' });
    const result = await exportLeads(searchParams.toString());
    if (result.success && result.data) {
      const blob = new Blob([result.data], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'leads.csv';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast({ title: 'Success', description: 'Leads exported successfully.' });
    } else {
      toast({ variant: 'destructive', title: 'Error', description: result.error });
    }
  };


  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">
            Buyer Leads
          </h1>
          <p className="text-muted-foreground">
            Manage and track all your potential buyers.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setImportOpen(true)}>
            <Upload className="mr-2 h-4 w-4" /> Import
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" /> Export
          </Button>
          <Button onClick={() => router.push('/buyers/new')} className="bg-accent hover:bg-accent/90 text-accent-foreground">
            <PlusCircle className="mr-2 h-4 w-4" /> Add Lead
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Input
            placeholder="Search by name, email, phone..."
            defaultValue={searchParams.get('search') || ''}
            onChange={(e) => debouncedSearch(e.target.value)}
            className="lg:col-span-2"
          />
          <Select
            value={searchParams.get('city') || ''}
            onValueChange={(value) => handleFilterChange('city', value === 'all' ? '' : value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Filter by City" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Cities</SelectItem>
              {CityOptions.map((city) => (
                <SelectItem key={city} value={city}>
                  {city}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={searchParams.get('propertyType') || ''}
            onValueChange={(value) => handleFilterChange('propertyType', value === 'all' ? '' : value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Filter by Property Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {PropertyTypeOptions.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={searchParams.get('status') || ''}
            onValueChange={(value) => handleFilterChange('status', value === 'all' ? '' : value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Filter by Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {StatusOptions.map((status) => (
                <SelectItem key={status} value={status}>
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <BuyersTable leads={leads} total={total} />
      <ImportDialog isOpen={isImportOpen} onOpenChange={setImportOpen} />
    </div>
  );
}
