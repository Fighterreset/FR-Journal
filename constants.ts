
import { DayData, MindsetExerciseId, WeekData } from './types';

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
  mindset: {},
});

export const INITIAL_WEEKS: WeekData[] = Array.from({ length: 8 }, (_, i) => ({
  weekNumber: i + 1,
  days: DAYS_HU.map((_, d) => createEmptyDay(i + 1, d)),
}));

export const BRAND_RED = '#b91c1c';
export const APP_STORAGE_KEY = 'fighter-reset-diary-v1';


export const MINDSET_EXERCISE_CATALOG = {
  microBreak: { id: 'microBreak', nameKey: 'mindsetMicroBreak' },
  stopTechnique: { id: 'stopTechnique', nameKey: 'mindsetStopTechnique' },
  boxBreathing: { id: 'boxBreathing', nameKey: 'mindsetBoxBreathing' },
  focusBlock: { id: 'focusBlock', nameKey: 'mindsetFocusBlock' },
  tenseRelax: { id: 'tenseRelax', nameKey: 'mindsetTenseRelax' },
  controlCircle: { id: 'controlCircle', nameKey: 'mindsetControlCircle' },
  grounding54321: { id: 'grounding54321', nameKey: 'mindsetGrounding54321' },
} as const;

export interface MindsetWeekPlan {
  required: MindsetExerciseId[];
  optional: MindsetExerciseId[];
}

/**
 * A gyakorlatok hétről hétre egymásra épülnek.
 * A 3. héten nincs új kötelező elem; a korábban bevezetett gyakorlatok opcionálisak.
 * A 2. héten a Dobozlégzés az egyetlen kötelező gyakorlat.
 * A 3. héten nincs kötelező elem; a korábban bevezetett gyakorlatok opcionálisak.
 * A 7. és 8. héten kizárólag az 5-4-3-2-1 gyakorlat kötelező.
 */
export const MINDSET_WEEK_PLAN: Record<number, MindsetWeekPlan> = {
  1: { required: ['microBreak'], optional: [] },
  2: { required: ['boxBreathing'], optional: ['stopTechnique', 'microBreak'] },
  3: { required: [], optional: ['stopTechnique', 'boxBreathing', 'microBreak'] },
  4: { required: ['focusBlock'], optional: ['stopTechnique', 'boxBreathing', 'microBreak'] },
  5: { required: ['tenseRelax'], optional: ['focusBlock', 'stopTechnique', 'boxBreathing', 'microBreak'] },
  6: { required: ['controlCircle'], optional: ['tenseRelax', 'focusBlock', 'stopTechnique', 'boxBreathing', 'microBreak'] },
  7: { required: ['grounding54321'], optional: ['controlCircle', 'tenseRelax', 'focusBlock', 'stopTechnique', 'boxBreathing', 'microBreak'] },
  8: { required: ['grounding54321'], optional: ['controlCircle', 'tenseRelax', 'focusBlock', 'stopTechnique', 'boxBreathing', 'microBreak'] },
};
