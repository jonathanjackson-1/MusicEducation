'use client';

import { DownloadIcon } from 'lucide-react';

import { DashboardSection } from '@/components/layout/dashboard-shell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useInvoices } from '@/lib/api/hooks';

export const ParentInvoicesView = ({ studioId }: { studioId: string }) => {
  const { data: invoices = [] } = useInvoices(studioId);

  return (
    <DashboardSection title="Invoices" description="Download and review your billing history.">
      <div className="grid gap-4 md:grid-cols-2">
        {invoices.map((invoice) => (
          <Card key={invoice.id}>
            <CardHeader>
              <CardTitle>Invoice {invoice.id}</CardTitle>
              <CardDescription>
                Issued {new Date(invoice.issuedAt).toLocaleDateString()} · Due{' '}
                {new Date(invoice.dueAt).toLocaleDateString()}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                {invoice.amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}{' '}
                · Status {invoice.status}
              </span>
              <Button variant="outline" size="sm" asChild className="gap-2">
                <a href={invoice.downloadUrl} target="_blank" rel="noopener noreferrer">
                  <DownloadIcon className="h-4 w-4" /> Download
                </a>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </DashboardSection>
  );
};

