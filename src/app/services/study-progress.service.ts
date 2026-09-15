import { Injectable, signal } from '@angular/core';
import { DifficultyLevel, StudyProgress } from '../models/study.models';

const STORAGE_KEY = 'transpetro_study_progress_v1';
const EMPTY: StudyProgress = { topics: {}, questions: {} };

@Injectable({ providedIn: 'root' })
export class StudyProgressService {
  readonly progress = signal<StudyProgress>(this.load());

  markTopic(key: string, done: boolean): void {
    this.update((progress) => ({ ...progress, topics: { ...progress.topics, [key]: { done } } }));
  }

  markQuestion(key: string, done: boolean): void {
    this.update((progress) => ({
      ...progress,
      questions: { ...progress.questions, [key]: { ...progress.questions[key], done } },
    }));
  }

  setDifficulty(key: string, difficulty: DifficultyLevel | undefined): void {
    this.update((progress) => {
      const current = progress.questions[key] ?? { done: false };
      const next = { ...current };
      if (difficulty) next.difficulty = difficulty;
      else delete next.difficulty;
      return { ...progress, questions: { ...progress.questions, [key]: next } };
    });
  }

  reset(): void { this.progress.set({ topics: {}, questions: {} }); this.persist(); }

  private update(mutator: (progress: StudyProgress) => StudyProgress): void {
    this.progress.update(mutator);
    this.persist();
  }

  private load(): StudyProgress {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return { ...EMPTY, ...JSON.parse(raw) };
      return this.migrateLegacy();
    } catch { return { topics: {}, questions: {} }; }
  }

  private migrateLegacy(): StudyProgress {
    try {
      const topics = JSON.parse(localStorage.getItem('transpetro_provas_topicos_v2') ?? '{}');
      const questions = JSON.parse(localStorage.getItem('transpetro_provas_questoes_v2') ?? '{}');
      const difficulty = JSON.parse(localStorage.getItem('transpetro_provas_dificuldade_v2') ?? '{}');
      const migrated: StudyProgress = { topics: {}, questions: {} };
      Object.entries(topics).forEach(([key, done]) => migrated.topics[key] = { done: Boolean(done) });
      Object.entries(questions).forEach(([key, done]) => migrated.questions[key] = { done: Boolean(done), difficulty: difficulty[key] });
      return migrated;
    } catch { return { topics: {}, questions: {} }; }
  }

  private persist(): void { localStorage.setItem(STORAGE_KEY, JSON.stringify(this.progress())); }
}
