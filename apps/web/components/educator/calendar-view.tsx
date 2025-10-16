'use client';

import { useMemo } from 'react';

import { StudioCalendar } from '@/components/calendar/studio-calendar';
import { DashboardSection } from '@/components/layout/dashboard-shell';
import { useCreateAvailability, useEducatorCalendar } from '@/lib/api/hooks';

interface EducatorCalendarViewProps {
  studioId: string;
}

export const EducatorCalendarView = ({ studioId }: EducatorCalendarViewProps) => {
  const { data: events = [], isLoading } = useEducatorCalendar(studioId);
  const createAvailability = useCreateAvailability(studioId);

  const subtitle = useMemo(() => {
    const totalLessons = events.filter((event) => event.type === 'lesson').length;
    return `${totalLessons} lesson${totalLessons === 1 ? '' : 's'} scheduled this week.`;
  }, [events]);

  return (
    <DashboardSection title="Studio calendar" description={subtitle}>
      {isLoading ? <p className="text-sm text-muted-foreground">Loading calendar…</p> : null}
      <StudioCalendar
        events={events}
        onCreateAvailability={(block) =>
          createAvailability.mutate({ start: block.start, end: block.end })
        }
      />
    </DashboardSection>
  );
};

