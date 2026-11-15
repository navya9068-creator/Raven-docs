import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  deleteUser,
  onAuthStateChanged,
  reauthenticateWithPopup,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { auth, db, googleProvider, handleFirestoreError, OperationType } from '../lib/firebase';
import { DAILY_MISSION_TEMPLATES, STARTER_QUIZZES, STARTER_SUBJECTS } from '../lib/starterData';
import {
  FREE_PLAN_LIMITS,
  getTodayDateKey,
  daysBetweenDateKeys,
  type AcademicLevel,
  type AmbientSoundType,
  type BacklogItem,
  type BacklogPriority,
  type Chapter,
  type CrestId,
  type DifficultyTier,
  type Exam,
  type FocusModeType,
  type FocusSession,
  type Mission,
  type NavSection,
  type Quiz,
  type QuizAttempt,
  type QuizQuestion,
  type Subject,
  type ThemeVariant,
  type UserPrivateAccount,
  type UserProfile,
} from '../types/domain';

interface AppContextValue {
  firebaseUser: User | null;
  authLoading: boolean;
  dataLoading: boolean;
  syncError: string | null;
  profile: UserProfile | null;
  privateAccount: UserPrivateAccount | null;
  subjects: Subject[];
  chapters: Chapter[];
  focusSessions: FocusSession[];
  missions: Mission[];
  backlogItems: BacklogItem[];
  quizzes: Quiz[];
  quizAttempts: QuizAttempt[];
  exams: Exam[];
  activeSection: NavSection;
  setActiveSection: (section: NavSection) => void;
  showPricingModal: boolean;
  setShowPricingModal: (open: boolean) => void;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
  updatePreferences: (patch: Partial<Pick<UserProfile, 'displayName' | 'academicLevel' | 'crestId' | 'dailyGoalMinutes' | 'adhdMode' | 'ambientSound' | 'themeVariant' | 'notificationsEnabled'>>) => Promise<void>;
  addSubject: (input: { title: string; code: string; color: string; targetHours: number }) => Promise<string>;
  updateSubject: (id: string, patch: { title: string; code: string; color: string; targetHours: number }) => Promise<void>;
  deleteSubject: (id: string) => Promise<void>;
  addChapter: (input: { subjectId: string; title: string; difficulty: DifficultyTier; isDifficult: boolean; notes: string; formulas: string }) => Promise<void>;
  updateChapter: (id: string, patch: Partial<Pick<Chapter, 'title' | 'completed' | 'isDifficult' | 'difficulty' | 'notes' | 'formulas' | 'order'>>) => Promise<void>;
  deleteChapter: (id: string) => Promise<void>;
  recordFocusSession: (input: { subjectId: string; subjectTitle: string; chapterId: string; durationMinutes: number; mode: FocusModeType }) => Promise<void>;
  claimMission: (mission: Mission) => Promise<{ awarded: boolean; xpEarned: number }>;
  addCustomMission: (input: { title: string; description: string; xpReward: number }) => Promise<void>;
  deleteMission: (id: string) => Promise<void>;
  addBacklogItem: (input: { title: string; subjectTitle: string; chapterId: string; deadline: string; priority: BacklogPriority; estimatedMinutes: number; subtasks: string[] }) => Promise<void>;
  updateBacklogItem: (id: string, patch: Partial<Pick<BacklogItem, 'title' | 'subjectTitle' | 'deadline' | 'priority' | 'estimatedMinutes' | 'completed' | 'subtasks'>>) => Promise<void>;
  deleteBacklogItem: (id: string) => Promise<void>;
  createCustomQuiz: (input: {
    subjectTitle: string;
    chapterTitle: string;
    topicTag: string;
    timeLimitSeconds: number;
    questions: { prompt: string; options: string[]; correctIndex: number; explanation: string; topicTag: string }[];
  }) => Promise<void>;
  deleteQuiz: (quizId: string) => Promise<void>;
  fetchQuizQuestions: (quizId: string) => Promise<QuizQuestion[]>;
  recordQuizAttempt: (input: {
    quizId: string;
    quizTitle: string;
    subjectTitle: string;
    topicTag: string;
    score: number;
    correctCount: number;
    totalQuestions: number;
    durationSeconds: number;
    weakTopics: string[];
  }) => Promise<number>;
  addExam: (input: { title: string; subjectId: string; subjectTitle: string; examDate: string; location: string; notes: string; totalSyllabusUnits: number; completedSyllabusUnits: number; dailyTargetMinutes: number }) => Promise<void>;
  updateExam: (id: string, patch: Partial<Pick<Exam, 'title' | 'subjectId' | 'subjectTitle' | 'examDate' | 'location' | 'notes' | 'totalSyllabusUnits' | 'completedSyllabusUnits' | 'dailyTargetMinutes'>>) => Promise<void>;
  deleteExam: (id: string) => Promise<void>;
  deleteAccountAndData: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

function makeId(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${Date.now()}_${rand}`.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 120);
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.round(n)));
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [privateAccount, setPrivateAccount] = useState<UserPrivateAccount | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [focusSessions, setFocusSessions] = useState<FocusSession[]>([]);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [backlogItems, setBacklogItems] = useState<BacklogItem[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [quizAttempts, setQuizAttempts] = useState<QuizAttempt[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);

  const [activeSection, setActiveSection] = useState<NavSection>('dashboard');
  const [showPricingModal, setShowPricingModal] = useState(false);

  // Sync theme variant to documentElement
  useEffect(() => {
    const theme = profile?.themeVariant || 'midnight';
    if (theme === 'midnight') {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', theme);
    }
  }, [profile?.themeVariant]);

  const ensureUserInitialized = useCallback(async (user: User) => {
    const uid = user.uid;
    const userRef = doc(db, 'users', uid);
    const snap = await getDoc(userRef);

    if (!snap.exists()) {
      const displayName = 'Scholar';
      const initialProfile: UserProfile = {
        uid,
        displayName,
        academicLevel: 'undergraduate',
        crestId: 'owl',
        dailyGoalMinutes: 90,
        xp: 0,
        totalStudyMinutes: 0,
        streakDays: 0,
        lastStudyDate: '',
        activeStudyDays: 0,
        adhdMode: false,
        ambientSound: 'none',
        themeVariant: 'midnight',
        notificationsEnabled: false,
        plan: 'free',
        unlockedBadges: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      try {
        await setDoc(userRef, initialProfile);
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `users/${uid}`);
      }

      const privRef = doc(db, 'users', uid, 'private', 'account');
      try {
        await setDoc(privRef, {
          uid,
          email: (user.email || '').slice(0, 160),
          subscriptionStatus: 'none',
          subscriptionPeriod: 'none',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `users/${uid}/private/account`);
      }
    }

    const existingSubjects = await getDocs(
      query(collection(db, 'users', uid, 'subjects'), where('uid', '==', uid))
    );
    const profileData = snap.exists() ? (snap.data() as UserProfile) : null;
    if (
      profileData &&
      ((user.displayName && profileData.displayName === user.displayName) ||
        (user.email && profileData.displayName === user.email.split('@')[0]))
    ) {
      try {
        await updateDoc(userRef, {
          displayName: 'Scholar',
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `users/${uid}`);
      }
    }
    const needsStarterSeed =
      !snap.exists() ||
      (existingSubjects.empty && profileData?.xp === 0 && profileData?.totalStudyMinutes === 0);

    if (needsStarterSeed) {
      // Seed starter subjects & chapters
      const batch = writeBatch(db);
      for (const s of STARTER_SUBJECTS) {
        const sRef = doc(db, 'users', uid, 'subjects', s.id);
        batch.set(sRef, {
          id: s.id,
          uid,
          title: s.title,
          code: s.code,
          color: s.color,
          targetHours: s.targetHours,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        s.chapters.forEach((ch, idx) => {
          const chRef = doc(db, 'users', uid, 'chapters', ch.id);
          batch.set(chRef, {
            id: ch.id,
            uid,
            subjectId: s.id,
            title: ch.title,
            completed: ch.completed,
            isDifficult: ch.isDifficult,
            difficulty: ch.difficulty,
            notes: ch.notes,
            formulas: ch.formulas,
            order: idx,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        });
      }

      // Seed starter Boss Battle quizzes
      for (const qz of STARTER_QUIZZES) {
        const qRef = doc(db, 'users', uid, 'quizzes', qz.id);
        batch.set(qRef, {
          id: qz.id,
          uid,
          subjectTitle: qz.subjectTitle,
          chapterTitle: qz.chapterTitle,
          topicTag: qz.topicTag,
          timeLimitSeconds: qz.timeLimitSeconds,
          questionCount: qz.questions.length,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        qz.questions.forEach((question, qIdx) => {
          const questRef = doc(db, 'users', uid, 'quizzes', qz.id, 'questions', question.id);
          batch.set(questRef, {
            id: question.id,
            uid,
            quizId: qz.id,
            prompt: question.prompt,
            options: question.options,
            correctIndex: question.correctIndex,
            explanation: question.explanation,
            topicTag: question.topicTag,
            order: qIdx,
            createdAt: serverTimestamp(),
          });
        });
      }

      // Seed 1 sample exam 14 days from today and 1 sample backlog item
      const future14 = new Date();
      future14.setDate(future14.getDate() + 14);
      const examDateKey = getTodayDateKey(future14);
      const future5 = new Date();
      future5.setDate(future5.getDate() + 5);
      const backlogDateKey = getTodayDateKey(future5);

      batch.set(doc(db, 'users', uid, 'exams', 'exam_midterm_calc'), {
        id: 'exam_midterm_calc',
        uid,
        title: 'Analytical Calculus Midterm',
        subjectId: 'subj_calculus',
        subjectTitle: 'Analytical Calculus & Series',
        examDate: examDateKey,
        location: 'Hall of Letters, Room 204',
        notes: 'Focus on Taylor Remainder proofs and Ratio Test edge cases.',
        totalSyllabusUnits: 8,
        completedSyllabusUnits: 3,
        dailyTargetMinutes: 45,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      batch.set(doc(db, 'users', uid, 'backlogItems', 'backlog_taylor'), {
        id: 'backlog_taylor',
        uid,
        title: 'Taylor & Maclaurin Remainder Practice',
        subjectTitle: 'Analytical Calculus & Series',
        chapterId: 'chap_taylor',
        deadline: backlogDateKey,
        priority: 'high',
        estimatedMinutes: 60,
        completed: false,
        subtasks: [
          '0::Derive Maclaurin series for sin(x), cos(x), and e^x',
          '0::Work through 4 Lagrange error bound exercises',
          '0::Review radius of convergence edge cases',
        ],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      try {
        await batch.commit();
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${uid}/seed`);
      }
    }

    // Ensure today's date-scoped daily missions exist without overwriting claimed ones
    const todayKey = getTodayDateKey();
    for (const tmpl of DAILY_MISSION_TEMPLATES) {
      const missionId = `daily_${tmpl.slug}_${todayKey}`;
      const mRef = doc(db, 'users', uid, 'missions', missionId);
      const mSnap = await getDoc(mRef);
      if (!mSnap.exists()) {
        try {
          await setDoc(mRef, {
            id: missionId,
            uid,
            title: tmpl.title,
            description: tmpl.description,
            type: 'daily',
            xpReward: tmpl.xpReward,
            completed: false,
            xpAwarded: false,
            claimedDate: '',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, `users/${uid}/missions/${missionId}`);
        }
      }
    }
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      setAuthLoading(false);

      if (!user) {
        setProfile(null);
        setPrivateAccount(null);
        setSubjects([]);
        setChapters([]);
        setFocusSessions([]);
        setMissions([]);
        setBacklogItems([]);
        setQuizzes([]);
        setQuizAttempts([]);
        setExams([]);
        setDataLoading(false);
        return;
      }

      setDataLoading(true);
      setSyncError(null);
      try {
        await ensureUserInitialized(user);
      } catch (err) {
        setSyncError(err instanceof Error ? err.message : 'Unable to initialize cloud profile.');
      } finally {
        setDataLoading(false);
      }
    });

    return () => unsub();
  }, [ensureUserInitialized]);

  // Attach real-time Firestore listeners only when authenticated
  useEffect(() => {
    if (!firebaseUser) return;
    const uid = firebaseUser.uid;
    const unsubs: (() => void)[] = [];

    unsubs.push(
      onSnapshot(
        doc(db, 'users', uid),
        (snap) => {
          if (snap.exists()) setProfile(snap.data() as UserProfile);
        },
        (err) => handleFirestoreError(err, OperationType.GET, `users/${uid}`)
      )
    );

    unsubs.push(
      onSnapshot(
        doc(db, 'users', uid, 'private', 'account'),
        (snap) => {
          if (snap.exists()) setPrivateAccount(snap.data() as UserPrivateAccount);
        },
        (err) => handleFirestoreError(err, OperationType.GET, `users/${uid}/private/account`)
      )
    );

    unsubs.push(
      onSnapshot(
        query(collection(db, 'users', uid, 'subjects'), where('uid', '==', uid)),
        (snap) => setSubjects(snap.docs.map((d) => d.data() as Subject)),
        (err) => handleFirestoreError(err, OperationType.LIST, `users/${uid}/subjects`)
      )
    );

    unsubs.push(
      onSnapshot(
        query(collection(db, 'users', uid, 'chapters'), where('uid', '==', uid)),
        (snap) => setChapters(snap.docs.map((d) => d.data() as Chapter).sort((a, b) => a.order - b.order)),
        (err) => handleFirestoreError(err, OperationType.LIST, `users/${uid}/chapters`)
      )
    );

    unsubs.push(
      onSnapshot(
        query(collection(db, 'users', uid, 'focusSessions'), where('uid', '==', uid), orderBy('completedAt', 'desc')),
        (snap) => setFocusSessions(snap.docs.map((d) => d.data() as FocusSession)),
        (err) => handleFirestoreError(err, OperationType.LIST, `users/${uid}/focusSessions`)
      )
    );

    unsubs.push(
      onSnapshot(
        query(collection(db, 'users', uid, 'missions'), where('uid', '==', uid)),
        (snap) => setMissions(snap.docs.map((d) => d.data() as Mission)),
        (err) => handleFirestoreError(err, OperationType.LIST, `users/${uid}/missions`)
      )
    );

    unsubs.push(
      onSnapshot(
        query(collection(db, 'users', uid, 'backlogItems'), where('uid', '==', uid)),
        (snap) => setBacklogItems(snap.docs.map((d) => d.data() as BacklogItem)),
        (err) => handleFirestoreError(err, OperationType.LIST, `users/${uid}/backlogItems`)
      )
    );

    unsubs.push(
      onSnapshot(
        query(collection(db, 'users', uid, 'quizzes'), where('uid', '==', uid)),
        (snap) => setQuizzes(snap.docs.map((d) => d.data() as Quiz)),
        (err) => handleFirestoreError(err, OperationType.LIST, `users/${uid}/quizzes`)
      )
    );

    unsubs.push(
      onSnapshot(
        query(collection(db, 'users', uid, 'quizAttempts'), where('uid', '==', uid), orderBy('createdAt', 'desc')),
        (snap) => setQuizAttempts(snap.docs.map((d) => d.data() as QuizAttempt)),
        (err) => handleFirestoreError(err, OperationType.LIST, `users/${uid}/quizAttempts`)
      )
    );

    unsubs.push(
      onSnapshot(
        query(collection(db, 'users', uid, 'exams'), where('uid', '==', uid)),
        (snap) => setExams(snap.docs.map((d) => d.data() as Exam).sort((a, b) => a.examDate.localeCompare(b.examDate))),
        (err) => handleFirestoreError(err, OperationType.LIST, `users/${uid}/exams`)
      )
    );

    return () => {
      unsubs.forEach((u) => u());
    };
  }, [firebaseUser]);

  const signInWithGoogle = async () => {
    await signInWithPopup(auth, googleProvider);
  };

  const signOutUser = async () => {
    await signOut(auth);
  };

  const awardProgress = useCallback(
    async (xpDelta: number, minutesDelta: number, extraBadges: string[] = []) => {
      if (!firebaseUser || !profile) return;
      const uid = firebaseUser.uid;
      const todayKey = getTodayDateKey();
      const safeXpDelta = clamp(xpDelta, 0, 500);
      const safeMinDelta = clamp(minutesDelta, 0, 300);

      let newStreak = profile.streakDays;
      let newActiveDays = profile.activeStudyDays;
      let newLastDate = profile.lastStudyDate;

      if (profile.lastStudyDate !== todayKey) {
        newActiveDays = profile.activeStudyDays + 1;
        if (!profile.lastStudyDate) {
          newStreak = 1;
        } else {
          const diff = daysBetweenDateKeys(profile.lastStudyDate, todayKey);
          newStreak = diff === 1 ? profile.streakDays + 1 : 1;
        }
        newLastDate = todayKey;
      }

      const nextTotalMinutes = profile.totalStudyMinutes + safeMinDelta;
      const badgesSet = new Set(profile.unlockedBadges);
      for (const b of extraBadges) badgesSet.add(b);
      if (safeMinDelta > 0) badgesSet.add('first_candle');
      if (newActiveDays >= 7) badgesSet.add('streak_7');
      if (nextTotalMinutes >= 600) badgesSet.add('deep_scholar');

      const unlockedBadges = Array.from(badgesSet).slice(0, 30);

      try {
        await updateDoc(doc(db, 'users', uid), {
          xp: profile.xp + safeXpDelta,
          totalStudyMinutes: nextTotalMinutes,
          streakDays: newStreak,
          lastStudyDate: newLastDate,
          activeStudyDays: newActiveDays,
          unlockedBadges,
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `users/${uid}`);
      }
    },
    [firebaseUser, profile]
  );

  const updatePreferences: AppContextValue['updatePreferences'] = async (patch) => {
    if (!firebaseUser || !profile) return;
    const uid = firebaseUser.uid;
    const cleanPatch: Record<string, unknown> = { updatedAt: serverTimestamp() };

    if (patch.displayName !== undefined) cleanPatch.displayName = patch.displayName.trim().slice(0, 60) || profile.displayName;
    if (patch.academicLevel !== undefined) cleanPatch.academicLevel = patch.academicLevel as AcademicLevel;
    if (patch.crestId !== undefined) cleanPatch.crestId = patch.crestId as CrestId;
    if (patch.dailyGoalMinutes !== undefined) cleanPatch.dailyGoalMinutes = clamp(patch.dailyGoalMinutes, 10, 720);
    if (patch.adhdMode !== undefined) cleanPatch.adhdMode = Boolean(patch.adhdMode);
    if (patch.ambientSound !== undefined) cleanPatch.ambientSound = patch.ambientSound as AmbientSoundType;
    if (patch.themeVariant !== undefined) {
      const targetTheme = patch.themeVariant as ThemeVariant;
      if (targetTheme !== 'midnight' && profile.plan !== 'premium') {
        setShowPricingModal(true);
        return;
      }
      cleanPatch.themeVariant = targetTheme;
    }
    if (patch.notificationsEnabled !== undefined) cleanPatch.notificationsEnabled = Boolean(patch.notificationsEnabled);

    try {
      await updateDoc(doc(db, 'users', uid), cleanPatch);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${uid}`);
    }
  };

  const addSubject: AppContextValue['addSubject'] = async (input) => {
    if (!firebaseUser) return '';
    const uid = firebaseUser.uid;
    const id = makeId('subj');
    try {
      await setDoc(doc(db, 'users', uid, 'subjects', id), {
        id,
        uid,
        title: input.title.trim().slice(0, 100),
        code: input.code.trim().slice(0, 20),
        color: input.color.slice(0, 24),
        targetHours: clamp(input.targetHours, 1, 1000),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `users/${uid}/subjects/${id}`);
    }
    return id;
  };

  const updateSubject: AppContextValue['updateSubject'] = async (id, patch) => {
    if (!firebaseUser) return;
    const uid = firebaseUser.uid;
    try {
      await updateDoc(doc(db, 'users', uid, 'subjects', id), {
        title: patch.title.trim().slice(0, 100),
        code: patch.code.trim().slice(0, 20),
        color: patch.color.slice(0, 24),
        targetHours: clamp(patch.targetHours, 1, 1000),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${uid}/subjects/${id}`);
    }
  };

  const deleteSubject: AppContextValue['deleteSubject'] = async (id) => {
    if (!firebaseUser) return;
    const uid = firebaseUser.uid;
    const relatedChapters = chapters.filter((c) => c.subjectId === id);
    const batch = writeBatch(db);
    batch.delete(doc(db, 'users', uid, 'subjects', id));
    for (const ch of relatedChapters) {
      batch.delete(doc(db, 'users', uid, 'chapters', ch.id));
    }
    try {
      await batch.commit();
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `users/${uid}/subjects/${id}`);
    }
  };

  const addChapter: AppContextValue['addChapter'] = async (input) => {
    if (!firebaseUser || !profile) return;
    const hasNotes = Boolean(input.notes.trim() || input.formulas.trim());
    const notedChaptersCount = chapters.filter((c) => c.notes.trim() || c.formulas.trim()).length;
    if (profile.plan === 'free' && hasNotes && notedChaptersCount >= FREE_PLAN_LIMITS.maxNotesChapters) {
      setShowPricingModal(true);
      return;
    }

    const uid = firebaseUser.uid;
    const id = makeId('chap');
    const order = chapters.filter((c) => c.subjectId === input.subjectId).length;
    try {
      await setDoc(doc(db, 'users', uid, 'chapters', id), {
        id,
        uid,
        subjectId: input.subjectId,
        title: input.title.trim().slice(0, 140),
        completed: false,
        isDifficult: Boolean(input.isDifficult),
        difficulty: input.difficulty,
        notes: input.notes.slice(0, 15000),
        formulas: input.formulas.slice(0, 8000),
        order,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `users/${uid}/chapters/${id}`);
    }
  };

  const updateChapter: AppContextValue['updateChapter'] = async (id, patch) => {
    if (!firebaseUser || !profile) return;
    const uid = firebaseUser.uid;
    const existingChap = chapters.find((c) => c.id === id);
    if (!existingChap) return;

    // Enforce free note cap when adding notes to a previously empty chapter
    const nextNotes = patch.notes !== undefined ? patch.notes : existingChap.notes;
    const nextFormulas = patch.formulas !== undefined ? patch.formulas : existingChap.formulas;
    const wasNoted = Boolean(existingChap.notes.trim() || existingChap.formulas.trim());
    const willBeNoted = Boolean(nextNotes.trim() || nextFormulas.trim());
    const notedCount = chapters.filter((c) => c.notes.trim() || c.formulas.trim()).length;
    if (profile.plan === 'free' && !wasNoted && willBeNoted && notedCount >= FREE_PLAN_LIMITS.maxNotesChapters) {
      setShowPricingModal(true);
      return;
    }

    const keys = Object.keys(patch);
    const onlyCompleted = keys.length === 1 && keys[0] === 'completed';

    try {
      if (onlyCompleted) {
        await updateDoc(doc(db, 'users', uid, 'chapters', id), {
          completed: Boolean(patch.completed),
          updatedAt: serverTimestamp(),
        });
        if (patch.completed && !existingChap.completed) {
          const completedTotal = chapters.filter((c) => c.completed).length + 1;
          await awardProgress(25, 0, completedTotal >= 3 ? ['chapter_scribe'] : []);
        }
      } else {
        await updateDoc(doc(db, 'users', uid, 'chapters', id), {
          title: (patch.title !== undefined ? patch.title : existingChap.title).trim().slice(0, 140),
          isDifficult: patch.isDifficult !== undefined ? patch.isDifficult : existingChap.isDifficult,
          difficulty: patch.difficulty !== undefined ? patch.difficulty : existingChap.difficulty,
          notes: nextNotes.slice(0, 15000),
          formulas: nextFormulas.slice(0, 8000),
          order: patch.order !== undefined ? clamp(patch.order, 0, 10000) : existingChap.order,
          updatedAt: serverTimestamp(),
        });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${uid}/chapters/${id}`);
    }
  };

  const deleteChapter: AppContextValue['deleteChapter'] = async (id) => {
    if (!firebaseUser) return;
    const uid = firebaseUser.uid;
    try {
      await deleteDoc(doc(db, 'users', uid, 'chapters', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `users/${uid}/chapters/${id}`);
    }
  };

  const recordFocusSession: AppContextValue['recordFocusSession'] = async (input) => {
    if (!firebaseUser) return;
    const uid = firebaseUser.uid;
    const id = makeId('focus');
    const isBreak = input.mode === 'short_break' || input.mode === 'long_break';
    const dur = clamp(input.durationMinutes, 1, 300);
    const xpEarned = isBreak ? 0 : clamp(Math.round(dur * 2), 10, 300);
    const todayKey = getTodayDateKey();

    try {
      await setDoc(doc(db, 'users', uid, 'focusSessions', id), {
        id,
        uid,
        subjectId: input.subjectId.slice(0, 128),
        subjectTitle: input.subjectTitle.slice(0, 100),
        chapterId: input.chapterId.slice(0, 128),
        durationMinutes: dur,
        mode: input.mode,
        completedAt: new Date().toISOString().slice(0, 19),
        dateKey: todayKey,
        xpEarned,
        createdAt: serverTimestamp(),
      });
      if (!isBreak) {
        await awardProgress(xpEarned, dur, ['first_candle']);
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `users/${uid}/focusSessions/${id}`);
    }
  };

  const claimMission: AppContextValue['claimMission'] = async (mission) => {
    if (!firebaseUser) return { awarded: false, xpEarned: 0 };
    const uid = firebaseUser.uid;
    const mRef = doc(db, 'users', uid, 'missions', mission.id);
    const todayKey = getTodayDateKey();

    try {
      const awarded = await runTransaction(db, async (tx) => {
        const snap = await tx.get(mRef);
        if (!snap.exists()) return false;
        const data = snap.data() as Mission;
        if (data.xpAwarded) {
          // Already rewarded; toggle visual completion only if custom? Never re-award XP.
          return false;
        }
        tx.update(mRef, {
          completed: true,
          xpAwarded: true,
          claimedDate: todayKey,
          updatedAt: serverTimestamp(),
        });
        return true;
      });

      if (awarded) {
        await awardProgress(mission.xpReward, 0);
        return { awarded: true, xpEarned: mission.xpReward };
      }
      return { awarded: false, xpEarned: 0 };
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${uid}/missions/${mission.id}`);
    }
  };

  const addCustomMission: AppContextValue['addCustomMission'] = async (input) => {
    if (!firebaseUser) return;
    const uid = firebaseUser.uid;
    const id = makeId('miss');
    try {
      await setDoc(doc(db, 'users', uid, 'missions', id), {
        id,
        uid,
        title: input.title.trim().slice(0, 120),
        description: input.description.trim().slice(0, 300),
        type: 'custom',
        xpReward: clamp(input.xpReward, 5, 250),
        completed: false,
        xpAwarded: false,
        claimedDate: '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `users/${uid}/missions/${id}`);
    }
  };

  const deleteMission: AppContextValue['deleteMission'] = async (id) => {
    if (!firebaseUser) return;
    const uid = firebaseUser.uid;
    try {
      await deleteDoc(doc(db, 'users', uid, 'missions', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `users/${uid}/missions/${id}`);
    }
  };

  const addBacklogItem: AppContextValue['addBacklogItem'] = async (input) => {
    if (!firebaseUser) return;
    const uid = firebaseUser.uid;
    const id = makeId('back');
    const cleanSubs = input.subtasks.slice(0, 20).map((s) => s.slice(0, 240));
    try {
      await setDoc(doc(db, 'users', uid, 'backlogItems', id), {
        id,
        uid,
        title: input.title.trim().slice(0, 140),
        subjectTitle: input.subjectTitle.trim().slice(0, 100),
        chapterId: input.chapterId.slice(0, 128),
        deadline: input.deadline.slice(0, 16),
        priority: input.priority,
        estimatedMinutes: clamp(input.estimatedMinutes, 5, 1200),
        completed: false,
        subtasks: cleanSubs,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `users/${uid}/backlogItems/${id}`);
    }
  };

  const updateBacklogItem: AppContextValue['updateBacklogItem'] = async (id, patch) => {
    if (!firebaseUser) return;
    const uid = firebaseUser.uid;
    const existingItem = backlogItems.find((b) => b.id === id);
    if (!existingItem) return;

    const keys = Object.keys(patch);
    const isStatePatch = keys.every((k) => k === 'completed' || k === 'subtasks');
    const cleanSubs = (patch.subtasks ?? existingItem.subtasks).slice(0, 20).map((s) => s.slice(0, 240));

    try {
      if (isStatePatch) {
        const nextCompleted = patch.completed !== undefined ? patch.completed : existingItem.completed;
        await updateDoc(doc(db, 'users', uid, 'backlogItems', id), {
          completed: nextCompleted,
          subtasks: cleanSubs,
          updatedAt: serverTimestamp(),
        });
        if (nextCompleted && !existingItem.completed) {
          await awardProgress(35, 0, ['backlog_rescuer']);
        }
      } else {
        await updateDoc(doc(db, 'users', uid, 'backlogItems', id), {
          title: (patch.title ?? existingItem.title).trim().slice(0, 140),
          subjectTitle: (patch.subjectTitle ?? existingItem.subjectTitle).trim().slice(0, 100),
          deadline: (patch.deadline ?? existingItem.deadline).slice(0, 16),
          priority: patch.priority ?? existingItem.priority,
          estimatedMinutes: clamp(patch.estimatedMinutes ?? existingItem.estimatedMinutes, 5, 1200),
          subtasks: cleanSubs,
          updatedAt: serverTimestamp(),
        });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${uid}/backlogItems/${id}`);
    }
  };

  const deleteBacklogItem: AppContextValue['deleteBacklogItem'] = async (id) => {
    if (!firebaseUser) return;
    const uid = firebaseUser.uid;
    try {
      await deleteDoc(doc(db, 'users', uid, 'backlogItems', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `users/${uid}/backlogItems/${id}`);
    }
  };

  const createCustomQuiz: AppContextValue['createCustomQuiz'] = async (input) => {
    if (!firebaseUser || !profile) return;
    const customQuizCount = quizzes.filter((q) => !q.id.startsWith('quiz_calculus_series') && !q.id.startsWith('quiz_cellular_bio')).length;
    if (profile.plan === 'free' && customQuizCount >= FREE_PLAN_LIMITS.maxCustomQuizzes) {
      setShowPricingModal(true);
      return;
    }

    const uid = firebaseUser.uid;
    const quizId = makeId('qdeck');
    const questions = input.questions.slice(0, 30);
    const batch = writeBatch(db);
    batch.set(doc(db, 'users', uid, 'quizzes', quizId), {
      id: quizId,
      uid,
      subjectTitle: input.subjectTitle.trim().slice(0, 100),
      chapterTitle: input.chapterTitle.trim().slice(0, 140),
      topicTag: input.topicTag.trim().slice(0, 60),
      timeLimitSeconds: clamp(input.timeLimitSeconds, 30, 3600),
      questionCount: questions.length,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    questions.forEach((q, idx) => {
      const qId = makeId('qq');
      batch.set(doc(db, 'users', uid, 'quizzes', quizId, 'questions', qId), {
        id: qId,
        uid,
        quizId,
        prompt: q.prompt.trim().slice(0, 600),
        options: q.options.slice(0, 4).map((o) => o.trim().slice(0, 300) || 'Option'),
        correctIndex: clamp(q.correctIndex, 0, 3),
        explanation: q.explanation.trim().slice(0, 1000),
        topicTag: (q.topicTag || input.topicTag).trim().slice(0, 60),
        order: idx,
        createdAt: serverTimestamp(),
      });
    });

    try {
      await batch.commit();
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `users/${uid}/quizzes/${quizId}`);
    }
  };

  const deleteQuiz: AppContextValue['deleteQuiz'] = async (quizId) => {
    if (!firebaseUser) return;
    const uid = firebaseUser.uid;
    try {
      const qSnap = await getDocs(
        query(collection(db, 'users', uid, 'quizzes', quizId, 'questions'), where('uid', '==', uid))
      );
      const batch = writeBatch(db);
      qSnap.forEach((d) => batch.delete(d.ref));
      batch.delete(doc(db, 'users', uid, 'quizzes', quizId));
      await batch.commit();
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `users/${uid}/quizzes/${quizId}`);
    }
  };

  const fetchQuizQuestions: AppContextValue['fetchQuizQuestions'] = async (quizId) => {
    if (!firebaseUser) return [];
    const uid = firebaseUser.uid;
    try {
      const snap = await getDocs(
        query(collection(db, 'users', uid, 'quizzes', quizId, 'questions'), where('uid', '==', uid))
      );
      return snap.docs.map((d) => d.data() as QuizQuestion).sort((a, b) => a.order - b.order);
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, `users/${uid}/quizzes/${quizId}/questions`);
    }
  };

  const recordQuizAttempt: AppContextValue['recordQuizAttempt'] = async (input) => {
    if (!firebaseUser) return 0;
    const uid = firebaseUser.uid;
    const id = makeId('att');
    const todayKey = getTodayDateKey();
    const xpEarned = clamp(25 + Math.round(input.score * 0.75), 15, 150);

    try {
      await setDoc(doc(db, 'users', uid, 'quizAttempts', id), {
        id,
        uid,
        quizId: input.quizId,
        quizTitle: input.quizTitle.slice(0, 140),
        subjectTitle: input.subjectTitle.slice(0, 100),
        topicTag: input.topicTag.slice(0, 60),
        score: clamp(input.score, 0, 100),
        correctCount: clamp(input.correctCount, 0, 100),
        totalQuestions: clamp(input.totalQuestions, 1, 100),
        durationSeconds: clamp(input.durationSeconds, 0, 7200),
        xpEarned,
        dateKey: todayKey,
        weakTopics: input.weakTopics.slice(0, 10).map((t) => t.slice(0, 64)),
        createdAt: serverTimestamp(),
      });
      await awardProgress(xpEarned, 0, input.score >= 80 ? ['quiz_victor'] : []);
      return xpEarned;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `users/${uid}/quizAttempts/${id}`);
    }
  };

  const addExam: AppContextValue['addExam'] = async (input) => {
    if (!firebaseUser) return;
    const uid = firebaseUser.uid;
    const id = makeId('exam');
    const totalUnits = clamp(input.totalSyllabusUnits, 1, 100);
    const doneUnits = clamp(input.completedSyllabusUnits, 0, totalUnits);

    try {
      await setDoc(doc(db, 'users', uid, 'exams', id), {
        id,
        uid,
        title: input.title.trim().slice(0, 120),
        subjectId: input.subjectId.slice(0, 128),
        subjectTitle: input.subjectTitle.trim().slice(0, 100),
        examDate: input.examDate.slice(0, 16),
        location: input.location.trim().slice(0, 120),
        notes: input.notes.trim().slice(0, 1000),
        totalSyllabusUnits: totalUnits,
        completedSyllabusUnits: doneUnits,
        dailyTargetMinutes: clamp(input.dailyTargetMinutes, 10, 480),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `users/${uid}/exams/${id}`);
    }
  };

  const updateExam: AppContextValue['updateExam'] = async (id, patch) => {
    if (!firebaseUser) return;
    const uid = firebaseUser.uid;
    const existingExam = exams.find((e) => e.id === id);
    if (!existingExam) return;

    const keys = Object.keys(patch);
    const onlyUnits = keys.length === 1 && keys[0] === 'completedSyllabusUnits';
    const nextTotal = clamp(patch.totalSyllabusUnits ?? existingExam.totalSyllabusUnits, 1, 100);
    const nextDone = clamp(patch.completedSyllabusUnits ?? existingExam.completedSyllabusUnits, 0, nextTotal);

    try {
      if (onlyUnits) {
        await updateDoc(doc(db, 'users', uid, 'exams', id), {
          completedSyllabusUnits: nextDone,
          updatedAt: serverTimestamp(),
        });
      } else {
        await updateDoc(doc(db, 'users', uid, 'exams', id), {
          title: (patch.title ?? existingExam.title).trim().slice(0, 120),
          subjectId: (patch.subjectId ?? existingExam.subjectId).slice(0, 128),
          subjectTitle: (patch.subjectTitle ?? existingExam.subjectTitle).trim().slice(0, 100),
          examDate: (patch.examDate ?? existingExam.examDate).slice(0, 16),
          location: (patch.location ?? existingExam.location).trim().slice(0, 120),
          notes: (patch.notes ?? existingExam.notes).trim().slice(0, 1000),
          totalSyllabusUnits: nextTotal,
          completedSyllabusUnits: nextDone,
          dailyTargetMinutes: clamp(patch.dailyTargetMinutes ?? existingExam.dailyTargetMinutes, 10, 480),
          updatedAt: serverTimestamp(),
        });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${uid}/exams/${id}`);
    }
  };

  const deleteExam: AppContextValue['deleteExam'] = async (id) => {
    if (!firebaseUser) return;
    const uid = firebaseUser.uid;
    try {
      await deleteDoc(doc(db, 'users', uid, 'exams', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `users/${uid}/exams/${id}`);
    }
  };

  const deleteAccountAndData: AppContextValue['deleteAccountAndData'] = async () => {
    if (!firebaseUser) return;
    const uid = firebaseUser.uid;

    // Delete all subcollections owned by the user
    const subcollections = ['subjects', 'chapters', 'focusSessions', 'missions', 'backlogItems', 'quizAttempts', 'exams'];
    for (const colName of subcollections) {
      const snap = await getDocs(query(collection(db, 'users', uid, colName), where('uid', '==', uid)));
      const batch = writeBatch(db);
      snap.forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }

    // Delete quizzes & nested questions
    const qSnap = await getDocs(query(collection(db, 'users', uid, 'quizzes'), where('uid', '==', uid)));
    for (const qDoc of qSnap.docs) {
      const questSnap = await getDocs(
        query(collection(db, 'users', uid, 'quizzes', qDoc.id, 'questions'), where('uid', '==', uid))
      );
      const qBatch = writeBatch(db);
      questSnap.forEach((qd) => qBatch.delete(qd.ref));
      qBatch.delete(qDoc.ref);
      await qBatch.commit();
    }

    await deleteDoc(doc(db, 'users', uid, 'private', 'account'));
    await deleteDoc(doc(db, 'users', uid));

    try {
      await deleteUser(firebaseUser);
    } catch (err) {
      const code = (err as { code?: string }).code;
      if (code === 'auth/requires-recent-login') {
        await reauthenticateWithPopup(firebaseUser, googleProvider);
        await deleteUser(firebaseUser);
      } else {
        throw err;
      }
    }
  };

  return (
    <AppContext.Provider
      value={{
        firebaseUser,
        authLoading,
        dataLoading,
        syncError,
        profile,
        privateAccount,
        subjects,
        chapters,
        focusSessions,
        missions,
        backlogItems,
        quizzes,
        quizAttempts,
        exams,
        activeSection,
        setActiveSection,
        showPricingModal,
        setShowPricingModal,
        signInWithGoogle,
        signOutUser,
        updatePreferences,
        addSubject,
        updateSubject,
        deleteSubject,
        addChapter,
        updateChapter,
        deleteChapter,
        recordFocusSession,
        claimMission,
        addCustomMission,
        deleteMission,
        addBacklogItem,
        updateBacklogItem,
        deleteBacklogItem,
        createCustomQuiz,
        deleteQuiz,
        fetchQuizQuestions,
        recordQuizAttempt,
        addExam,
        updateExam,
        deleteExam,
        deleteAccountAndData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
