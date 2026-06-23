// Seeds ~5 weeks of demo data into Supabase so the app looks alive on first run.
// Requires .env.local with NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY,
// and the schema already applied (supabase/schema.sql). Run: npm run seed
import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

// Minimal .env.local loader (no dotenv dependency).
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!url || !key || url.includes('YOUR-PROJECT')) {
  console.error('❌ Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local first.');
  process.exit(1);
}
const sb = createClient(url, key, { auth: { persistSession: false } });

const iso = (d) => d.toISOString().slice(0, 10);
const today = new Date();
const daysAgo = (n) => { const d = new Date(today); d.setDate(d.getDate() - n); return iso(d); };

async function main() {
  // Clear existing rows (order respects FK: exercises before workouts).
  await sb.from('exercises').delete().neq('id', 0);
  for (const t of ['meals', 'workouts', 'checkins', 'weight_entries']) await sb.from(t).delete().neq('id', 0);
  await sb.from('goal').delete().eq('id', 1);
  await sb.from('profile').delete().eq('id', 1);

  const startDate = daysAgo(35);
  await sb.from('profile').upsert({
    id: 1, name: 'Ala', age: 28, sex: 'male', height_cm: 178,
    coach_name: 'Coach Sami', coach_contact: 'sami@example.com', disclaimer_accepted: true,
  });
  await sb.from('goal').upsert({
    id: 1, start_weight: 88, start_date: startDate, target_weight: 78,
    target_date: daysAgo(-60), weekly_rate_target: 0.6, daily_calorie_target: 2100, status: 'active',
  });

  // Weight: gentle realistic decline with deterministic daily noise.
  const weights = [];
  let w = 88;
  for (let n = 35; n >= 0; n--) {
    w -= 0.08 + Math.sin(n) * 0.02;
    const noise = Math.cos(n * 1.7) * 0.4;
    weights.push({ date: daysAgo(n), weight: Math.round((w + noise) * 10) / 10, note: null });
  }
  await sb.from('weight_entries').upsert(weights, { onConflict: 'date' });

  const mealNames = ['Oats & eggs', 'Chicken & rice', 'Salmon & veg', 'Greek yogurt', 'Protein shake'];
  const meals = [], checkins = [];
  for (let n = 13; n >= 0; n--) {
    const date = daysAgo(n);
    ['breakfast', 'lunch', 'dinner'].forEach((t, i) => {
      const cheat = (n === 6 || n === 3) && t === 'dinner';
      meals.push({
        date, type: t, name: cheat ? 'Pizza night' : mealNames[(i + n) % mealNames.length],
        calories: cheat ? 1100 : 550 + i * 60, adherence: cheat ? 'cheated' : 'followed',
        is_cheat: cheat, note: cheat ? 'Friends over' : null,
      });
    });

    const rest = n % 3 === 0;
    const missed = n === 5 || n === 2;
    const { data: wk } = await sb.from('workouts').upsert({
      date, day_type: rest ? 'rest' : 'training',
      status: rest ? 'planned' : missed ? 'missed' : 'completed',
      title: rest ? 'Recovery' : 'Coach session', note: missed ? 'Overslept' : 'Solid session',
    }, { onConflict: 'date' }).select('id').single();
    if (!rest && wk) {
      await sb.from('exercises').insert(
        [['Squat', 4, '8', '60kg'], ['Bench', 4, '8', '40kg'], ['Row', 3, '10', '30kg']].map(([nm, s, r, wt]) =>
          ({ workout_id: wk.id, name: nm, sets: s, reps: r, weight: wt, completed: !missed }))
      );
    }

    const low = n <= 3;
    checkins.push({
      date, mood: low ? 2 : 4, energy: low ? 2 : 4, motivation: low ? 2 : 4,
      can_train: low ? 'unsure' : 'yes', sleep_quality: 3, sleep_hours: 7,
      stress: low ? 4 : 2, note: low ? 'Feeling drained' : null,
    });
  }
  await sb.from('meals').insert(meals);
  await sb.from('checkins').upsert(checkins, { onConflict: 'date' });

  console.log('✅ Seeded demo data into Supabase (35 days weight, 14 days meals/workouts/check-ins).');
}

main().catch((e) => { console.error('❌ Seed failed:', e.message); process.exit(1); });
