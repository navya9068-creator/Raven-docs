import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  Circle,
  Edit3,
  FileText,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import libraryBannerImg from '../assets/images/library_archive_banner_1794719607725.jpg';
import { useApp } from '../contexts/AppContext';
import { FREE_PLAN_LIMITS, type Chapter, type DifficultyTier, type Subject } from '../types/domain';

const SUBJECT_PALETTES = ['#B89872', '#9C7B5E', '#8C624A', '#A68E6E', '#75614B'];

export const PersonalLibrary: React.FC = () => {
  const {
    profile,
    subjects,
    chapters,
    addSubject,
    updateSubject,
    deleteSubject,
    addChapter,
    updateChapter,
    deleteChapter,
    setShowPricingModal,
  } = useApp();

  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('all');
  const [filterMode, setFilterMode] = useState<'all' | 'pending' | 'completed' | 'difficult'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Subject Modal
  const [subjectModal, setSubjectModal] = useState<{ open: boolean; editing: Subject | null }>({ open: false, editing: null });
  const [subjTitle, setSubjTitle] = useState('');
  const [subjCode, setSubjCode] = useState('');
  const [subjColor, setSubjColor] = useState(SUBJECT_PALETTES[0]);
  const [subjTargetHours, setSubjTargetHours] = useState(20);

  // Chapter Modal
  const [chapterModal, setChapterModal] = useState<{ open: boolean; editing: Chapter | null; subjectId: string }>({
    open: false,
    editing: null,
    subjectId: '',
  });
  const [chapTitle, setChapTitle] = useState('');
  const [chapDifficulty, setChapDifficulty] = useState<DifficultyTier>('standard');
  const [chapIsDifficult, setChapIsDifficult] = useState(false);
  const [chapNotes, setChapNotes] = useState('');
  const [chapFormulas, setChapFormulas] = useState('');

  const notedChaptersCount = chapters.filter((c) => c.notes.trim() || c.formulas.trim()).length;
  const isFree = profile?.plan !== 'premium';

  const openNewSubject = () => {
    setSubjTitle('');
    setSubjCode('');
    setSubjColor(SUBJECT_PALETTES[0]);
    setSubjTargetHours(20);
    setSubjectModal({ open: true, editing: null });
  };

  const openEditSubject = (s: Subject) => {
    setSubjTitle(s.title);
    setSubjCode(s.code);
    setSubjColor(s.color);
    setSubjTargetHours(s.targetHours);
    setSubjectModal({ open: true, editing: s });
  };

  const saveSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjTitle.trim()) return;
    if (subjectModal.editing) {
      await updateSubject(subjectModal.editing.id, {
        title: subjTitle,
        code: subjCode,
        color: subjColor,
        targetHours: subjTargetHours,
      });
    } else {
      const id = await addSubject({
        title: subjTitle,
        code: subjCode,
        color: subjColor,
        targetHours: subjTargetHours,
      });
      if (id) setSelectedSubjectId(id);
    }
    setSubjectModal({ open: false, editing: null });
  };

  const openNewChapter = (subjectId: string) => {
    setChapTitle('');
    setChapDifficulty('standard');
    setChapIsDifficult(false);
    setChapNotes('');
    setChapFormulas('');
    setChapterModal({ open: true, editing: null, subjectId });
  };

  const openEditChapter = (c: Chapter) => {
    setChapTitle(c.title);
    setChapDifficulty(c.difficulty);
    setChapIsDifficult(c.isDifficult);
    setChapNotes(c.notes);
    setChapFormulas(c.formulas);
    setChapterModal({ open: true, editing: c, subjectId: c.subjectId });
  };

  const saveChapter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chapTitle.trim() || !chapterModal.subjectId) return;
    if (chapterModal.editing) {
      await updateChapter(chapterModal.editing.id, {
        title: chapTitle,
        difficulty: chapDifficulty,
        isDifficult: chapIsDifficult,
        notes: chapNotes,
        formulas: chapFormulas,
      });
    } else {
      await addChapter({
        subjectId: chapterModal.subjectId,
        title: chapTitle,
        difficulty: chapDifficulty,
        isDifficult: chapIsDifficult,
        notes: chapNotes,
        formulas: chapFormulas,
      });
    }
    setChapterModal({ open: false, editing: null, subjectId: '' });
  };

  const filteredChapters = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return chapters.filter((c) => {
      if (selectedSubjectId !== 'all' && c.subjectId !== selectedSubjectId) return false;
      if (filterMode === 'pending' && c.completed) return false;
      if (filterMode === 'completed' && !c.completed) return false;
      if (filterMode === 'difficult' && !c.isDifficult && c.difficulty !== 'challenging') return false;
      if (!q) return true;
      const subj = subjects.find((s) => s.id === c.subjectId);
      return (
        c.title.toLowerCase().includes(q) ||
        c.notes.toLowerCase().includes(q) ||
        c.formulas.toLowerCase().includes(q) ||
        (subj?.title.toLowerCase().includes(q) ?? false)
      );
    });
  }, [chapters, subjects, selectedSubjectId, filterMode, searchQuery]);

  const activeSubjectForNewChapter =
    selectedSubjectId !== 'all' ? selectedSubjectId : subjects[0]?.id || '';

  return (
    <div className="space-y-6">
      {/* Banner Header */}
      <section className="relative rounded-2xl overflow-hidden border border-[var(--da-border)] bg-[var(--da-surface)]">
        <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
          <div className="lg:col-span-8 p-6 space-y-3 flex flex-col justify-center">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs text-[var(--da-gold-bright)]">Personal Library</p>
                <h1 className="font-display text-3xl sm:text-4xl font-semibold text-[var(--da-ink)]">
                  Subjects, Chapters & Formulas
                </h1>
              </div>
              {isFree && (
                <button
                  type="button"
                  onClick={() => setShowPricingModal(true)}
                  className="text-xs text-[var(--da-muted)] hover:text-[var(--da-parchment)] underline underline-offset-4 font-mono-tabular"
                >
                  {notedChaptersCount} / {FREE_PLAN_LIMITS.maxNotesChapters} noted chapters (Free)
                </button>
              )}
            </div>
            <p className="text-sm text-[var(--da-muted)] max-w-2xl">
              Curate your courses, record formulas and scholarly notes, mark difficult chapters for extra revision, and track chapter mastery.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="button"
                onClick={openNewSubject}
                className="min-h-[44px] inline-flex items-center gap-2 rounded-xl bg-[#80664B] hover:bg-[#947657] text-[#EDE1CB] px-4 py-2 text-sm font-medium transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add Subject</span>
              </button>
              {subjects.length > 0 && (
                <button
                  type="button"
                  onClick={() => openNewChapter(activeSubjectForNewChapter)}
                  className="min-h-[44px] inline-flex items-center gap-2 rounded-xl border border-[var(--da-border)] hover:border-[var(--da-gold)] text-[var(--da-parchment)] px-4 py-2 text-sm font-medium transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Chapter</span>
                </button>
              )}
            </div>
          </div>

          <div className="hidden lg:block lg:col-span-4 relative min-h-[180px]">
            <img
              src={libraryBannerImg}
              alt="Dark walnut university library shelves"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[var(--da-surface)] via-[var(--da-surface)]/30 to-transparent" />
          </div>
        </div>
      </section>

      {/* Search & Filters */}
      <section className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[var(--da-muted)] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search chapters, notes, or formulas…"
            className="w-full min-h-[44px] pl-10 pr-4 rounded-xl bg-[var(--da-surface)] border border-[var(--da-border)] text-sm text-[var(--da-ink)] placeholder:text-[var(--da-muted)] focus:outline-none focus:border-[var(--da-gold-bright)]"
          />
        </div>

        <div className="flex items-center gap-1 p-1 rounded-xl bg-[var(--da-surface)] border border-[var(--da-border)] overflow-x-auto">
          {(['all', 'pending', 'completed', 'difficult'] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setFilterMode(mode)}
              className={`min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-medium capitalize whitespace-nowrap transition-colors ${
                filterMode === mode
                  ? 'bg-[var(--da-walnut)] text-[var(--da-ink)]'
                  : 'text-[var(--da-muted)] hover:text-[var(--da-ink)]'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </section>

      {/* Main Split: Subject Shelf + Chapter List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Subject Shelf */}
        <aside className="lg:col-span-4 space-y-3">
          <h2 className="font-display text-xl font-semibold text-[var(--da-parchment)]">Subjects</h2>
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setSelectedSubjectId('all')}
              className={`w-full min-h-[48px] text-left px-4 py-3 rounded-xl border flex items-center justify-between transition-colors ${
                selectedSubjectId === 'all'
                  ? 'bg-[var(--da-walnut)] border-[var(--da-gold)]/60 text-[var(--da-ink)]'
                  : 'bg-[var(--da-surface)] border-[var(--da-border)] text-[var(--da-muted)] hover:text-[var(--da-ink)]'
              }`}
            >
              <span className="text-sm font-medium">All Subjects</span>
              <span className="font-mono-tabular text-xs">{chapters.length} chapters</span>
            </button>

            {subjects.map((subj) => {
              const subChapters = chapters.filter((c) => c.subjectId === subj.id);
              const done = subChapters.filter((c) => c.completed).length;
              const selected = selectedSubjectId === subj.id;
              return (
                <div
                  key={subj.id}
                  className={`rounded-xl border p-3.5 transition-colors ${
                    selected
                      ? 'bg-[var(--da-walnut)]/80 border-[var(--da-gold)]/60'
                      : 'bg-[var(--da-surface)] border-[var(--da-border)]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedSubjectId(subj.id)}
                      className="flex-1 text-left min-w-0"
                    >
                      <p className="text-xs text-[var(--da-gold-bright)] font-mono-tabular">
                        {subj.code || 'COURSE'} · {done}/{subChapters.length} done
                      </p>
                      <p className="text-sm font-medium text-[var(--da-ink)] truncate mt-0.5">{subj.title}</p>
                    </button>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => openEditSubject(subj)}
                        aria-label={`Edit ${subj.title}`}
                        className="min-h-[36px] min-w-[36px] flex items-center justify-center text-[var(--da-muted)] hover:text-[var(--da-ink)]"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => void deleteSubject(subj.id)}
                        aria-label={`Delete ${subj.title}`}
                        className="min-h-[36px] min-w-[36px] flex items-center justify-center text-[var(--da-muted)] hover:text-red-300"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </aside>

        {/* Chapter List */}
        <section className="lg:col-span-8 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-semibold text-[var(--da-parchment)]">
              Chapters & Study Notes
            </h2>
            <span className="text-xs text-[var(--da-muted)] font-mono-tabular">
              {filteredChapters.length} shown
            </span>
          </div>

          {filteredChapters.length === 0 ? (
            <div className="rounded-2xl bg-[var(--da-surface)] border border-[var(--da-border)] p-10 text-center space-y-3">
              <BookOpen className="w-8 h-8 text-[var(--da-muted)] mx-auto" />
              <p className="text-sm text-[var(--da-muted)]">
                No chapters match your current selection.
              </p>
              {subjects.length > 0 && (
                <button
                  type="button"
                  onClick={() => openNewChapter(activeSubjectForNewChapter)}
                  className="min-h-[44px] px-4 rounded-xl bg-[#80664B] hover:bg-[#947657] text-[#EDE1CB] text-xs font-medium"
                >
                  Create Chapter
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredChapters.map((chap) => {
                const subj = subjects.find((s) => s.id === chap.subjectId);
                return (
                  <article
                    key={chap.id}
                    className="rounded-2xl bg-[var(--da-surface)] border border-[var(--da-border)] p-4 sm:p-5 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => void updateChapter(chap.id, { completed: !chap.completed })}
                        className="flex items-start gap-3 text-left flex-1 min-w-0"
                      >
                        {chap.completed ? (
                          <CheckCircle2 className="w-5 h-5 text-[var(--da-gold-bright)] shrink-0 mt-0.5" />
                        ) : (
                          <Circle className="w-5 h-5 text-[var(--da-muted)] shrink-0 mt-0.5" />
                        )}
                        <div className="min-w-0 space-y-1">
                          <h3 className={`text-base font-medium ${chap.completed ? 'line-through text-[var(--da-muted)]' : 'text-[var(--da-ink)]'}`}>
                            {chap.title}
                          </h3>
                          <p className="text-xs text-[var(--da-muted)] flex flex-wrap items-center gap-2">
                            <span>{subj?.title || 'Subject'}</span>
                            <span aria-hidden="true">·</span>
                            <span className="capitalize">{chap.difficulty}</span>
                            {(chap.isDifficult || chap.difficulty === 'challenging') && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span className="inline-flex items-center gap-1 text-[#D9A066]">
                                  <AlertTriangle className="w-3 h-3" />
                                  <span>Flagged Difficult</span>
                                </span>
                              </>
                            )}
                          </p>
                        </div>
                      </button>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => openEditChapter(chap)}
                          aria-label={`Edit notes for ${chap.title}`}
                          className="min-h-[40px] px-3 rounded-lg border border-[var(--da-border)] hover:border-[var(--da-gold)] text-xs text-[var(--da-parchment)] inline-flex items-center gap-1.5"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Notes</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => void deleteChapter(chap.id)}
                          aria-label={`Delete ${chap.title}`}
                          className="min-h-[40px] min-w-[40px] flex items-center justify-center text-[var(--da-muted)] hover:text-red-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {(chap.notes.trim() || chap.formulas.trim()) && (
                      <div className="pt-3 border-t border-[var(--da-border)] grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                        {chap.notes.trim() && (
                          <div className="space-y-1">
                            <p className="text-[var(--da-gold-bright)] font-medium">Notes</p>
                            <p className="text-[var(--da-parchment)]/85 whitespace-pre-line line-clamp-3 leading-relaxed">
                              {chap.notes}
                            </p>
                          </div>
                        )}
                        {chap.formulas.trim() && (
                          <div className="space-y-1">
                            <p className="text-[var(--da-gold-bright)] font-medium">Formulas & Key Anchors</p>
                            <pre className="font-mono-tabular text-[11px] text-[var(--da-parchment)] bg-[var(--da-bg)]/80 p-2.5 rounded-lg overflow-x-auto whitespace-pre-wrap">
                              {chap.formulas}
                            </pre>
                          </div>
                        )}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* Subject Modal */}
      {subjectModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <form
            onSubmit={(e) => void saveSubject(e)}
            className="w-full max-w-md rounded-2xl bg-[var(--da-surface)] border border-[var(--da-border)] p-6 space-y-4 text-[var(--da-ink)]"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-display text-2xl font-semibold text-[var(--da-parchment)]">
                {subjectModal.editing ? 'Edit Subject' : 'New Subject'}
              </h3>
              <button
                type="button"
                onClick={() => setSubjectModal({ open: false, editing: null })}
                className="min-h-[40px] min-w-[40px] flex items-center justify-center text-[var(--da-muted)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-[var(--da-muted)]">Subject Title</label>
              <input
                required
                maxLength={100}
                value={subjTitle}
                onChange={(e) => setSubjTitle(e.target.value)}
                placeholder="e.g., Linear Algebra"
                className="w-full min-h-[44px] px-3.5 rounded-xl bg-[var(--da-bg)] border border-[var(--da-border)] text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs text-[var(--da-muted)]">Course Code</label>
                <input
                  maxLength={20}
                  value={subjCode}
                  onChange={(e) => setSubjCode(e.target.value)}
                  placeholder="MATH-204"
                  className="w-full min-h-[44px] px-3.5 rounded-xl bg-[var(--da-bg)] border border-[var(--da-border)] text-sm font-mono-tabular"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-[var(--da-muted)]">Target Hours</label>
                <input
                  type="number"
                  min={1}
                  max={1000}
                  value={subjTargetHours}
                  onChange={(e) => setSubjTargetHours(Number(e.target.value))}
                  className="w-full min-h-[44px] px-3.5 rounded-xl bg-[var(--da-bg)] border border-[var(--da-border)] text-sm font-mono-tabular"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSubjectModal({ open: false, editing: null })}
                className="min-h-[44px] px-4 rounded-xl border border-[var(--da-border)] text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="min-h-[44px] px-5 rounded-xl bg-[#80664B] hover:bg-[#947657] text-[#EDE1CB] text-sm font-medium"
              >
                Save Subject
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Chapter Modal */}
      {chapterModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <form
            onSubmit={(e) => void saveChapter(e)}
            className="w-full max-w-xl max-h-[90vh] flex flex-col rounded-2xl bg-[var(--da-surface)] border border-[var(--da-border)] text-[var(--da-ink)]"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--da-border)]">
              <h3 className="font-display text-2xl font-semibold text-[var(--da-parchment)]">
                {chapterModal.editing ? 'Edit Chapter & Notes' : 'New Chapter'}
              </h3>
              <button
                type="button"
                onClick={() => setChapterModal({ open: false, editing: null, subjectId: '' })}
                className="min-h-[40px] min-w-[40px] flex items-center justify-center text-[var(--da-muted)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              {!chapterModal.editing && (
                <div className="space-y-1.5">
                  <label className="text-xs text-[var(--da-muted)]">Subject</label>
                  <select
                    value={chapterModal.subjectId}
                    onChange={(e) => setChapterModal((prev) => ({ ...prev, subjectId: e.target.value }))}
                    className="w-full min-h-[44px] px-3.5 rounded-xl bg-[var(--da-bg)] border border-[var(--da-border)] text-sm"
                  >
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs text-[var(--da-muted)]">Chapter Title</label>
                <input
                  required
                  maxLength={140}
                  value={chapTitle}
                  onChange={(e) => setChapTitle(e.target.value)}
                  placeholder="e.g., Chapter 4: Eigenvalues & Spectral Decomposition"
                  className="w-full min-h-[44px] px-3.5 rounded-xl bg-[var(--da-bg)] border border-[var(--da-border)] text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs text-[var(--da-muted)]">Difficulty Tier</label>
                  <select
                    value={chapDifficulty}
                    onChange={(e) => setChapDifficulty(e.target.value as DifficultyTier)}
                    className="w-full min-h-[44px] px-3.5 rounded-xl bg-[var(--da-bg)] border border-[var(--da-border)] text-sm"
                  >
                    <option value="foundational">Foundational</option>
                    <option value="standard">Standard</option>
                    <option value="challenging">Challenging</option>
                  </select>
                </div>

                <label className="flex items-center gap-3 pt-5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={chapIsDifficult}
                    onChange={(e) => setChapIsDifficult(e.target.checked)}
                    className="w-5 h-5 accent-[#80664B]"
                  />
                  <span className="text-sm text-[var(--da-parchment)]">Flag as difficult chapter</span>
                </label>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-[var(--da-muted)]">Study Notes</label>
                <textarea
                  rows={4}
                  maxLength={15000}
                  value={chapNotes}
                  onChange={(e) => setChapNotes(e.target.value)}
                  placeholder="Summarize core proofs, historical arguments, or key definitions…"
                  className="w-full p-3.5 rounded-xl bg-[var(--da-bg)] border border-[var(--da-border)] text-sm leading-relaxed"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-[var(--da-muted)]">Formulas / Key Equations / Chronology</label>
                <textarea
                  rows={3}
                  maxLength={8000}
                  value={chapFormulas}
                  onChange={(e) => setChapFormulas(e.target.value)}
                  placeholder="det(A - lambda*I) = 0"
                  className="w-full p-3.5 rounded-xl bg-[var(--da-bg)] border border-[var(--da-border)] text-xs font-mono-tabular leading-relaxed"
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-[var(--da-border)] flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setChapterModal({ open: false, editing: null, subjectId: '' })}
                className="min-h-[44px] px-4 rounded-xl border border-[var(--da-border)] text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="min-h-[44px] px-5 rounded-xl bg-[#80664B] hover:bg-[#947657] text-[#EDE1CB] text-sm font-medium"
              >
                Save Chapter
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
