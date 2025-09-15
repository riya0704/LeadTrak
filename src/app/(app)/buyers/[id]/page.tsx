import { notFound } from 'next/navigation';
import { getLeadById, getLeadHistory } from '@/lib/data';
import { BuyerForm } from '@/components/buyers/buyer-form';
import { HistoryLog } from '@/components/buyers/history-log';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

type BuyerDetailPageProps = {
  params: { id: string };
};

export default async function BuyerDetailPage({ params }: BuyerDetailPageProps) {
  const lead = await getLeadById(params.id);

  if (!lead) {
    notFound();
  }

  const history = await getLeadHistory(params.id, 5);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-headline">Edit Lead Details</CardTitle>
              <CardDescription>
                Viewing and modifying details for {lead.fullName}.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BuyerForm lead={lead} />
            </CardContent>
          </Card>
        </div>
        <div>
          <HistoryLog history={history} />
        </div>
      </div>
    </div>
  );
}
