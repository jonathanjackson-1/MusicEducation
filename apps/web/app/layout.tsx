import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Soundstudio',
  description: 'Learn, practice, and collaborate across every device.'
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
