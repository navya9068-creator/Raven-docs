export interface StarterSubject {
  id: string;
  title: string;
  code: string;
  color: string;
  targetHours: number;
  chapters: {
    id: string;
    title: string;
    completed: boolean;
    isDifficult: boolean;
    difficulty: 'foundational' | 'standard' | 'challenging';
    notes: string;
    formulas: string;
  }[];
}

export const STARTER_SUBJECTS: StarterSubject[] = [
  {
    id: 'subj_calculus',
    title: 'Analytical Calculus & Series',
    code: 'MATH-201',
    color: '#B89872',
    targetHours: 24,
    chapters: [
      {
        id: 'chap_taylor',
        title: 'Chapter 1: Taylor & Maclaurin Expansions',
        completed: false,
        isDifficult: true,
        difficulty: 'challenging',
        notes: 'Power series approximate smooth functions locally around a center point a. Check radius of convergence via the Ratio Test before integrating term-by-term.',
        formulas: 'f(x) = sum_{n=0}^{inf} [f^(n)(a) / n!] * (x - a)^n\nR_n(x) = f^(n+1)(c) / (n+1)! * (x - a)^(n+1)',
      },
      {
        id: 'chap_improper',
        title: 'Chapter 2: Improper Integrals & Comparison Tests',
        completed: true,
        isDifficult: false,
        difficulty: 'standard',
        notes: 'Split integrals at vertical asymptotes or infinite limits and evaluate using formal limits.',
        formulas: 'int_1^inf (1 / x^p) dx converges iff p > 1',
      },
    ],
  },
  {
    id: 'subj_hist',
    title: 'Early Modern European History',
    code: 'HIST-114',
    color: '#9C7B5E',
    targetHours: 18,
    chapters: [
      {
        id: 'chap_print',
        title: 'Chapter 1: Print Culture & Humanist Networks',
        completed: false,
        isDifficult: false,
        difficulty: 'foundational',
        notes: 'Aldus Manutius portable octavo editions transformed private scholarly reading across Venice, Basel, and Lyon.',
        formulas: 'Chronology Anchor: 1455 Gutenberg Bible -> 1501 Aldine Octavo -> 1517 Wittenberg Theses',
      },
    ],
  },
];

export interface StarterQuiz {
  id: string;
  subjectTitle: string;
  chapterTitle: string;
  topicTag: string;
  timeLimitSeconds: number;
  questions: {
    id: string;
    prompt: string;
    options: string[];
    correctIndex: number;
    explanation: string;
    topicTag: string;
  }[];
}

