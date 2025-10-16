'use client';

import { useState } from 'react';

import { PracticeTimer } from '@/components/practice/practice-timer';
import { DashboardSection } from '@/components/layout/dashboard-shell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useLogPracticeSession, usePracticeGoal } from '@/lib/api/hooks';

export const StudentPracticeView = ({ studioId }: { studioId: string }) => {
  const { data: goal } = usePracticeGoal(studioId);
  const logPractice = useLogPracticeSession(studioId);
  const [notes, setNotes] = useState('');
  const [minutes, setMinutes] = useState(0);

  const handleComplete = (min: number) => {
    setMinutes(Math.round(min));
  };

  return (
    <DashboardSection
      title="Practice timer"
      description={goal ? `Goal: ${goal.weeklyMinutesGoal} minutes. ${goal.remainingMinutes} to go.` : 'Track time and keep notes.'}
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <PracticeTimer onComplete={handleComplete} />
        <Card>
          <CardHeader>
            <CardTitle>Log practice reflection</CardTitle>
            <CardDescription>Capture wins, challenges, and metronome markings.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              rows={6}
              placeholder="Today I focused on tone quality in measures 12-24…"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />
            <Button
              className="w-full"
              disabled={logPractice.isPending || minutes === 0}
              onClick={() =>
                logPractice.mutate({ minutes, notes }, { onSuccess: () => setNotes('') })
              }
            >
              {logPractice.isPending ? 'Saving…' : 'Log session'}
            </Button>
            {logPractice.isSuccess ? (
              <p className="text-xs text-green-600">Nice work! Practice session recorded.</p>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </DashboardSection>
  );
};

