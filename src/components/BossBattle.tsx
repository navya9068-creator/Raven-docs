import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Plus,
  Swords,
  Trash2,
  X,
} from 'lucide-react';
import bossBattleImg from '../assets/images/boss_battle_arena_1794719608005.jpg';
import { useApp } from '../contexts/AppContext';
import {
  encodeSubtask,
  FREE_PLAN_LIMITS,
  getTodayDateKey,
  type Quiz,
  type QuizQuestion,
} from '../types/domain';

interface DraftQuestion {
  prompt: string;
  options: [string, string, string, string];
  correctIndex: number;
  explanation: string;
  topicTag: string;
}

export const BossBattle: React.FC = () => {
  const {
    profile,
    quizzes,
    quizAttempts,
    fetchQuizQuestions,
    recordQuizAttempt,
    createCustomQuiz,
    deleteQuiz,
    addBacklogItem,
    setShowPricingModal,
    setActiveSection,
  } = useApp();

  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [lastXpEarned, setLastXpEarned] = useState(0);

  // Create Quiz Modal
  const [showCreate, setShowCreate] = useState(false);
  const [newSubject, setNewSubject] = useState('');
  const [newChapter, setNewChapter] = useState('');
  const [newTopic, setNewTopic] = useState('');
  const [newTimeLimit, setNewTimeLimit] = useState(180);
  const [draftQuestions, setDraftQuestions] = useState<DraftQuestion[]>([
    {
      prompt: '',
      options: ['', '', '', ''],
      correctIndex: 0,
      explanation: '',
      topicTag: '',
    },
  ]);

  const isFree = profile?.plan !== 'premium';
  const isAdhd = Boolean(profile?.adhdMode);
  const todayKey = getTodayDateKey();
  const attemptsToday = quizAttempts.filter((a) => a.dateKey === todayKey).length;

  useEffect(() => {
    if (!activeQuiz || submitted || isAdhd || secondsLeft <= 0) return;
    const t = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(t);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(t);
  }, [activeQuiz, submitted, isAdhd, secondsLeft]);

  useEffect(() => {
    if (activeQuiz && !submitted && !isAdhd && secondsLeft === 0 && questions.length > 0) {
      void handleSubmitQuiz();
    }
  });

  const startQuiz = async (quiz: Quiz) => {
    if (isFree && attemptsToday >= FREE_PLAN_LIMITS.maxDailyQuizAttempts) {
      setShowPricingModal(true);
      return;
    }
    setLoadingQuestions(true);
    setSubmitted(false);
    setAnswers({});
    setActiveQuiz(quiz);
    setSecondsLeft(quiz.timeLimitSeconds);
    try {
      const qs = await fetchQuizQuestions(quiz.id);
      setQuestions(qs);
    } finally {
      setLoadingQuestions(false);
    }
  };

  const handleSubmitQuiz = async () => {
    if (!activeQuiz || submitted || questions.length === 0) return;
    setSubmitted(true);

    let correctCount = 0;
    const weakSet = new Set<string>();
    questions.forEach((q, idx) => {
      if (answers[idx] === q.correctIndex) {
        correctCount += 1;
      } else {
        weakSet.add(q.topicTag || activeQuiz.topicTag);
      }
    });

    const score = Math.round((correctCount / questions.length) * 100);
    const elapsed = Math.max(1, activeQuiz.timeLimitSeconds - secondsLeft);
    const xp = await recordQuizAttempt({
      quizId: activeQuiz.id,
      quizTitle: activeQuiz.chapterTitle,
      subjectTitle: activeQuiz.subjectTitle,
      topicTag: activeQuiz.topicTag,
      score,
      correctCount,
      totalQuestions: questions.length,
      durationSeconds: isAdhd ? 60 : elapsed,
      weakTopics: Array.from(weakSet),
    });
    setLastXpEarned(xp);
  };

  const weakTopicSummary = useMemo(() => {
    const counts: Record<string, { misses: number; subject: string }> = {};
    for (const att of quizAttempts) {
      for (const wt of att.weakTopics) {
        if (!counts[wt]) counts[wt] = { misses: 0, subject: att.subjectTitle };
        counts[wt].misses += 1;
      }
    }
    return Object.entries(counts)
      .map(([topic, info]) => ({ topic, ...info }))
      .sort((a, b) => b.misses - a.misses);
  }, [quizAttempts]);

  const sendWeakTopicToBacklog = async (topic: string, subject: string) => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    await addBacklogItem({
      title: `Review Weak Topic: ${topic}`,
      subjectTitle: subject,
      chapterId: '',
      deadline: getTodayDateKey(d),
      priority: 'high',
      estimatedMinutes: 35,
      subtasks: [
        encodeSubtask({ done: false, label: `Re-read explanation notes for ${topic}` }),
        encodeSubtask({ done: false, label: `Retake ${subject} Boss Battle` }),
      ],
    });
    setActiveSection('backlog');
  };

  const handleCreateQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    const validQuestions = draftQuestions.filter(
      (q) => q.prompt.trim() && q.options.every((o) => o.trim())
    );
    if (!newSubject.trim() || !newChapter.trim() || validQuestions.length === 0) return;

    await createCustomQuiz({
      subjectTitle: newSubject,
      chapterTitle: newChapter,
      topicTag: newTopic.trim() || newSubject.trim(),
      timeLimitSeconds: newTimeLimit,
      questions: validQuestions.map((q) => ({
        prompt: q.prompt,
        options: q.options,
        correctIndex: q.correctIndex,
        explanation: q.explanation || 'Review chapter notes for full derivation.',
        topicTag: q.topicTag.trim() || newTopic.trim() || newSubject.trim(),
      })),
    });

    setShowCreate(false);
    setNewSubject('');
    setNewChapter('');
    setNewTopic('');
    setDraftQuestions([
      { prompt: '', options: ['', '', '', ''], correctIndex: 0, explanation: '', topicTag: '' },
    ]);
  };

  if (activeQuiz) {
    const answeredCount = Object.keys(answers).length;
    const correctCount = questions.reduce((acc, q, idx) => (answers[idx] === q.correctIndex ? acc + 1 : acc), 0);
    const scorePct = questions.length ? Math.round((correctCount / questions.length) * 100) : 0;

    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-4 pb-4 border-b border-[var(--da-border)]">
          <div>
            <p className="text-xs text-[var(--da-gold-bright)]">{activeQuiz.subjectTitle}</p>
            <h1 className="font-display text-2xl sm:text-3xl font-semibold text-[var(--da-ink)]">
              {activeQuiz.chapterTitle}
            </h1>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {!isAdhd && !submitted && (
              <span className="font-mono-tabular text-sm px-3 py-1.5 rounded-lg bg-[var(--da-surface)] border border-[var(--da-border)] text-[var(--da-parchment)] inline-flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-[var(--da-gold-bright)]" />
                {Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, '0')}
              </span>
            )}
            <button
              type="button"
              onClick={() => setActiveQuiz(null)}
              className="min-h-[40px] px-3.5 rounded-lg border border-[var(--da-border)] text-xs text-[var(--da-muted)] hover:text-[var(--da-ink)]"
            >
              Exit Arena
            </button>
          </div>
        </div>

        {loadingQuestions ? (
          <p className="text-sm text-[var(--da-muted)] py-8">Loading examination parchment…</p>
        ) : questions.length === 0 ? (
          <p className="text-sm text-[var(--da-muted)] py-8">No questions found in this quiz deck.</p>
        ) : (
          <>
            {submitted && (
              <section className="rounded-2xl bg-[var(--da-walnut)]/50 border border-[var(--da-gold)]/60 p-6 space-y-2">
                <p className="text-xs text-[var(--da-gold-bright)]">Examination Complete</p>
                <div className="flex flex-wrap items-baseline justify-between gap-4">
                  <h2 className="font-display text-3xl font-semibold text-[var(--da-ink)]">
                    Score: <span className="font-mono-tabular">{scorePct}%</span> ({correctCount}/{questions.length})
                  </h2>
                  <span className="font-mono-tabular text-sm text-[var(--da-gold-bright)]">
                    +{lastXpEarned} XP Awarded
                  </span>
                </div>
              </section>
            )}

            <div className="space-y-5">
              {questions.map((q, qIdx) => {
                const chosen = answers[qIdx];
                return (
                  <article
                    key={q.id}
                    className="rounded-2xl bg-[var(--da-surface)] border border-[var(--da-border)] p-5 space-y-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-base font-medium text-[var(--da-ink)] leading-snug">
                        <span className="font-mono-tabular text-[var(--da-gold-bright)] mr-2">{qIdx + 1}.</span>
                        {q.prompt}
                      </p>
                      <span className="text-[11px] text-[var(--da-muted)] whitespace-nowrap">{q.topicTag}</span>
                    </div>

                    <div className="space-y-2">
                      {q.options.map((opt, oIdx) => {
                        const isSelected = chosen === oIdx;
                        const isCorrect = q.correctIndex === oIdx;
                        let style = 'bg-[var(--da-bg)]/60 border-[var(--da-border)] text-[var(--da-parchment)]';
                        if (!submitted && isSelected) {
                          style = 'bg-[var(--da-walnut)] border-[var(--da-gold-bright)] text-[var(--da-ink)]';
                        } else if (submitted && isCorrect) {
                          style = 'bg-emerald-950/60 border-emerald-500/70 text-emerald-100';
                        } else if (submitted && isSelected && !isCorrect) {
                          style = 'bg-red-950/60 border-red-400/60 text-red-100';
                        }

                        return (
                          <button
                            key={oIdx}
                            type="button"
                            disabled={submitted}
                            onClick={() => setAnswers((prev) => ({ ...prev, [qIdx]: oIdx }))}
                            className={`w-full min-h-[44px] text-left px-4 py-2.5 rounded-xl border text-sm transition-colors flex items-center justify-between gap-2 ${style}`}
                          >
                            <span>{opt}</span>
                            {submitted && isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>

                    {submitted && (
                      <div className="pt-3 border-t border-[var(--da-border)] text-xs text-[var(--da-parchment)]/90 leading-relaxed">
                        <strong className="text-[var(--da-gold-bright)]">Explanation: </strong>
                        {q.explanation}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>

            {!submitted ? (
              <div className="flex items-center justify-between gap-4 pt-2">
                <span className="text-xs text-[var(--da-muted)] font-mono-tabular">
                  {answeredCount} of {questions.length} answered
                </span>
                <button
                  type="button"
                  onClick={() => void handleSubmitQuiz()}
                  className="min-h-[48px] px-6 rounded-xl bg-[#80664B] hover:bg-[#947657] text-[#EDE1CB] text-sm font-medium transition-colors"
                >
                  Submit Examination
                </button>
              </div>
            ) : (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setActiveQuiz(null)}
                  className="min-h-[44px] px-5 rounded-xl bg-[#80664B] hover:bg-[#947657] text-[#EDE1CB] text-sm font-medium"
                >
                  Return to Boss Battle Hall
                </button>
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Arena Hero */}
      <section className="relative rounded-2xl overflow-hidden border border-[var(--da-border)] bg-[var(--da-surface)]">
        <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
          <div className="lg:col-span-8 p-6 space-y-3 flex flex-col justify-center">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs text-[var(--da-gold-bright)]">Boss Battle</p>
                <h1 className="font-display text-3xl sm:text-4xl font-semibold text-[var(--da-ink)]">
                  Timed Chapter Examinations
                </h1>
              </div>
              {isFree && (
                <button
                  type="button"
                  onClick={() => setShowPricingModal(true)}
                  className="text-xs text-[var(--da-muted)] hover:text-[var(--da-parchment)] underline underline-offset-4 font-mono-tabular"
                >
                  {attemptsToday} / {FREE_PLAN_LIMITS.maxDailyQuizAttempts} daily trials (Free)
                </button>
              )}
            </div>
            <p className="text-sm text-[var(--da-muted)] max-w-2xl">
              Challenge yourself on chapter mastery, review detailed answer explanations, and isolate weak topics straight into your Backlog Rescue plan.
            </p>
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowCreate(true)}
                className="min-h-[44px] inline-flex items-center gap-2 rounded-xl bg-[#80664B] hover:bg-[#947657] text-[#EDE1CB] px-4 py-2 text-sm font-medium transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Create Chapter Quiz</span>
              </button>
            </div>
          </div>

          <div className="hidden lg:block lg:col-span-4 relative min-h-[180px]">
            <img
              src={bossBattleImg}
              alt="Brass hourglass and sealed examination parchment"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[var(--da-surface)] via-[var(--da-surface)]/30 to-transparent" />
          </div>
        </div>
      </section>

      {/* Quiz Decks */}
      <section className="space-y-3">
        <h2 className="font-display text-2xl font-semibold text-[var(--da-parchment)]">Available Chapter Trials</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {quizzes.map((quiz) => (
            <article
              key={quiz.id}
              className="rounded-2xl bg-[var(--da-surface)] border border-[var(--da-border)] p-5 flex flex-col justify-between gap-4"
            >
              <div className="space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs text-[var(--da-gold-bright)]">{quiz.subjectTitle}</p>
                  <button
                    type="button"
                    onClick={() => void deleteQuiz(quiz.id)}
                    aria-label={`Delete ${quiz.chapterTitle}`}
                    className="min-h-[36px] min-w-[36px] -mt-1 -mr-1 flex items-center justify-center text-[var(--da-muted)] hover:text-red-300"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <h3 className="font-display text-xl font-semibold text-[var(--da-ink)]">{quiz.chapterTitle}</h3>
                <p className="text-xs text-[var(--da-muted)] font-mono-tabular">
                  {quiz.questionCount} questions · {Math.round(quiz.timeLimitSeconds / 60)} min · {quiz.topicTag}
                </p>
              </div>
              <button
                type="button"
                onClick={() => void startQuiz(quiz)}
                className="min-h-[44px] w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--da-walnut)] hover:bg-[#5B4337] border border-[var(--da-gold)]/50 text-[var(--da-ink)] text-sm font-medium transition-colors"
              >
                <Swords className="w-4 h-4 text-[var(--da-gold-bright)]" />
                <span>Begin Trial</span>
              </button>
            </article>
          ))}
        </div>
      </section>

      {/* Weak-Topic Analysis & History */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <section className="lg:col-span-6 rounded-2xl bg-[var(--da-surface)] border border-[var(--da-border)] p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-semibold text-[var(--da-parchment)]">Weak-Topic Analysis</h2>
            <AlertCircle className="w-4 h-4 text-[var(--da-gold-bright)]" />
          </div>
          {weakTopicSummary.length === 0 ? (
            <p className="text-sm text-[var(--da-muted)] py-4">
              No recurring weak topics flagged yet. Complete a trial to populate diagnostics.
            </p>
          ) : (
            <div className="space-y-2.5">
              {weakTopicSummary.map((wt) => (
                <div
                  key={wt.topic}
                  className="p-3.5 rounded-xl bg-[var(--da-bg)]/60 border border-[var(--da-border)] flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[var(--da-ink)] truncate">{wt.topic}</p>
                    <p className="text-xs text-[var(--da-muted)]">
                      {wt.subject} · Missed in {wt.misses} attempt{wt.misses > 1 ? 's' : ''}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void sendWeakTopicToBacklog(wt.topic, wt.subject)}
                    className="min-h-[38px] px-3 rounded-lg border border-[var(--da-gold)]/50 text-xs text-[var(--da-parchment)] hover:bg-[var(--da-walnut)] whitespace-nowrap"
                  >
                    Rescue Topic
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="lg:col-span-6 rounded-2xl bg-[var(--da-surface)] border border-[var(--da-border)] p-5 space-y-4">
          <h2 className="font-display text-xl font-semibold text-[var(--da-parchment)]">Quiz History</h2>
          {quizAttempts.length === 0 ? (
            <p className="text-sm text-[var(--da-muted)] py-4">No completed quiz attempts recorded yet.</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {quizAttempts.map((att) => (
                <div
                  key={att.id}
                  className="py-2.5 border-b border-[var(--da-border)] last:border-0 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="min-w-0">
                    <p className="text-sm text-[var(--da-ink)] truncate">{att.quizTitle}</p>
                    <p className="text-[var(--da-muted)] font-mono-tabular">
                      {att.dateKey} · {att.correctCount}/{att.totalQuestions} correct
                    </p>
                  </div>
                  <span className="font-mono-tabular text-sm font-semibold text-[var(--da-gold-bright)] shrink-0">
                    {att.score}%
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Create Quiz Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <form
            onSubmit={(e) => void handleCreateQuiz(e)}
            className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl bg-[var(--da-surface)] border border-[var(--da-border)] text-[var(--da-ink)]"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--da-border)]">
              <h3 className="font-display text-2xl font-semibold text-[var(--da-parchment)]">
                Create Custom Boss Battle Quiz
              </h3>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="min-h-[40px] min-w-[40px] flex items-center justify-center text-[var(--da-muted)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-[var(--da-muted)]">Subject</label>
                  <input
                    required
                    maxLength={100}
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    placeholder="e.g., Microeconomics"
                    className="w-full min-h-[44px] px-3.5 rounded-xl bg-[var(--da-bg)] border border-[var(--da-border)] text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-[var(--da-muted)]">Chapter Title</label>
                  <input
                    required
                    maxLength={140}
                    value={newChapter}
                    onChange={(e) => setNewChapter(e.target.value)}
                    placeholder="e.g., Elasticity & Consumer Choice"
                    className="w-full min-h-[44px] px-3.5 rounded-xl bg-[var(--da-bg)] border border-[var(--da-border)] text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-[var(--da-muted)]">Primary Topic Tag</label>
                  <input
                    maxLength={60}
                    value={newTopic}
                    onChange={(e) => setNewTopic(e.target.value)}
                    placeholder="e.g., Demand Curves"
                    className="w-full min-h-[44px] px-3.5 rounded-xl bg-[var(--da-bg)] border border-[var(--da-border)] text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-[var(--da-muted)]">Time Limit (seconds)</label>
                  <input
                    type="number"
                    min={30}
                    max={3600}
                    value={newTimeLimit}
                    onChange={(e) => setNewTimeLimit(Number(e.target.value))}
                    className="w-full min-h-[44px] px-3.5 rounded-xl bg-[var(--da-bg)] border border-[var(--da-border)] text-sm font-mono-tabular"
                  />
                </div>
              </div>

              <div className="space-y-4 pt-2 border-t border-[var(--da-border)]">
                {draftQuestions.map((dq, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-[var(--da-bg)]/50 border border-[var(--da-border)] space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-[var(--da-gold-bright)]">Question {idx + 1}</span>
                      {draftQuestions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setDraftQuestions((prev) => prev.filter((_, i) => i !== idx))}
                          className="text-xs text-red-300"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <input
                      required
                      maxLength={600}
                      value={dq.prompt}
                      onChange={(e) =>
                        setDraftQuestions((prev) =>
                          prev.map((item, i) => (i === idx ? { ...item, prompt: e.target.value } : item))
                        )
                      }
                      placeholder="Question prompt…"
                      className="w-full min-h-[42px] px-3 rounded-lg bg-[var(--da-bg)] border border-[var(--da-border)] text-sm"
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {dq.options.map((opt, oIdx) => (
                        <input
                          key={oIdx}
                          required
                          maxLength={300}
                          value={opt}
                          onChange={(e) =>
                            setDraftQuestions((prev) =>
                              prev.map((item, i) => {
                                if (i !== idx) return item;
                                const nextOpts = [...item.options] as [string, string, string, string];
                                nextOpts[oIdx] = e.target.value;
                                return { ...item, options: nextOpts };
                              })
                            )
                          }
                          placeholder={`Option ${oIdx + 1}`}
                          className="w-full min-h-[40px] px-3 rounded-lg bg-[var(--da-bg)] border border-[var(--da-border)] text-xs"
                        />
                      ))}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <select
                        value={dq.correctIndex}
                        onChange={(e) =>
                          setDraftQuestions((prev) =>
                            prev.map((item, i) => (i === idx ? { ...item, correctIndex: Number(e.target.value) } : item))
                          )
                        }
                        className="w-full min-h-[40px] px-3 rounded-lg bg-[var(--da-bg)] border border-[var(--da-border)] text-xs"
                      >
                        <option value={0}>Correct Answer: Option 1</option>
                        <option value={1}>Correct Answer: Option 2</option>
                        <option value={2}>Correct Answer: Option 3</option>
                        <option value={3}>Correct Answer: Option 4</option>
                      </select>
                      <input
                        maxLength={60}
                        value={dq.topicTag}
                        onChange={(e) =>
                          setDraftQuestions((prev) =>
                            prev.map((item, i) => (i === idx ? { ...item, topicTag: e.target.value } : item))
                          )
                        }
                        placeholder="Sub-topic tag (optional)"
                        className="w-full min-h-[40px] px-3 rounded-lg bg-[var(--da-bg)] border border-[var(--da-border)] text-xs"
                      />
                    </div>
                    <input
                      maxLength={1000}
                      value={dq.explanation}
                      onChange={(e) =>
                        setDraftQuestions((prev) =>
                          prev.map((item, i) => (i === idx ? { ...item, explanation: e.target.value } : item))
                        )
                      }
                      placeholder="Answer explanation shown after submission…"
                      className="w-full min-h-[40px] px-3 rounded-lg bg-[var(--da-bg)] border border-[var(--da-border)] text-xs"
                    />
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() =>
                    setDraftQuestions((prev) => [
                      ...prev,
                      { prompt: '', options: ['', '', '', ''], correctIndex: 0, explanation: '', topicTag: '' },
                    ])
                  }
                  className="min-h-[40px] px-4 rounded-xl border border-[var(--da-border)] text-xs text-[var(--da-parchment)]"
                >
                  + Add Question
                </button>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-[var(--da-border)] flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="min-h-[44px] px-4 rounded-xl border border-[var(--da-border)] text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="min-h-[44px] px-5 rounded-xl bg-[#80664B] hover:bg-[#947657] text-[#EDE1CB] text-sm font-medium"
              >
                Publish Quiz Deck
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
