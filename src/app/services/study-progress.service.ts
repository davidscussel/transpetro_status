import { Injectable, signal } from '@angular/core';
import { AnswerOption, DifficultyLevel, Materia, StudyProgress } from '../models/study.models';

const STORAGE_KEY = 'transpetro_study_progress_v1';
const EMPTY: StudyProgress = { topics: {}, questions: {} };

@Injectable({ providedIn: 'root' })
export class StudyProgressService {
  readonly progress = signal<StudyProgress>(this.load());

  reconcileClassification(materias: Materia[]): void {
    const previous = this.progress();
    if ((previous.classificationVersion ?? 0) >= 2 || !materias.length) return;
    const next: StudyProgress = {
      ...previous, classificationVersion: 2,
      topics: { ...previous.topics }, questions: { ...previous.questions },
    };
    for (const materia of materias) {
      for (const topic of materia.assuntos) {
        const topicKey = materia.materia + '::' + topic.nome;
        let hasTopicHistory = false;
        const sourceCompletion = topic.questions.map((question) => {
          const oldTopics = question.legacyTopicKeys ?? [];
          const suffix = '::' + question.prova + '::' + question.q;
          const newKey = topicKey + suffix;
          const oldKeys = oldTopics.map((key) => key + suffix);
          const oldQuestionKey = oldKeys.find((key) => previous.questions[key] !== undefined);
          if (next.questions[newKey] === undefined && oldQuestionKey) {
            next.questions[newKey] = { ...previous.questions[oldQuestionKey] };
          }
          const oldNoteKey = oldKeys.find((key) => previous.notes?.[key] !== undefined);
          if (oldNoteKey && !next.notes?.[newKey]) {
            next.notes = { ...next.notes, [newKey]: { ...previous.notes![oldNoteKey] } };
          }
          // Prefer the most recent classification, including explicit false values.
          const sourceKey = oldTopics.find((key) => previous.topics[key] !== undefined);
          if (sourceKey) hasTopicHistory = true;
          return sourceKey ? previous.topics[sourceKey].done : false;
        });
        // A split inherits its source; a merge is complete only if ALL source parts were complete.
        if (hasTopicHistory) next.topics[topicKey] = { done: sourceCompletion.every(Boolean) };
      }
    }
    this.progress.set(next);
    this.persist();
  }

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

  answerQuestion(key: string, selectedAnswer: AnswerOption | undefined, correctAnswer?: AnswerOption): void {
    if (selectedAnswer && (!/^[A-E]$/.test(selectedAnswer) || !correctAnswer || !/^[A-E]$/.test(correctAnswer))) return;
    this.update((progress) => {
      const next = { ...(progress.questions[key] ?? { done: false }) };
      if (selectedAnswer) { next.selectedAnswer = selectedAnswer; next.correctAnswer = correctAnswer; }
      else { delete next.selectedAnswer; delete next.correctAnswer; }
      return { ...progress, questions: { ...progress.questions, [key]: next } };
    });
  }

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
