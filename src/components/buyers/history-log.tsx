'use client';

import { BuyerHistory, Tag } from '@/lib/types';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { formatDistanceToNow } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';

type HistoryLogProps = {
  history: BuyerHistory[];
};

export function HistoryLog({ history }: HistoryLogProps) {
  const renderValue = (value: any) => {
    if (value === null || value === undefined || value === '') return <span className="text-muted-foreground italic">empty</span>;
    if (Array.isArray(value)) {
        const tags = value as Tag[];
        if (tags.length === 0) return <span className="text-muted-foreground italic">empty</span>;
        return tags.map(t => t.value).join(', ');
    }
    return String(value);
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Change History</CardTitle>
        <CardDescription>Last 5 changes to this lead.</CardDescription>
      </CardHeader>
      <CardContent>
        {history.length > 0 ? (
          <ScrollArea className="h-96 pr-4">
            <div className="space-y-6">
              {history.map((item) => (
                <div key={item.id} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-3 h-3 bg-primary rounded-full mt-1"></div>
                    <div className="flex-grow w-px bg-border"></div>
                  </div>
                  <div className="flex-1 pb-4">
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(item.changedAt), { addSuffix: true })} by {item.changedBy.name}
                    </p>
                    <div className="text-sm space-y-1 mt-1">
                      {Object.entries(item.diff).map(([field, values]) => (
                        <div key={field}>
                          <span className="font-semibold capitalize">{field}:</span>{' '}
                          <span className="text-red-500 line-through">
                            {renderValue(values[0])}
                          </span>{' '}
                          →{' '}
                          <span className="text-green-500">
                            {renderValue(values[1])}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">
            No history available for this lead.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
