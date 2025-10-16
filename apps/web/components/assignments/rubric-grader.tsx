'use client';

import { useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { AssignmentSubmission, RubricCriterion } from '@/lib/api/client';

const scoreSchema = z.object({
  scores: z.record(z.string(), z.number().min(0).max(100)),
  feedback: z.string().optional()
});

type ScoreForm = z.infer<typeof scoreSchema>;

interface RubricGraderProps {
  rubric: RubricCriterion[];
  submission: AssignmentSubmission;
  onSubmit?: (payload: { scores: ScoreForm['scores']; feedback?: string; totalScore: number }) => void;
}

export const RubricGrader = ({ rubric, submission, onSubmit }: RubricGraderProps) => {
  const defaultValues = useMemo(() => {
    const scores: Record<string, number> = {};
    rubric.forEach((criterion) => {
      const existing = submission.rubricScores?.find((score) => score.criterionId === criterion.id);
      scores[criterion.id] = existing?.score ?? criterion.maxScore;
    });
    return { scores, feedback: submission.feedback ?? '' } satisfies ScoreForm;
  }, [rubric, submission]);

  const form = useForm<ScoreForm>({
    resolver: zodResolver(scoreSchema),
    defaultValues
  });

  const calculateTotal = (values: ScoreForm['scores']) => {
    return rubric.reduce((acc, criterion) => {
      const score = values[criterion.id] ?? 0;
      return acc + score * (criterion.weight ?? 1);
    }, 0);
  };

  const handleSubmit = (values: ScoreForm) => {
    const totalScore = calculateTotal(values.scores) / rubric.length;
    onSubmit?.({ ...values, totalScore });
  };

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
      {rubric.map((criterion) => (
        <Card key={criterion.id}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{criterion.label}</span>
              <span className="text-sm text-muted-foreground">Max: {criterion.maxScore}</span>
            </CardTitle>
            <CardDescription>{criterion.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Label htmlFor={`score-${criterion.id}`}>Score</Label>
            <Controller
              name={`scores.${criterion.id}` as const}
              control={form.control}
              render={({ field }) => (
                <Input
                  id={`score-${criterion.id}`}
                  type="number"
                  min={0}
                  max={criterion.maxScore}
                  step={1}
                  value={field.value ?? ''}
                  onChange={(event) => field.onChange(Number(event.target.value))}
                />
              )}
            />
            <p className="text-xs text-muted-foreground">Weight: {(criterion.weight ?? 1) * 100}%</p>
          </CardContent>
        </Card>
      ))}
      <div>
        <Label htmlFor="feedback">Overall feedback</Label>
        <Textarea id="feedback" rows={4} {...form.register('feedback')} placeholder="Share coaching notes and next steps." />
      </div>
      <Button type="submit" className="w-full md:w-auto">
        Save Rubric Grades
      </Button>
    </form>
  );
};

