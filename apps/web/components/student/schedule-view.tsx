'use client';

import { DashboardSection } from '@/components/layout/dashboard-shell';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useStudentSchedule } from '@/lib/api/hooks';

export const StudentScheduleView = ({ studioId }: { studioId: string }) => {
  const { data: schedule = [] } = useStudentSchedule(studioId);

  return (
    <DashboardSection
      title="My upcoming lessons"
      description="Stay on top of every studio session and personal practice block."
    >
      <div className="grid gap-4 md:grid-cols-2">
        {schedule.map((item) => (
          <Card key={item.id}>
            <CardHeader>
              <CardTitle>{item.title}</CardTitle>
              <CardDescription>
                {new Date(item.start).toLocaleString()} — {new Date(item.end).toLocaleTimeString()}
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <p>Type: {item.type}</p>
              {item.educatorName ? <p>With: {item.educatorName}</p> : null}
            </CardContent>
          </Card>
        ))}
      </div>
    </DashboardSection>
  );
};

