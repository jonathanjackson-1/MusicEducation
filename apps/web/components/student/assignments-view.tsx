'use client';

import { useEffect, useState } from 'react';

import { FileUploader } from '@/components/files/file-uploader';
import { DashboardSection } from '@/components/layout/dashboard-shell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useStudentAssignments, useSubmitAssignment } from '@/lib/api/hooks';

export const StudentAssignmentsView = ({ studioId }: { studioId: string }) => {
  const { data: assignments = [] } = useStudentAssignments(studioId);
  const submitAssignment = useSubmitAssignment(studioId);
  const [fileUrl, setFileUrl] = useState<string | undefined>();
  const [comment, setComment] = useState('');
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(assignments[0]?.id ?? null);
  const selectedAssignment = assignments.find((assignment) => assignment.id === selectedAssignmentId) ?? assignments[0];

  useEffect(() => {
    if (!selectedAssignmentId && assignments[0]) {
      setSelectedAssignmentId(assignments[0].id);
    }
  }, [assignments, selectedAssignmentId]);

  return (
    <DashboardSection
      title="My assignments"
      description="Upload recordings, PDFs, and reflections directly for your educator."
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-4">
          {assignments.map((assignment) => (
            <Card key={assignment.id} className={assignment.id === selectedAssignment?.id ? 'border-foreground' : ''}>
              <CardHeader>
                <CardTitle>{assignment.title}</CardTitle>
                <CardDescription>
                  Due {new Date(assignment.dueDate).toLocaleDateString()} — {assignment.status}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>{assignment.description}</p>
                {assignment.feedback ? (
                  <p className="rounded-md bg-muted/60 p-3 text-xs text-foreground">
                    Feedback: {assignment.feedback}
                  </p>
                ) : null}
                <Button
                  size="sm"
                  variant={assignment.id === selectedAssignment?.id ? 'secondary' : 'outline'}
                  onClick={() => setSelectedAssignmentId(assignment.id)}
                >
                  {assignment.id === selectedAssignment?.id ? 'Selected' : 'Work on this assignment'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Submit assignment</CardTitle>
            <CardDescription>Select an assignment and attach your work.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Share practice notes or questions for your educator."
              value={comment}
              onChange={(event) => setComment(event.target.value)}
            />
            <FileUploader
              getPresignedUrl={async ({ fileName }) =>
                Promise.resolve(`https://example.com/uploads/${fileName}`)
              }
              onUploaded={setFileUrl}
            />
            <Button
              className="w-full"
              disabled={!selectedAssignment || submitAssignment.isPending}
              onClick={() =>
                selectedAssignment
                  ? submitAssignment.mutate({
                      assignmentId: selectedAssignment.id,
                      fileUrl,
                      comment
                    })
                  : undefined
              }
            >
              {submitAssignment.isPending ? 'Submitting…' : 'Submit latest assignment'}
            </Button>
            {submitAssignment.isSuccess ? (
              <p className="text-xs text-green-600">Submission sent! Check back for feedback.</p>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </DashboardSection>
  );
};

