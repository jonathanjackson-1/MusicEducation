'use client';

import { FlameIcon } from 'lucide-react';

import { DashboardSection } from '@/components/layout/dashboard-shell';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { usePracticeStreak } from '@/lib/api/hooks';

export const StudentStreaksView = ({ studioId }: { studioId: string }) => {
  const { data } = usePracticeStreak(studioId);

  if (!data) {
    return (
      <DashboardSection title="Streaks & badges" description="Build consistency to unlock badges.">
        <p className="text-sm text-muted-foreground">Start logging practice to build your streak.</p>
      </DashboardSection>
    );
  }

  return (
    <DashboardSection
      title="Streaks & badges"
      description={`You're on a ${data.current}-day streak. Longest streak: ${data.longest} days.`}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FlameIcon className="h-5 w-5 text-orange-500" /> Current streak
            </CardTitle>
            <CardDescription>Keep practicing daily to grow the flame.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-semibold text-orange-500">{data.current}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Earned badges</CardTitle>
            <CardDescription>Celebrate milestones with your educator and parents.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {data.badges.map((badge) => (
              <Badge key={badge.id} variant="secondary">
                {badge.label} · {new Date(badge.earnedAt).toLocaleDateString()}
              </Badge>
            ))}
          </CardContent>
        </Card>
      </div>
    </DashboardSection>
  );
};

