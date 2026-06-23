import type { Metadata, Viewport } from 'next';
import './globals.css';
import Nav from '@/components/Nav';

export const metadata: Metadata = {
  title: 'Steady — weight-loss companion',
  description: 'Track your progress with your coach, the healthy way.',
};

export const viewport: Viewport = {
  themeColor: '#0f1115',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="flex min-h-screen">
          <Nav />
          <main className="flex-1 min-w-0 pb-24 md:pb-8">{children}</main>
        </div>
      </body>
    </html>
  );
}
