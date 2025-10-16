import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-muted/40 p-8">
      <Card className="w-full max-w-2xl text-center">
        <CardHeader>
          <CardTitle className="text-4xl font-semibold">Welcome to Soundstudio</CardTitle>
          <CardDescription>
            A modern learning environment that aligns educators, students, and parents with
            collaborative practice tools and insights.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          <Button asChild className="w-full max-w-xs">
            <Link href="/login">Enter the studio</Link>
          </Button>
          <Button variant="outline" asChild className="w-full max-w-xs">
            <Link href="/student/practice">Preview practice tools</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
