export type AcademicLevel = 'high_school' | 'undergraduate' | 'postgraduate' | 'independent';
export type CrestId = 'owl' | 'astrolabe' | 'folio' | 'laurel';
export type AmbientSoundType = 'none' | 'rain' | 'hearth' | 'archive' | 'binaural';
export type ThemeVariant = 'midnight' | 'walnut' | 'slate';
export type SubscriptionPlan = 'free' | 'premium';
export type DifficultyTier = 'foundational' | 'standard' | 'challenging';
export type FocusModeType = 'pomodoro' | 'custom' | 'adhd_sprint' | 'short_break' | 'long_break';
export type BacklogPriority = 'critical' | 'high' | 'moderate';

export type NavSection =
  | 'dashboard'
  | 'library'
  | 'focus'
  | 'missions'
  | 'backlog'
  | 'boss_battle'
  | 'vault'
  | 'exams'
  | 'profile';

export interface UserProfile {
  uid: string;
  displayName: string;
  academicLevel: AcademicLevel;
  crestId: CrestId;
  dailyGoalMinutes: number;
  xp: number;
  totalStudyMinutes: number;
  streakDays: number;
  lastStudyDate: string;
  activeStudyDays: number;
  adhdMode: boolean;
  ambientSound: AmbientSoundType;
  themeVariant: ThemeVariant;
  notificationsEnabled: boolean;
  plan: SubscriptionPlan;
  unlockedBadges: string[];
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface UserPrivateAccount {
  uid: string;
  email: string;
  subscriptionStatus: 'none' | 'trialing' | 'active' | 'canceled';
  subscriptionPeriod: 'none' | 'monthly' | 'annual';
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface Subject {
  id: string;
  uid: string;
  title: string;
  code: string;
  color: string;
  targetHours: number;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface Chapter {
  id: string;
  uid: string;
  subjectId: string;
  title: string;
  completed: boolean;
  isDifficult: boolean;
  difficulty: DifficultyTier;
  notes: string;
  formulas: string;
  order: number;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface FocusSession {
  id: string;
  uid: string;
  subjectId: string;
  subjectTitle: string;
  chapterId: string;
  durationMinutes: number;
  mode: FocusModeType;
  completedAt: string;
  dateKey: string;
  xpEarned: number;
  createdAt?: unknown;
}

export interface Mission {
  id: string;
  uid: string;
  title: string;
  description: string;
  type: 'daily' | 'custom';
  xpReward: number;
  completed: boolean;
  xpAwarded: boolean;
  claimedDate: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface BacklogSubtask {
  done: boolean;
  label: string;
}

export interface BacklogItem {
  id: string;
  uid: string;
  title: string;
  subjectTitle: string;
  chapterId: string;
  deadline: string;
  priority: BacklogPriority;
  estimatedMinutes: number;
  completed: boolean;
  subtasks: string[]; // Encoded as "0::Task label" or "1::Task label"
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface Quiz {
  id: string;
  uid: string;
  subjectTitle: string;
  chapterTitle: string;
  topicTag: string;
  timeLimitSeconds: number;
  questionCount: number;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface QuizQuestion {
  id: string;
  uid: string;
  quizId: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  topicTag: string;
  order: number;
  createdAt?: unknown;
}

export interface QuizAttempt {
  id: string;
  uid: string;
  quizId: string;
  quizTitle: string;
  subjectTitle: string;
  topicTag: string;
  score: number;
  correctCount: number;
  totalQuestions: number;
  durationSeconds: number;
  xpEarned: number;
  dateKey: string;
  weakTopics: string[];
  createdAt?: unknown;
}

export interface Exam {
  id: string;
  uid: string;
  title: string;
  subjectId: string;
  subjectTitle: string;
  examDate: string;
  location: string;
  notes: string;
  totalSyllabusUnits: number;
  completedSyllabusUnits: number;
  dailyTargetMinutes: number;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface AcademicRank {
  title: string;
  minXp: number;
  nextXp: number | null;
  roman: string;
}

export const ACADEMIC_RANKS: AcademicRank[] = [
  { title: 'Novice', minXp: 0, nextXp: 250, roman: 'I' },
  { title: 'Apprentice', minXp: 250, nextXp: 700, roman: 'II' },
  { title: 'Scholar', minXp: 700, nextXp: 1500, roman: 'III' },
  { title: 'Fellow', minXp: 1500, nextXp: 3000, roman: 'IV' },
  { title: 'Archivist', minXp: 3000, nextXp: 6000, roman: 'V' },
  { title: 'Laureate', minXp: 6000, nextXp: 12000, roman: 'VI' },
  { title: 'Dean of Letters', minXp: 12000, nextXp: null, roman: 'VII' },
];

export function getRankForXp(xp: number): AcademicRank {
  let current = ACADEMIC_RANKS[0];
  for (const rank of ACADEMIC_RANKS) {
    if (xp >= rank.minXp) {
      current = rank;
    }
  }
  return current;
}

export interface BadgeDefinition {
  id: string;
  title: string;
  criteria: string;
}

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  { id: 'first_candle', title: 'First Candle Lit', criteria: 'Complete your first focus session.' },
  { id: 'chapter_scribe', title: 'Chapter Scribe', criteria: 'Complete 3 chapters in Personal Library.' },
  { id: 'streak_7', title: 'Seven-Night Vigil', criteria: 'Study across 7 active days.' },
  { id: 'quiz_victor', title: 'Examiner’s Laureate', criteria: 'Score 80% or higher on a Boss Battle.' },
  { id: 'backlog_rescuer', title: 'Backlog Liberator', criteria: 'Clear an overdue or rescued chapter.' },
  { id: 'deep_scholar', title: 'Ten-Hour Sanctum', criteria: 'Log 600 total minutes of deep focus.' },
];

export const FREE_PLAN_LIMITS = {
  maxNotesChapters: 15,
  maxCustomQuizzes: 2,
  maxDailyQuizAttempts: 3,
};

export function encodeSubtask(sub: BacklogSubtask): string {
  return `${sub.done ? '1' : '0'}::${sub.label.slice(0, 220)}`;
}

export function decodeSubtask(raw: string): BacklogSubtask {
  if (raw.startsWith('1::')) {
    return { done: true, label: raw.slice(3) };
  }
  if (raw.startsWith('0::')) {
    return { done: false, label: raw.slice(3) };
  }
  return { done: false, label: raw };
}

export function getTodayDateKey(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function daysBetweenDateKeys(fromKey: string, toKey: string): number {
  const from = new Date(`${fromKey}T00:00:00`);
  const to = new Date(`${toKey}T00:00:00`);
  const diff = to.getTime() - from.getTime();
  return Math.round(diff / (1000 * 60 * 60 * 24));
}
