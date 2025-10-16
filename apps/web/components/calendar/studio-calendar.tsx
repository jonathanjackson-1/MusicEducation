'use client';

import { useMemo } from 'react';
import { Calendar, type EventProps, type SlotInfo, Views, dateFnsLocalizer } from 'react-big-calendar';
import {
  format,
  parse,
  startOfWeek,
  getDay,
  parseISO,
  formatISO,
  addMinutes
} from 'date-fns';

import type { CalendarEvent } from '@/lib/api/client';

import 'react-big-calendar/lib/css/react-big-calendar.css';

interface StudioCalendarProps {
  events: CalendarEvent[];
  onCreateAvailability?: (payload: { start: string; end: string }) => void;
}

const locales = {
  'en-US': new Intl.DateTimeFormat('en-US')
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: getDay(new Date()) }),
  getDay,
  locales
});

const eventStyles = {
  lesson: 'bg-blue-500/90 text-white border-blue-500',
  availability: 'bg-green-500/20 text-foreground border-green-500/60',
  practice: 'bg-purple-500/80 text-white border-purple-500'
} as const;

export const StudioCalendar = ({ events, onCreateAvailability }: StudioCalendarProps) => {
  const formattedEvents = useMemo(
    () =>
      events.map((event) => ({
        ...event,
        start: parseISO(event.start),
        end: parseISO(event.end)
      })),
    [events]
  );

  const handleSlotSelected = (slot: SlotInfo) => {
    if (!onCreateAvailability) return;
    const start = slot.start instanceof Date ? slot.start : new Date(slot.start);
    const end = slot.end instanceof Date ? slot.end : addMinutes(start, 60);
    onCreateAvailability({ start: formatISO(start), end: formatISO(end) });
  };

  const EventComponent = ({ event }: EventProps<CalendarEvent>) => (
    <div className="flex flex-col gap-1 text-xs md:text-sm">
      <span className="font-semibold">{event.title}</span>
      {event.studentName ? <span className="text-xs text-muted-foreground">{event.studentName}</span> : null}
    </div>
  );

  return (
    <div className="rounded-lg border border-border bg-background p-2 md:p-4">
      <Calendar
        localizer={localizer}
        events={formattedEvents}
        startAccessor="start"
        endAccessor="end"
        selectable={Boolean(onCreateAvailability)}
        onSelectSlot={handleSlotSelected}
        components={{ event: EventComponent }}
        eventPropGetter={(event) => {
          const type = event.type ?? 'lesson';
          return {
            className: `border ${eventStyles[type as keyof typeof eventStyles] ?? eventStyles.lesson}`
          };
        }}
        views={[Views.MONTH, Views.WEEK, Views.DAY]}
        defaultView={Views.WEEK}
        style={{ height: '70vh' }}
      />
    </div>
  );
};

