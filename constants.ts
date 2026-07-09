
import { DayData, WeekData } from './types';

export const DAYS_HU = [
  'Hétfő',
  'Kedd',
  'Szerda',
  'Csütörtök',
  'Péntek',
  'Szombat',
  'Vasárnap'
];

export const INITIAL_RULE = {
  caffeine: false,
  meal: false,
  fluids: false,
  screens: false,
  snooze: false,
};

const createEmptyDay = (weekNum: number, dayIdx: number): DayData => ({
  id: `w${weekNum}-d${dayIdx}`,
  dayName: DAYS_HU[dayIdx],
  workout: false,
  nutrition: 0, // Changed from 5 to 0 (unselected)
  supplements: false,
  water: 0,
  sleep: 0, // Changed from 8 to 0
  rule103210: { ...INITIAL_RULE },
  eveningHunger: 0,
  wellbeing: 0, // Changed from 5 to 0
  notes: '',
});

export const INITIAL_WEEKS: WeekData[] = Array.from({ length: 8 }, (_, i) => ({
  weekNumber: i + 1,
  days: DAYS_HU.map((_, d) => createEmptyDay(i + 1, d)),
}));

export const BRAND_RED = '#b91c1c';
export const APP_STORAGE_KEY = 'fighter-reset-diary-v1';
