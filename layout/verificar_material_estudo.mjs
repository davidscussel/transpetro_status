import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const readJson = (path) => JSON.parse(readFileSync(resolve(root, path), 'utf8'));
const subjects = readJson('public/data/materias.json').flatMap((area) => area.assuntos);
const manifest = readJson('layout/recortes_manifesto.json').questions;
const excerpts = readJson('public/assets/teoria/oppenheim/manifesto.json').excerpts;
const lessons = readJson('public/data/sinais_sistemas_estudo.json');
const questions = subjects.find((subject) => subject.name === 'Análise de Sinais e Sistemas').questions;
const ids = lessons.map((lesson) => lesson.qid);
assert.equal(new Set(ids).size, ids.length, 'qid duplicado');
assert.deepEqual([...ids].sort(), questions.map((q) => q.qid).sort(), 'Cobertura do assunto divergente');

const signatures = { theory: new Set(), steps: new Set() };
for (const lesson of lessons) {
  const question = questions.find((q) => q.qid === lesson.qid);
  const context = `Q${question.num}`;
  assert.ok(lesson.title.startsWith(`${context} — `), `${context}: título incorreto`);
  assert.equal(lesson.answer[0], manifest[lesson.qid].answer, `${context}: gabarito divergente`);
  for (const kind of ['theory', 'steps']) {
    assert.ok(lesson[kind].length >= 2, `${context}: ${kind} incompleto`);
    const signature = JSON.stringify(lesson[kind]);
    assert.ok(!signatures[kind].has(signature), `${context}: ${kind} repetido de outra questão`);
    signatures[kind].add(signature);
    for (const section of lesson[kind]) {
      assert.ok(section.title && section.paragraphs.length, `${context}: seção vazia`);
      assert.ok(section.paragraphs.every((p) => typeof p === 'string' && p.trim()), `${context}: parágrafo vazio`);
      if (section.table) {
        assert.ok(section.table.rows.every((row) => row.length === section.table.headers.length), `${context}: tabela irregular`);
      }
    }
  }
  assert.ok(lesson.sources.length, `${context}: fontes ausentes`);
  for (const source of lesson.sources) {
    assert.ok(source.label, `${context}: fonte sem identificação`);
    if (/^https:\/\//.test(source.url)) continue;
    const [path, fragment] = source.url.split('#');
    assert.ok(existsSync(resolve(root, 'public', path)), `${context}: fonte local inexistente: ${path}`);
    if (path.includes('/oppenheim/')) {
      const excerpt = excerpts.find((item) => item.file === basename(path));
      assert.ok(excerpt, `${context}: recorte não registrado`);
      const page = Number(new URLSearchParams(fragment).get('page'));
      assert.ok(Number.isInteger(page) && page >= 1 && page <= excerpt.pages.length, `${context}: página fora do recorte`);
    }
  }
}
console.log(`${lessons.length} questões: cobertura, gabaritos, conteúdo individual e referências locais conferidos.`);
