'use client';

import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import { RubricGrader } from '@/components/assignments/rubric-grader';
import { DashboardSection } from '@/components/layout/dashboard-shell';
import { FileUploader } from '@/components/files/file-uploader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AudioPlayer } from '@/components/media/audio-player';
import { PdfAnnotator } from '@/components/media/pdf-annotator';
import { useEducatorAssignments } from '@/lib/api/hooks';

const assignmentSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  dueDate: z.string().min(1)
});

type AssignmentFormValues = z.infer<typeof assignmentSchema>;

export const EducatorAssignmentsView = ({ studioId }: { studioId: string }) => {
  const { data: assignments = [] } = useEducatorAssignments(studioId);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(assignments[0]?.id ?? null);
  const selectedAssignment = useMemo(
    () => assignments.find((assignment) => assignment.id === selectedAssignmentId) ?? assignments[0],
    [assignments, selectedAssignmentId]
  );

  useEffect(() => {
    if (!selectedAssignmentId && assignments[0]) {
      setSelectedAssignmentId(assignments[0].id);
    }
  }, [assignments, selectedAssignmentId]);

  const form = useForm<AssignmentFormValues>({
    resolver: zodResolver(assignmentSchema),
    defaultValues: {
      title: '',
      description: '',
      dueDate: new Date().toISOString().slice(0, 10)
    }
  });

  return (
    <div className="space-y-6">
      <DashboardSection
        title="Create assignment from template"
        description="Draft new repertoire, technique, or reflection tasks in seconds."
      >
        <form className="grid gap-4 md:grid-cols-2" onSubmit={form.handleSubmit(console.log)}>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" placeholder="Scale mastery challenge" {...form.register('title')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" rows={4} {...form.register('description')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dueDate">Due date</Label>
              <Input id="dueDate" type="date" {...form.register('dueDate')} />
            </div>
            <Button type="submit">Create assignment</Button>
          </div>
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Attach resources</CardTitle>
                <CardDescription>Share PDFs, audio references, or backing tracks.</CardDescription>
              </CardHeader>
              <CardContent>
                <FileUploader
                  getPresignedUrl={async ({ fileName }) =>
                    Promise.resolve(`https://example.com/uploads/${fileName}`)
                  }
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Assignments in this studio</CardTitle>
                <CardDescription>Select to grade recent submissions.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {assignments.map((assignment) => (
                  <Button
                    key={assignment.id}
                    variant={assignment.id === selectedAssignment?.id ? 'default' : 'outline'}
                    className="w-full justify-start"
                    onClick={() => setSelectedAssignmentId(assignment.id)}
                  >
                    <div>
                      <p className="font-medium">{assignment.title}</p>
                      <p className="text-xs text-muted-foreground">
                        Due {new Date(assignment.dueDate).toLocaleDateString()}
                      </p>
                    </div>
                  </Button>
                ))}
              </CardContent>
            </Card>
          </div>
        </form>
      </DashboardSection>

      {selectedAssignment ? (
        <DashboardSection
          title="Grade submissions"
          description={`Review performances and provide rubric scores for ${selectedAssignment.title}.`}
        >
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Submission media</CardTitle>
                  <CardDescription>Listen, annotate, and keep notes in one place.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selectedAssignment.submissions?.[0]?.audioUrl ? (
                    <AudioPlayer
                      src={selectedAssignment.submissions[0].audioUrl}
                      markers={[{ id: 'intro', label: 'Intro phrasing', time: 4.2 }]}
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground">No audio uploaded yet.</p>
                  )}
                  <PdfAnnotator src="https://example.com/assignment.pdf" />
                </CardContent>
              </Card>
            </div>
            <div>
              <RubricGrader
                rubric={selectedAssignment.rubric ?? []}
                submission={selectedAssignment.submissions?.[0] ?? {
                  id: 'temp',
                  studentId: 'student-1',
                  submittedAt: new Date().toISOString()
                }}
                onSubmit={console.log}
              />
            </div>
          </div>
        </DashboardSection>
      ) : null}
    </div>
  );
};

