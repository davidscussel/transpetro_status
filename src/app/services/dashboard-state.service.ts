import { Injectable } from '@angular/core';
import { AnswerStats, DashboardStats, DifficultyFilter, Materia, SortMode, StudyProgress, SubjectGroupView, TopicView, TopicAnswerStats } from '../models/study.models';

@Injectable({ providedIn: 'root' })
export class DashboardStateService {
  topicKey(materia: string, assunto: string): string { return materia + '::' + assunto; }
  questionKey(materia: string, assunto: string, prova: string, q: number): string { return this.topicKey(materia, assunto) + '::' + prova + '::' + q; }
  normalize(value: string): string { return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase(); }

  getFilteredGroups(materias: Materia[], search: string, difficulty: DifficultyFilter): SubjectGroupView[] {
    return materias.map((materia) => ({
      ...materia,
      assuntos: materia.assuntos.map((assunto) => this.toTopic(materia.materia, assunto)).filter((assunto) => this.matches(assunto, search, difficulty)),
    })).filter((materia) => materia.assuntos.length > 0);
  }

  getFlatSorted(materias: Materia[], search: string, difficulty: DifficultyFilter, sort: SortMode): TopicView[] {
    const topics = materias.flatMap((materia) => materia.assuntos.map((assunto) => this.toTopic(materia.materia, assunto)))
      .filter((assunto) => this.matches(assunto, search, difficulty));
    return topics.sort((a, b) => sort === 'freq' ? b.freq - a.freq || a.nome.localeCompare(b.nome) : a.materiaName.localeCompare(b.materiaName) || a.nome.localeCompare(b.nome));
  }

  getAllTopics(materias: Materia[]): TopicView[] { return materias.flatMap((materia) => materia.assuntos.map((assunto) => this.toTopic(materia.materia, assunto))); }

  stats(materias: Materia[], progress: StudyProgress): DashboardStats {
    const topics = this.getAllTopics(materias);
    const questions = topics.flatMap((topic) => topic.questions.map((question) => ({ topic, question })));
    const doneTopics = topics.filter((topic) => progress.topics[this.topicKey(topic.materiaName, topic.nome)]?.done).length;
    const doneQuestions = questions.filter(({ topic, question }) => progress.questions[this.questionKey(topic.materiaName, topic.nome, question.prova, question.q)]?.done).length;
    return { totalTopics: topics.length, doneTopics, totalQuestions: questions.length, doneQuestions, completedPct: questions.length ? Math.round(doneQuestions * 100 / questions.length) : 0 };
  }

  topicCompletionPct(topic: TopicView, progress: StudyProgress): number {
    const complete = topic.questions.filter((question) => progress.questions[this.questionKey(topic.materiaName, topic.nome, question.prova, question.q)]?.done).length;
    return topic.questions.length ? Math.round(complete * 100 / topic.questions.length) : 0;
  }

  topicAnswerStats(materias: Materia[], progress: StudyProgress): TopicAnswerStats[] {
    return this.getAllTopics(materias).map(topic => {
      let correct = 0, incorrect = 0;
      for (const question of topic.questions) {
        const entry = progress.questions[this.questionKey(topic.materiaName, topic.nome, question.prova, question.q)];
        if (!entry?.selectedAnswer || !entry.correctAnswer || !/^[A-E]$/.test(entry.selectedAnswer) || !/^[A-E]$/.test(entry.correctAnswer)) continue;
        if (entry.selectedAnswer === entry.correctAnswer) correct++;
        else incorrect++;
      }
      const answered = correct + incorrect;
      return { name: topic.nome, key: this.topicKey(topic.materiaName, topic.nome), total: topic.questions.length,
        correct, incorrect, answered, unanswered: topic.questions.length - answered,
        percentage: answered ? correct * 100 / answered : null };
    }).sort((a, b) => a.name.localeCompare(b.name, 'pt-BR') || a.key.localeCompare(b.key, 'pt-BR'));
  }

  answerStats(materias: Materia[], progress: StudyProgress): AnswerStats {
    return this.topicAnswerStats(materias, progress).reduce((sum, topic) => ({
      correct: sum.correct + topic.correct, incorrect: sum.incorrect + topic.incorrect,
      unanswered: sum.unanswered + topic.unanswered, answered: sum.answered + topic.answered, total: sum.total + topic.total,
    }), { correct: 0, incorrect: 0, unanswered: 0, answered: 0, total: 0 });
  }

  private toTopic(materiaName: string, assunto: Materia['assuntos'][number]): TopicView { return { ...assunto, materiaName, fullCount: assunto.questions.length }; }
  private matches(topic: TopicView, search: string, difficulty: DifficultyFilter): boolean {
    const term = this.normalize(search.trim());
    const textMatches = !term || this.normalize(topic.nome + ' ' + topic.materiaName + ' ' + topic.questions.map((question) => question.prova).join(' ')).includes(term);
    const difficultyMatches = difficulty === 'todas' || difficulty === 'none' ? (difficulty !== 'none' || topic.questions.length === 0) : topic.questions.some((question) => question.d === difficulty);
    return textMatches && difficultyMatches;
  }
}
