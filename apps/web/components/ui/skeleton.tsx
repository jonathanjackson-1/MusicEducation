import { cn } from '@soundstudio/ui';

const Skeleton = ({ className }: { className?: string }) => (
  <div className={cn('animate-pulse rounded-md bg-muted', className)} />
);

export { Skeleton };

