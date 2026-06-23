'use client';
import { useRouter, usePathname } from 'next/navigation';

export default function DateNav({ date }: { date: string }) {
  const router = useRouter();
  const path = usePathname();
  return (
    <input
      type="date"
      defaultValue={date}
      className="input w-auto"
      onChange={(e) => router.push(`${path}?date=${e.target.value}`)}
    />
  );
}
