export type DifficultyLevel = 'facil' | 'medio' | 'dificil';
export type DifficultyFilter = DifficultyLevel | 'todas' | 'none';
export type SortMode = 'area' | 'freq';

export interface Questao { qid: string; prova: string; ano: number; q: number; d: DifficultyLevel; link: string; materialUrl?: string; legacyTopicKeys?: string[]; }
export interface Assunto { nome: string; freq: number; pdfUrl: string; questions: Questao[]; }
export interface Materia { materia: string; assuntos: Assunto[]; }
export interface TopicView extends Assunto { materiaName: string; fullCount: number; }
export interface SubjectGroupView extends Materia { assuntos: TopicView[]; }
export type AnswerOption = 'A' | 'B' | 'C' | 'D' | 'E';
export interface QuestionProgress { done: boolean; difficulty?: DifficultyLevel; selectedAnswer?: AnswerOption; correctAnswer?: AnswerOption; }
export interface TopicProgress { done: boolean; }
export interface StudyGoal { targetDate?: string; weeklyHours?: number; }
export interface StudyNote { text: string; updatedAt: string; }
export interface StudyProgress { classificationVersion?: number; topics: Record<string, TopicProgress>; questions: Record<string, QuestionProgress>; goal?: StudyGoal; notes?: Record<string, StudyNote>; }
export interface DashboardStats { totalTopics: number; doneTopics: number; totalQuestions: number; doneQuestions: number; completedPct: number; }

export type StudyTab = 'question' | 'theory' | 'solution';
export interface AnswerStats { correct: number; incorrect: number; unanswered: number; answered: number; total: number; }
export interface TopicAnswerStats extends AnswerStats { name: string; key: string; percentage: number | null; }
export interface StudySection { title: string; paragraphs: string[]; formula?: string; code?: string; table?: { headers: string[]; rows: string[][] }; }
export interface QuestionMaterial { qid: string; title: string; theory: StudySection[]; steps: StudySection[]; answer: string; sources: { label: string; url: string }[]; }
