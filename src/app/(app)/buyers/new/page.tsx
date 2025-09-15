import { BuyerForm } from '@/components/buyers/buyer-form';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function NewBuyerPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-headline">Create New Lead</CardTitle>
          <CardDescription>
            Fill in the details below to add a new buyer lead to the system.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BuyerForm />
        </CardContent>
      </Card>
    </div>
  );
}
