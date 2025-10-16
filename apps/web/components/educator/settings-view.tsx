'use client';

import { useState } from 'react';

import { DashboardSection } from '@/components/layout/dashboard-shell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export const EducatorSettingsView = () => {
  const [saved, setSaved] = useState(false);

  return (
    <div className="space-y-6">
      <DashboardSection
        title="Studio policies"
        description="Set expectations around cancellations, make-ups, and communication."
      >
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="cancellation">Cancellation policy</Label>
            <Textarea id="cancellation" rows={4} defaultValue="24-hour notice required for cancellations." />
          </div>
          <div className="space-y-2">
            <Label htmlFor="practice">Practice expectations</Label>
            <Textarea
              id="practice"
              rows={4}
              defaultValue="Aim for 30 focused minutes on lesson days, and 45 minutes otherwise."
            />
          </div>
          <Button type="submit">Save policies</Button>
          {saved ? <p className="text-sm text-muted-foreground">Saved!</p> : null}
        </form>
      </DashboardSection>

      <DashboardSection
        title="Notifications"
        description="Choose how you and your studio families receive reminders."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Lesson reminders</CardTitle>
              <CardDescription>Send friendly nudges ahead of each session.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Label htmlFor="reminder-time">Send reminder (hours before lesson)</Label>
              <Input id="reminder-time" type="number" defaultValue={24} min={1} max={72} />
              <Button variant="outline">Update reminder</Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Weekly digest</CardTitle>
              <CardDescription>Deliver practice reports to parents automatically.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Label htmlFor="digest-email">Recipient email</Label>
              <Input id="digest-email" type="email" defaultValue="parents@soundstudio.com" />
              <Button variant="outline">Save digest settings</Button>
            </CardContent>
          </Card>
        </div>
      </DashboardSection>
    </div>
  );
};

