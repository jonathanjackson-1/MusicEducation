import { Button, Card } from '@soundstudio/ui';

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 p-8">
      <Card className="w-full max-w-xl space-y-4 p-6 text-center">
        <h1 className="text-3xl font-semibold">Welcome to Soundstudio</h1>
        <p className="text-muted-foreground">
          A modern learning environment for aspiring musicians with synchronized experiences
          across web, mobile, and beyond.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Button>Start practicing</Button>
          <Button variant="outline">Explore lessons</Button>
        </div>
      </Card>
    </main>
  );
}
