"""Aplica a classificação editorial e recompõe PDFs por assunto.
Requer PyMuPDF (layout/requirements-pdf.txt). Execute da raiz do projeto.
Os PDFs individuais e os arquivos de estudo são preservados.
"""
import json
import unicodedata
import re
from pathlib import Path
import fitz

ROOT = Path(__file__).resolve().parent.parent

def read(path):
  return json.loads((ROOT / path).read_text())

def slug(text):
  text = unicodedata.normalize('NFKD', text).encode('ascii', 'ignore').decode().lower()
  return re.sub(r'[^a-z0-9]+', '-', text).strip('-')

def main():
  current = read('public/data/materias.json')
  original = read('layout/classificacao_anterior.json')
  plan = read('layout/classificacao_questoes.json')
  answers = read('public/data/gabaritos.json')
  by_num = {q['num']: q for a in current for t in a['assuntos'] for q in t['questions']}
  numbers = [n for a in plan['areas'] for t in a['assuntos'] for n in t['questions']]
  assert len(numbers) == len(set(numbers)) == len(by_num)
  assert set(numbers) == set(by_num)
  materials = {}
  for filename in ['microcontroladores_estudo.json', 'sinais_sistemas_estudo.json', 'eletronica_estudo.json']:
    for lesson in read('public/data/' + filename):
      assert lesson['qid'] not in materials
      materials[lesson['qid']] = 'data/' + filename
  output = []
  rows = ['# Organização das questões', '', plan['criterion'], '',
          'A numeração Q1–Q200 é a do caderno original. Os PDFs individuais, gabaritos e materiais continuam associados ao mesmo qid.', '']
  for area in plan['areas']:
    new_area = {'materia': area['materia'], 'count': 0, 'assuntos': []}
    rows += ['## ' + area['materia'], '', '| Assunto | Questões do caderno |', '| --- | --- |']
    for topic in area['assuntos']:
      questions = []
      for number in sorted(topic['questions']):
        q = dict(by_num[number])
        previous = original[q['qid']]
        aliases = [previous['area'] + '::' + previous['assunto']]
        # Before the first Electronics split these questions also lived in Engineering.
        if previous['area'] == 'Eletrônica':
          aliases.append('Engenharia Elétrica e Eletrônica::' + previous['assunto'])
        q['legacyTopicKeys'] = aliases
        if q['qid'] in materials:
          q['materialUrl'] = materials[q['qid']]
        questions.append(q)
      path = 'assets/assuntos/organizados/' + slug(area['materia']) + '-' + slug(topic['name']) + '.pdf'
      target = ROOT / 'public' / path
      target.parent.mkdir(parents=True, exist_ok=True)
      with fitz.open() as pdf:
        toc = []
        for q in questions:
          toc.append([1, f"Questão {q['num']} - Transpetro {q['ano']}", len(pdf) + 1])
          with fitz.open(ROOT / 'public' / q['pdfUrl']) as src:
            pdf.insert_pdf(src)
        page = pdf.new_page(width=595, height=842)
        title = f"Gabarito\n{area['materia']}\n{topic['name']}"
        assert page.insert_textbox(fitz.Rect(36, 36, 559, 160), title, fontsize=13) >= 0
        for i, q in enumerate(questions):
          page.insert_text((36 + (i % 5) * 105, 185 + (i // 5) * 24), f"{q['num']}) {answers[q['qid']]}", fontsize=12)
        toc.append([1, 'Gabarito', len(pdf)])
        pdf.set_toc(toc)
        pdf.set_metadata({'title': topic['name'], 'subject': area['materia']})
        pdf.save(target, garbage=4, deflate=True, no_new_id=True)
      new_area['assuntos'].append({'name': topic['name'], 'count': len(questions), 'pdfUrl': path, 'questions': questions})
      new_area['count'] += len(questions)
      rows.append('| ' + topic['name'] + ' | ' + ', '.join('Q' + str(q['num']) for q in questions) + ' |')
    rows.append('')
    output.append(new_area)
  (ROOT / 'public/data/materias.json').write_text(json.dumps(output, ensure_ascii=False, indent=2) + '\n')
  (ROOT / 'layout/organizacao_assuntos.md').write_text('\n'.join(rows) + '\n')
  print(f"{len(numbers)} questões, {len(output)} áreas, {sum(len(a['assuntos']) for a in output)} PDFs por assunto.")

if __name__ == '__main__':
  main()
