'use client';

import { useMemo } from 'react';
import { ActivityIcon } from 'lucide-react';

import { DashboardSection } from '@/components/layout/dashboard-shell';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { usePracticeAnalytics } from '@/lib/api/hooks';

export const EducatorStudentsView = ({ studioId }: { studioId: string }) => {
  const { data: analytics = [] } = usePracticeAnalytics(studioId);

  const averages = useMemo(() => {
    if (!analytics.length) return { minutes: 0, streak: 0 };
    const totalMinutes = analytics.reduce((acc, item) => acc + item.minutesPracticedThisWeek, 0);
    const totalStreak = analytics.reduce((acc, item) => acc + item.streakLength, 0);
    return {
      minutes: Math.round(totalMinutes / analytics.length),
      streak: Math.round(totalStreak / analytics.length)
    };
  }, [analytics]);

  return (
    <div className="space-y-6">
      <DashboardSection
        title="Studio practice trends"
        description={`On average, students practiced ${averages.minutes} minutes this week with a ${averages.streak}-day streak.`}
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {analytics.map((student) => (
            <Card key={student.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between gap-2 text-base">
                  <span>{student.studentName}</span>
                  <Badge variant="secondary">Streak {student.streakLength}d</Badge>
                </CardTitle>
                <CardDescription>
                  Weekly goal {student.minutesGoal} min — {student.minutesPracticedThisWeek} logged
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <ActivityIcon className="h-4 w-4" />
                  <span>
                    {student.minutesPracticedThisWeek >= student.minutesGoal
                      ? 'On track for goal'
                      : `${student.minutesGoal - student.minutesPracticedThisWeek} minutes remaining`}
                  </span>
                </div>
                {student.badgeEarned ? (
                  <p className="text-xs text-foreground">Latest badge: {student.badgeEarned}</p>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      </DashboardSection>
    </div>
  );
};

