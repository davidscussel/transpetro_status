import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map, shareReplay } from 'rxjs';
import { Materia } from '../models/study.models';

interface RawQuestion { num: number; qid: string; url: string; ano: string; }
interface RawTopic { name: string; count: number; questions: RawQuestion[]; }
interface RawSubject { materia: string; assuntos: RawTopic[]; }

@Injectable({ providedIn: 'root' })
export class StudyDataService {
  private readonly http = inject(HttpClient);
  private readonly materias$ = this.http.get<RawSubject[]>('data/materias.json').pipe(
    map((materias) => materias.map((materia) => ({
      materia: materia.materia,
      assuntos: materia.assuntos.map((assunto) => ({
        nome: assunto.name,
        freq: assunto.count,
        questions: assunto.questions.map((questao) => ({
          prova: 'Transpetro ' + questao.ano,
          ano: Number(questao.ano),
          q: questao.num,
          d: 'medio' as const,
          link: questao.url,
        })),
      })),
    }))),
    shareReplay(1),
  );

  getMaterias(): Observable<Materia[]> { return this.materias$; }
}
