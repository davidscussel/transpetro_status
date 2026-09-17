import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map, shareReplay, throwError } from 'rxjs';
import { Questao, QuestionMaterial } from '../models/study.models';

@Injectable({ providedIn: 'root' })
export class QuestionMaterialService {
  private readonly http = inject(HttpClient);
  private readonly cache = new Map<string, Observable<QuestionMaterial[]>>();

  getMaterial(question: Questao): Observable<QuestionMaterial> {
    const url = question.materialUrl;
    if (!url) return throwError(() => new Error('Material indisponível.'));
    let request = this.cache.get(url);
    if (!request) {
      request = this.http.get<QuestionMaterial[]>(url).pipe(shareReplay({ bufferSize: 1, refCount: true }));
      this.cache.set(url, request);
    }
    return request.pipe(map((materials) => {
      const material = materials.find((entry) => entry.qid === question.qid);
      if (!material || !material.theory?.length || !material.steps?.length || !/^\s*[A-E](?:\s|$|[—–-])/.test(material.answer ?? '')) {
        this.cache.delete(url);
        throw new Error('Material da questão não encontrado.');
      }
      return material;
    }));
  }
}
