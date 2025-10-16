'use client';

import { useState } from 'react';
import { CheckIcon, XIcon } from 'lucide-react';

import { DashboardSection } from '@/components/layout/dashboard-shell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useBookingRequests, useRespondToBooking } from '@/lib/api/hooks';

export const ParentBookingRequestsView = ({ studioId }: { studioId: string }) => {
  const { data: requests = [] } = useBookingRequests(studioId);
  const respond = useRespondToBooking(studioId);
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <DashboardSection
      title="Booking requests"
      description="Review, approve, or decline lesson changes."
    >
      <div className="grid gap-4 md:grid-cols-2">
        {requests.map((request) => (
          <Card key={request.id}>
            <CardHeader>
              <CardTitle>{request.studentName}</CardTitle>
              <CardDescription>
                Requested {new Date(request.requestedAt).toLocaleString()} for{' '}
                {new Date(request.requestedSlot.start).toLocaleString()}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Status: {request.status}</span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  className="gap-1"
                  onClick={() => {
                    setSelected(request.id);
                    respond.mutate({ bookingId: request.id, action: 'approve' }, {
                      onSettled: () => setSelected(null)
                    });
                  }}
                  disabled={respond.isPending && selected === request.id}
                >
                  <CheckIcon className="h-4 w-4" /> Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1"
                  onClick={() => {
                    setSelected(request.id);
                    respond.mutate({ bookingId: request.id, action: 'decline' }, {
                      onSettled: () => setSelected(null)
                    });
                  }}
                  disabled={respond.isPending && selected === request.id}
                >
                  <XIcon className="h-4 w-4" /> Decline
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </DashboardSection>
  );
};

