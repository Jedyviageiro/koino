export type ReadingPassage = {
  passageId: number;
  chapterId: number;
  bookId: number;
  bookTitle: string;
  chapterNumber: number;
  firstVerse: number;
  lastVerse: number;
};

export type UserPlanTask = {
  taskId: number;
  dayNumber: number;
  scheduledDate: string;
  readingAssignment: string;
  estimatedMinutes: number;
  currentVerseIndex: number;
  completed: boolean;
  completedAt: string | null;
  passages: ReadingPassage[];
};

export type UserPlan = {
  activePlanId: number;
  planCode: string;
  name: string;
  sequenceNumber: number;
  startDate: string;
  estimatedFinishDate: string;
  nextReadingDate: string | null;
  estimatedMinutesPerDay: number;
  completedDays: number;
  totalDays: number;
  completionPercentage: number;
  completedToday: boolean;
  completed: boolean;
};

export type PlanTemplate = {
  planTemplateId: number;
  planCode: string;
  name: string;
  description: string;
  difficulty: string;
  durationDays: number;
  totalChapters: number;
  bookNames: string;
  estimatedMinutesPerDay: number;
};

export type VerseOfDay = { reference: string; text: string; theme: string; monthDay: string };
export type Streak = {
  currentStreak: number;
  longestStreak: number;
  lastLoginDate: string | null;
  recentDays: { date: string; active: boolean }[];
};
export type Notification = { notificationId: number; title: string; message: string; type: string; referenceId: string | null; read: boolean; createdAt: string };
export type Bookmark = { bookmarkId: number; verseId: number; book: string; chapterId: number; chapterNumber: number; verseNumber: number; text: string; highlightColor: string | null; bookmarkedAt: string };
export type Devotional = {
  devotionalId: number;
  taskId: number;
  readingAssignment: string;
  estimatedMinutes: number;
  verseCount: number;
  title: string;
  anchorVerseReference: string;
  anchorVerseText: string;
  opening: string;
  reflection: string;
  application: string;
  prayer: string;
  generatedAt: string;
};
export type BibleVerse = { verseId: number; verseNumber: number; text: string };

export type HomeData = {
  plan: UserPlan | null;
  task: UserPlanTask | null;
  streak: Streak;
  notifications: Notification[];
  bookmarks: Bookmark[];
  verseOfDay: VerseOfDay;
};

export type PlansData = {
  route: PlanTemplate[];
  userPlans: UserPlan[];
  todayTask: UserPlanTask | null;
  needsOnboarding: boolean;
};

export type DevotionalData = { plan: UserPlan | null; task: UserPlanTask | null; devotional: Devotional | null };
export type ReadingVerse = BibleVerse & { bookTitle: string; chapterNumber: number };
export type ReadingData = { plan: UserPlan | null; task: UserPlanTask | null; verses: ReadingVerse[]; bookmarks: Bookmark[] };
