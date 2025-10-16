'use client';

import { DashboardSection } from '@/components/layout/dashboard-shell';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useChildrenOverview } from '@/lib/api/hooks';

export const ParentChildrenView = ({ studioId }: { studioId: string }) => {
  const { data: children = [] } = useChildrenOverview(studioId);

  return (
    <DashboardSection
      title="Learner overview"
      description="Track weekly goals, lesson schedules, and growth."
    >
      <div className="grid gap-4 md:grid-cols-2">
        {children.map((child) => (
          <Card key={child.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{child.name}</span>
                <Badge variant="outline">{child.level}</Badge>
              </CardTitle>
              <CardDescription>
                Next lesson: {child.nextLesson ? new Date(child.nextLesson).toLocaleString() : 'TBD'}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Progress: {child.weeklyProgressMinutes} min</span>
              <span>Goal: {child.weeklyGoalMinutes} min</span>
            </CardContent>
          </Card>
        ))}
      </div>
    </DashboardSection>
  );
};

