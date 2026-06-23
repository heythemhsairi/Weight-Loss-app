'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const items = [
  { href: '/', label: 'Home', icon: '🏠' },
  { href: '/plan', label: 'Plan', icon: '📋' },
  { href: '/weight', label: 'Weight', icon: '⚖️' },
  { href: '/meals', label: 'Meals', icon: '🍽️' },
  { href: '/workouts', label: 'Workouts', icon: '🏋️' },
  { href: '/checkin', label: 'Check-in', icon: '📝' },
  { href: '/calendar', label: 'Calendar', icon: '📅' },
  { href: '/insights', label: 'Insights', icon: '💡' },
  { href: '/settings', label: 'Settings', icon: '⚙️' },
];

// Mobile bottom bar shows a curated subset (Calendar/Settings live in the
// desktop sidebar to keep the bar from getting too cramped).
const mobileItems = items.filter((i) => !['/calendar', '/settings'].includes(i.href));

export default function Nav() {
  const path = usePathname();
  if (path === '/onboarding') return null;

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:flex-col md:w-56 md:shrink-0 border-r border-line p-4 gap-1">
        <div className="px-2 py-3 mb-2">
          <span className="text-lg font-bold text-brand">Steady</span>
          <p className="text-[11px] text-muted mt-0.5">with your coach</p>
        </div>
        {items.map((it) => {
          const active = it.href === '/' ? path === '/' : path.startsWith(it.href);
          return (
            <Link key={it.href} href={it.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors
                ${active ? 'bg-brand/10 text-brand' : 'text-muted hover:text-white hover:bg-panel2'}`}>
              <span>{it.icon}</span>{it.label}
            </Link>
          );
        })}
      </aside>

      {/* Mobile bottom bar */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-panel border-t border-line
                      grid grid-cols-7 px-1 pb-[env(safe-area-inset-bottom)]">
        {mobileItems.map((it) => {
          const active = it.href === '/' ? path === '/' : path.startsWith(it.href);
          return (
            <Link key={it.href} href={it.href}
              className={`flex flex-col items-center justify-center py-2 text-[10px] gap-0.5
                ${active ? 'text-brand' : 'text-muted'}`}>
              <span className="text-base leading-none">{it.icon}</span>
              {it.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
