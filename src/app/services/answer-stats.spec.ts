import { DashboardStateService } from './dashboard-state.service';
import { StudyProgressService } from './study-progress.service';
import { Materia, StudyProgress } from '../models/study.models';

describe('Answer statistics and persistence', () => {
  const state = new DashboardStateService();
  const questions = [1, 2, 3, 4, 5].map(q => ({ qid: '' + q, prova: 'T', ano: 2023, q, d: 'medio' as const, link: '#' }));
  const materias: Materia[] = [{ materia: 'M', assuntos: [
    { nome: 'A', freq: 5, pdfUrl: '#', questions },
    { nome: 'B', freq: 1, pdfUrl: '#', questions: [{ ...questions[0], q: 6, qid: '6' }] },
  ] }];
  const key = (q: number) => state.questionKey('M', 'A', 'T', q);
  beforeEach(() => localStorage.clear());

  it('does not infer answers from legacy completion and distinguishes no answers from zero percent', () => {
    const progress: StudyProgress = { topics: {}, questions: { [key(1)]: { done: true } } };
    expect(state.answerStats(materias, progress).unanswered).toBe(6);
    expect(state.topicAnswerStats(materias, progress)[0].percentage).toBeNull();
    progress.questions[key(1)] = { done: true, selectedAnswer: 'A', correctAnswer: 'B' };
    expect(state.topicAnswerStats(materias, progress)[0].percentage).toBe(0);
  });

  it('uses answered questions as the denominator and keeps totals consistent', () => {
    const service = new StudyProgressService();
    [1, 2, 3].forEach(q => service.answerQuestion(key(q), 'B', 'B'));
    service.answerQuestion(key(4), 'A', 'B');
    expect(state.topicAnswerStats(materias, service.progress())[0].percentage).toBe(75);
    expect(state.answerStats(materias, service.progress())).toEqual({ correct: 3, incorrect: 1, unanswered: 2, answered: 4, total: 6 });
    service.answerQuestion(key(4), 'B', 'B');
    expect(state.topicAnswerStats(materias, service.progress())[0].percentage).toBe(100);
  });

  it('restores selections and preserves difficulty and checklist when replacing or clearing answers', () => {
    const service = new StudyProgressService();
    service.markQuestion(key(1), true);
    service.setDifficulty(key(1), 'dificil');
    service.answerQuestion(key(1), 'C', 'B');
    const restored = new StudyProgressService();
    expect(restored.progress().questions[key(1)]).toEqual({ done: true, difficulty: 'dificil', selectedAnswer: 'C', correctAnswer: 'B' });
    restored.answerQuestion(key(1), undefined);
    expect(restored.progress().questions[key(1)]).toEqual({ done: true, difficulty: 'dificil' });
    expect(state.answerStats(materias, restored.progress()).unanswered).toBe(6);
    restored.reset();
    expect(new StudyProgressService().progress().questions).toEqual({});
  });
});
