import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const read = path => JSON.parse(readFileSync(new URL('../' + path, import.meta.url), 'utf8'));
const subjects = read('public/data/materias.json');
const answers = read('public/data/gabaritos.json');
const manifest = read('layout/recortes_manifesto.json').questions;
const questions = subjects.flatMap(subject => subject.assuntos.flatMap(topic => topic.questions));
assert.equal(new Set(questions.map(q => q.qid)).size, questions.length, 'qid duplicado');
assert.deepEqual(Object.keys(answers).sort(), questions.map(q => q.qid).sort(), 'Cobertura dos gabaritos divergente');
let withSolution = 0;
for (const subject of subjects) {
  for (const topic of subject.assuntos) {
    for (const q of topic.questions) {
      assert.match(answers[q.qid], /^[A-E]$/, 'Alternativa inválida: ' + q.qid);
      assert.equal(answers[q.qid], manifest[q.qid]?.answer, 'Gabarito divergente do caderno: ' + q.qid);
      assert.ok(existsSync(new URL('../public/' + q.pdfUrl, import.meta.url)), 'PDF ausente: ' + q.qid);
      const materialUrl = q.materialUrl;
      if (!materialUrl) continue;
      const material = read('public/' + materialUrl).find(entry => entry.qid === q.qid);
      assert.ok(material, 'Resolução ausente: ' + q.qid);
      const match = /^\s*([A-E])(?:\s|$|[—–-])/.exec(material.answer);
      assert.equal(match?.[1], answers[q.qid], 'Gabarito divergente da resolução: ' + q.qid);
      withSolution++;
    }
  }
}
console.log(questions.length + ' PDFs e gabaritos conferidos; ' + withSolution + ' resoluções concordam com o caderno.');
