'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { importLeads } from '@/lib/actions';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { ScrollArea } from '../ui/scroll-area';

type ImportError = {
  row: number;
  errors: string[];
};

type ImportDialogProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
};

export function ImportDialog({ isOpen, onOpenChange }: ImportDialogProps) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importErrors, setImportErrors] = useState<ImportError[]>([]);
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFile(event.target.files[0]);
      setImportErrors([]);
    }
  };

  const handleImport = async () => {
    if (!file) {
      toast({
        variant: 'destructive',
        title: 'No file selected',
        description: 'Please select a CSV file to import.',
      });
      return;
    }

    setIsImporting(true);
    setImportErrors([]);

    const fileReader = new FileReader();
    fileReader.readAsText(file, 'UTF-8');
    fileReader.onload = async (e) => {
      const content = e.target?.result as string;
      const result = await importLeads(content);
      setIsImporting(false);

      if (result.success) {
        toast({
          title: 'Import Complete',
          description: `${result.importedCount} lead(s) imported successfully.`,
        });
        if (result.errors && result.errors.length > 0) {
          setImportErrors(result.errors);
          toast({
            variant: 'default',
            title: 'Partial Success',
            description: `Some rows had errors and were not imported. See details below.`,
          });
        } else {
          onOpenChange(false);
          router.refresh();
        }
      } else {
        toast({
          variant: 'destructive',
          title: 'Import Failed',
          description: result.error,
        });
        if (result.errors) {
            setImportErrors(result.errors);
        }
      }
    };
    fileReader.onerror = () => {
        setIsImporting(false);
        toast({
            variant: 'destructive',
            title: 'File Read Error',
            description: 'Could not read the selected file.',
        });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle className="font-headline">Import Leads from CSV</DialogTitle>
          <DialogDescription>
            Upload a CSV file with lead data. The file should not exceed 200 rows.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Input type="file" accept=".csv" onChange={handleFileChange} />
          <Alert>
            <AlertTitle>CSV Format</AlertTitle>
            <AlertDescription className="text-xs">
              Headers must be: `fullName,email,phone,city,propertyType,bhk,purpose,budgetMin,budgetMax,timeline,source,notes,tags,status`.
              Tags should be semi-colon separated (e.g. "tag1;tag2").
            </AlertDescription>
          </Alert>
          {importErrors.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2">Import Errors</h4>
              <ScrollArea className="h-[200px] border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Row</TableHead>
                            <TableHead>Error</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {importErrors.map(err => (
                            <TableRow key={err.row}>
                                <TableCell>{err.row}</TableCell>
                                <TableCell>{err.errors.join(', ')}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
              </ScrollArea>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleImport} disabled={isImporting || !file}>
            {isImporting ? 'Importing...' : 'Import'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
