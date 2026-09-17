"""Valida cobertura, materiais, migração e PDFs da classificação atual."""
import json
from pathlib import Path
import pymupdf as fitz

ROOT = Path(__file__).resolve().parent.parent
read = lambda name: json.loads((ROOT / name).read_text())
areas = read('public/data/materias.json')
answers = read('public/data/gabaritos.json')
original = read('layout/classificacao_anterior.json')
plan = read('layout/classificacao_questoes.json')['areas']
manifest = read('layout/recortes_manifesto.json')['questions']
seen, seen_numbers, material_ids = set(), set(), set()
by_number = {}
for area, planned_area in zip(areas, plan, strict=True):
  assert area['materia'] == planned_area['materia']
  assert area['count'] == sum(t['count'] for t in area['assuntos'])
  for topic, planned in zip(area['assuntos'], planned_area['assuntos'], strict=True):
    assert topic['name'] == planned['name']
    assert sorted(q['num'] for q in topic['questions']) == sorted(planned['questions'])
    assert topic['count'] == len(topic['questions']) > 0
    with fitz.open(ROOT / 'public' / topic['pdfUrl']) as pdf:
      assert len(pdf) == len(topic['questions']) + 1
      assert pdf.metadata['title'] == topic['name']
      gabarito = pdf[-1].get_text()
      for i, q in enumerate(topic['questions']):
        assert q['qid'] not in seen and q['num'] not in seen_numbers
        seen.add(q['qid']); seen_numbers.add(q['num'])
        by_number[q['num']] = (area['materia'], topic['name'])
        assert q['num'] == manifest[q['qid']]['num']
        old = original[q['qid']]
        assert q['legacyTopicKeys'][0] == old['area'] + '::' + old['assunto']
        with fitz.open(ROOT / 'public' / q['pdfUrl']) as individual:
          assert pdf[i].get_text() == individual[0].get_text(), q['qid']
        assert f"{q['num']}) {answers[q['qid']]}" in gabarito
        if q.get('materialUrl'):
          material = read('public/' + q['materialUrl'])
          assert any(m['qid'] == q['qid'] for m in material)
          material_ids.add(q['qid'])
assert seen == set(answers) == set(original)
assert seen_numbers == set(range(1, 201))
expected_material_ids = {m['qid'] for filename in ['sinais_sistemas_estudo.json', 'microcontroladores_estudo.json', 'eletronica_estudo.json'] for m in read('public/data/' + filename)}
assert material_ids == expected_material_ids
for number, area in {71:'Sinais e Sistemas', 72:'Sistemas de Controle', 84:'Circuitos Elétricos', 87:'Matemática', 113:'Eletrônica', 179:'Automação Industrial', 140:'Eletrônica Digital e Computação', 188:'Instrumentação e Medidas'}.items():
  assert by_number[number][0] == area
print(f'{len(seen)} questões únicas; {len(areas)} áreas; {sum(len(a["assuntos"]) for a in areas)} cadernos e gabaritos verificados; {len(material_ids)} materiais preservados.')
