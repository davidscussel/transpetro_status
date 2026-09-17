import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map, shareReplay } from 'rxjs';
import { Materia } from '../models/study.models';

interface RawQuestion { num: number; qid: string; url: string; pdfUrl: string; ano: string; materialUrl?: string; }
interface RawTopic { name: string; count: number; pdfUrl: string; questions: RawQuestion[]; }
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
        pdfUrl: assunto.pdfUrl,
        questions: assunto.questions.map((questao) => ({
          qid: questao.qid,
          prova: 'Transpetro ' + questao.ano,
          ano: Number(questao.ano),
          q: questao.num,
          d: 'medio' as const,
          link: questao.pdfUrl,
          ...(questao.materialUrl ? { materialUrl: questao.materialUrl } : assunto.name === 'Análise de Sinais e Sistemas' ? { materialUrl: 'data/sinais_sistemas_estudo.json' } : {}),
        })),
      })),
    }))),
    shareReplay(1),
  );

  getMaterias(): Observable<Materia[]> { return this.materias$; }
}