export const STARTER_QUIZZES: StarterQuiz[] = [
  {
    id: 'quiz_calculus_series',
    subjectTitle: 'Analytical Calculus & Series',
    chapterTitle: 'Taylor & Maclaurin Expansions',
    topicTag: 'Power Series',
    timeLimitSeconds: 300,
    questions: [
      {
        id: 'q_calc_1',
        prompt: 'For which values of p does the p-series sum_{n=1}^{inf} (1 / n^p) converge?',
        options: ['p > 1', 'p >= 1', '0 < p < 1', 'All real p > 0'],
        correctIndex: 0,
        explanation: 'By the Integral Test, int_1^inf x^(-p) dx converges strictly when p > 1; at p = 1 it is the divergent harmonic series.',
        topicTag: 'Convergence Tests',
      },
      {
        id: 'q_calc_2',
        prompt: 'What is the Maclaurin series expansion of e^x up to the cubic term?',
        options: [
          '1 + x + x^2/2 + x^3/6',
          '1 + x + x^2 + x^3',
          'x - x^3/6 + x^5/120',
          '1 - x^2/2 + x^4/24',
        ],
        correctIndex: 0,
        explanation: 'Every derivative of e^x evaluated at x = 0 equals 1, yielding coefficients 1/n! for every power x^n.',
        topicTag: 'Maclaurin Expansions',
      },
      {
        id: 'q_calc_3',
        prompt: 'When applying the Ratio Test L = lim_{n->inf} |a_{n+1} / a_n|, the series converges absolutely if:',
        options: ['L < 1', 'L = 1', 'L > 1', 'L = 0 only'],
        correctIndex: 0,
        explanation: 'The Ratio Test guarantees absolute convergence whenever L < 1, divergence when L > 1, and is inconclusive when L = 1.',
        topicTag: 'Convergence Tests',
      },
      {
        id: 'q_calc_4',
        prompt: 'In Lagrange Remainder R_n(x), the error bound depends directly on the maximum magnitude of:',
        options: [
          'The (n+1)-th derivative on the interval',
          'The first derivative at x = 0',
          'The integral of f(x) from 0 to a',
          'The n-th partial sum alone',
        ],
        correctIndex: 0,
        explanation: 'Lagrange’s Remainder Theorem bounds truncation error using |f^(n+1)(c)| * |x - a|^(n+1) / (n+1)! for some c between a and x.',
        topicTag: 'Error Bounds',
      },
    ],
  },
  {
    id: 'quiz_cellular_bio',
    subjectTitle: 'Cellular & Molecular Biology',
    chapterTitle: 'Oxidative Phosphorylation & Enzyme Kinetics',
    topicTag: 'Biochemistry',
    timeLimitSeconds: 240,
    questions: [
      {
        id: 'q_bio_1',
        prompt: 'Where does the proton gradient driving ATP synthase accumulate in eukaryotic mitochondria?',
        options: [
          'Intermembrane space',
          'Cytosol outside the outer membrane',
          'Mitochondrial matrix',
          'Endoplasmic reticulum lumen',
        ],
        correctIndex: 0,
        explanation: 'Complexes I, III, and IV pump H+ ions from the matrix into the intermembrane space, creating the electrochemical proton-motive force.',
        topicTag: 'Bioenergetics',
      },
      {
        id: 'q_bio_2',
        prompt: 'In Michaelis-Menten kinetics, competitive inhibition affects apparent Km and Vmax by:',
        options: [
          'Increasing apparent Km while Vmax stays unchanged',
          'Decreasing both Km and Vmax',
          'Leaving Km unchanged while lowering Vmax',
          'Increasing Vmax indefinitely',
        ],
        correctIndex: 0,
        explanation: 'A competitive inhibitor binds the active site reversibly; high substrate concentration can outcompete it so Vmax is unchanged, while higher [S] is needed for half-maximal velocity.',
        topicTag: 'Enzyme Kinetics',
      },
      {
        id: 'q_bio_3',
        prompt: 'Which molecule serves as the final electron acceptor in the mitochondrial electron transport chain?',
        options: ['Molecular oxygen (O2)', 'NAD+', 'Pyruvate', 'Cytochrome c'],
        correctIndex: 0,
        explanation: 'Complex IV (cytochrome c oxidase) transfers electrons to O2, reducing it with protons to form H2O.',
        topicTag: 'Bioenergetics',
      },
    ],
  },
];

export const DAILY_MISSION_TEMPLATES = [
  {
    slug: 'focus_ritual',
    title: 'Complete one uninterrupted Focus session',
    description: 'Log at least one Pomodoro or ADHD micro-sprint in the Focus Room.',
    xpReward: 45,
  },
  {
    slug: 'library_progress',
    title: 'Master or annotate one Library chapter',
    description: 'Mark a chapter completed or enrich your notes & formulas.',
    xpReward: 40,
  },
  {
    slug: 'backlog_step',
    title: 'Clear one micro-task in Backlog Rescue',
    description: 'Tackle an overdue chapter sub-task to reduce study debt.',
    xpReward: 35,
  },
  {
    slug: 'arena_trial',
    title: 'Enter a Boss Battle chapter quiz',
    description: 'Test recall under examination conditions and review weak topics.',
    xpReward: 60,
  },
];
