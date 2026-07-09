
export interface TenThreeTwoOneZeroRule {
  caffeine: boolean; // 10h before
  meal: boolean;     // 3h before
  fluids: boolean;   // 2h before
  screens: boolean;  // 1h before
  snooze: boolean;   // 0 snooze
}

export interface DayData {
  id: string; // e.g. "w1-d1"
  dayName: string;
  workout: boolean;
  nutrition: number; // 1-5
  supplements: boolean;
  water: number; // liters
  sleep: number; // hours
  rule103210: TenThreeTwoOneZeroRule;
  eveningHunger: number; // 0-5
  wellbeing: number; // 1-5
  notes: string;
}

export interface WeekData {
  weekNumber: number;
  days: DayData[];
}

export interface AppState {
  weeks: WeekData[];
}
