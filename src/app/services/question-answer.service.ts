import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, shareReplay, throwError } from 'rxjs';
import { AnswerOption, Questao } from '../models/study.models';
import { QuestionMaterialService } from './question-material.service';

@Injectable({ providedIn: 'root' })
export class QuestionAnswerService {
  private readonly http = inject(HttpClient);
  private readonly materials = inject(QuestionMaterialService);
  private answers?: Observable<Record<string, string>>;

  getAnswer(question: Questao): Observable<AnswerOption> {
    if (!question.materialUrl && !this.answers) {
      this.answers = this.http.get<Record<string, string>>('data/gabaritos.json').pipe(shareReplay({ bufferSize: 1, refCount: true }));
    }
    const source = question.materialUrl
      ? this.materials.getMaterial(question).pipe(map(material => material.answer))
      : this.answers!.pipe(map(answers => answers[question.qid]));
    return source.pipe(map(answer => {
      const match = /^\s*([A-E])(?:\s|$|[—–-])/.exec(answer ?? '');
      if (!match) throw new Error('Gabarito inválido ou indisponível.');
      return match[1] as AnswerOption;
    }), catchError(error => { this.answers = undefined; return throwError(() => error); }));
  }
}
