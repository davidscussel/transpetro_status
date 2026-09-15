#!/usr/bin/env python3
"""Recorta o caderno por qid, publica os PDFs e verifica a base do Angular."""

import argparse
from collections import Counter
import hashlib
import json
import math
from pathlib import Path
import re
import tempfile
import unicodedata

import pymupdf as fitz

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "layout/Caderno ultimas provas da transpetro.pdf"
DATA = ROOT / "public/data/materias.json"
MANIFEST = ROOT / "layout/recortes_manifesto.json"
QUESTION_URL = re.compile(r"www\.tecconcursos\.com\.br/questoes/(\d+)")


def require(condition, message):
  if not condition:
    raise ValueError(message)


def slug(text):
  ascii_text = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode()
  return re.sub(r"[^a-z0-9]+", "-", ascii_text.lower()).strip("-")


def lines(page):
  for block in page.get_text("dict")["blocks"]:
    for line in block.get("lines", []):
      yield "".join(span["text"] for span in line["spans"]), fitz.Rect(line["bbox"])


def questions(data):
  return [q for subject in data for topic in subject["assuntos"] for q in topic["questions"]]


def inspect_source(doc, data):
  expected = questions(data)
  by_id = {q["qid"]: q for q in expected}
  require(len(by_id) == len(expected), "Há qids duplicados na base.")
  require(len({q["num"] for q in expected}) == len(expected), "Há números duplicados na base.")
  anchors, bounds, answers = [], [], {}
  answer_page = None
  for page in doc:
    page_lines = list(lines(page))
    printing = [(t, r) for t, r in page_lines if
                (r.y0 < 25 and (t == "Caderno ultimas provas da transpetro" or
                 re.fullmatch(r"\d{2}/\d{2}/\d{4}, \d{2}:\d{2}", t))) or
                (r.y0 > 815 and ("/questoes/cadernos/" in t or re.fullmatch(r"\d+/\d+", t)))]
    require(len(printing) == 4, f"Cabeçalho/rodapé ambíguo na página {page.number + 1}.")
    before = characters(page.get_text())
    for text, rect in printing:
      # Uma faixa no topo das letras evita atingir fórmulas cujo bbox chega ao cabeçalho.
      page.add_redact_annot(fitz.Rect(rect.x0, rect.y0 + 2, rect.x1, rect.y0 + 3), fill=False)
      before.subtract(characters(text))
    page.apply_redactions(images=0, graphics=0)
    require(+before == characters(page.get_text()), f"Remoção do cabeçalho afetou conteúdo na página {page.number + 1}.")
    page_lines = list(lines(page))
    bounds.append((min(26, math.floor(min(r.y0 for _, r in page_lines)) - 2),
                   max(817, math.ceil(max(r.y1 for _, r in page_lines)) + 2)))
    if any(t.strip() == "Gabarito" for t, _ in page_lines):
      require(answer_page is None, "Mais de uma página de gabarito encontrada.")
      answer_page = page.number
      pairs = re.findall(r"(\d+)\)\s*([A-E])\b", page.get_text())
      require(len({n for n, _ in pairs}) == len(pairs), "Gabarito duplicado.")
      answers = {int(n): a for n, a in pairs}
    for text, rect in page_lines:
      match = QUESTION_URL.fullmatch(text.strip())
      if match:
        anchors.append((page.number, math.floor(rect.y0 - 2), match[1]))
  anchors.sort()
  require(answer_page == len(doc) - 1, "O gabarito deve estar na última página.")
  require(Counter(a[2] for a in anchors) == Counter(by_id.keys()), "Questões do PDF e da base divergem.")
  require(set(answers) == {q["num"] for q in expected}, "Gabarito incompleto ou divergente.")
  require(all(p < answer_page for p, _, _ in anchors), "Questão encontrada após o gabarito.")
  records = {}
  for index, (start_page, start_y, qid) in enumerate(anchors):
    end_page, end_y, _ = (anchors[index + 1] if index + 1 < len(anchors)
                         else (answer_page, bounds[answer_page][0], ""))
    segments = []
    text_parts = []
    for page_number in range(start_page, end_page + 1):
      if page_number == answer_page:
        break
      page = doc[page_number]
      y0 = max(bounds[page_number][0], start_y) if page_number == start_page else bounds[page_number][0]
      y1 = min(bounds[page_number][1], end_y) if page_number == end_page else bounds[page_number][1]
      if y1 <= y0:
        continue
      rect = fitz.Rect(0, y0, page.rect.width, y1)
      text = page.get_text(clip=rect)
      if not text.strip():
        require(not any(rect.intersects(fitz.Rect(i["bbox"])) for i in page.get_image_info()),
                f"Trecho sem texto, mas com figura, na questão {qid}.")
        continue
      # Um limite que atravessa uma linha ou uma imagem precisa de revisão manual.
      for _, line_rect in lines(page):
        if rect.intersects(line_rect):
          require(rect.contains(line_rect), f"Limite corta texto: questão {qid}, página {page_number + 1}.")
      for image in page.get_image_info():
        image_rect = fitz.Rect(image["bbox"])
        if rect.intersects(image_rect):
          require(rect.contains(image_rect), f"Limite corta figura: questão {qid}, página {page_number + 1}.")
      segments.append({"page": page_number + 1, "rect": list(rect)})
      text_parts.append(text)
    text = "\n".join(text_parts)
    number = by_id[qid]["num"]
    require(QUESTION_URL.findall(text) == [qid], f"Recorte contém outro qid: {qid}.")
    require(re.search(rf"(?m)^\s*{number}\)\s", text), f"Número incorreto na questão {qid}.")
    require(all(re.search(rf"(?m)^\s*{a}\)", text) for a in "abcde"),
            f"Alternativas incompletas na questão {qid}.")
    records[qid] = {"num": number, "answer": answers[number], "segments": segments}
  return records


def create_question(source, record, path):
  segments = record["segments"]
  height = sum(s["rect"][3] - s["rect"][1] for s in segments) + 48
  with fitz.open() as output:
    target = output.new_page(width=source[0].rect.width, height=height)
    y = 24
    for segment in segments:
      rect = fitz.Rect(segment["rect"])
      with fitz.open() as part:
        part.insert_pdf(source, from_page=segment["page"] - 1, to_page=segment["page"] - 1,
                        links=False, annots=False)
        # Remove o conteúdo externo também da extração de texto, não só da visualização.
        part[0].add_redact_annot(fitz.Rect(0, 0, rect.width, rect.y0), fill=False)
        part[0].add_redact_annot(fitz.Rect(0, rect.y1, rect.width, part[0].rect.height), fill=False)
        part[0].apply_redactions(images=2, graphics=1)
        destination = fitz.Rect(0, y, rect.width, y + rect.height)
        target.show_pdf_page(destination, part, clip=rect)
        y += rect.height
    output.set_metadata({"title": f"Transpetro - Questão {record['num']}"})
    output.save(path, garbage=4, deflate=True, no_new_id=True)


def create_topic(topic, subject_name, records, root):
  with fitz.open() as output:
    toc = []
    for question in sorted(topic["questions"], key=lambda q: q["num"]):
      toc.append([1, f"Questão {question['num']} - Transpetro {question['ano']}", len(output) + 1])
      with fitz.open(root / question["pdfUrl"]) as individual:
        output.insert_pdf(individual)
    page = output.new_page(width=595, height=842)
    title = f"Gabarito\n{subject_name}\n{topic['name']}"
    require(page.insert_textbox(fitz.Rect(36, 36, 559, 132), title, fontsize=13) >= 0,
            "Título do gabarito excede a área disponível.")
    for index, q in enumerate(sorted(topic["questions"], key=lambda q: q["num"])):
      x, y = 36 + (index % 5) * 105, 160 + (index // 5) * 24
      require(y < 800, "Gabarito excede uma página.")
      page.insert_text((x, y), f"{q['num']}) {records[q['qid']]['answer']}", fontsize=12)
    toc.append([1, "Gabarito", len(output)])
    output.set_toc(toc)
    output.set_metadata({"title": topic["name"], "subject": subject_name})
    output.save(root / topic["pdfUrl"], garbage=4, deflate=True, no_new_id=True)


def characters(text):
  return Counter(c for c in text if not c.isspace())


def verify(source, data, records, root, render=False):
  rendered = 0
  for q in questions(data):
    record = records[q["qid"]]
    original = "".join(source[s["page"] - 1].get_text(clip=fitz.Rect(s["rect"])) for s in record["segments"])
    with fitz.open(root / q["pdfUrl"]) as pdf:
      require(len(pdf) == 1, f"PDF individual inválido: {q['qid']}.")
      text = pdf[0].get_text()
      require(characters(text) == characters(original), f"Texto alterado no recorte {q['qid']}.")
      require(QUESTION_URL.findall(text) == [q["qid"]], f"Questão vizinha em {q['qid']}.")
      if render:
        y = 24
        for segment in record["segments"]:
          rect = fitz.Rect(segment["rect"])
          expected = source[segment["page"] - 1].get_pixmap(clip=rect, colorspace=fitz.csGRAY)
          actual = pdf[0].get_pixmap(clip=fitz.Rect(0, y, rect.width, y + rect.height), colorspace=fitz.csGRAY)
          require((expected.width, expected.height) == (actual.width, actual.height), "Dimensões de render divergentes.")
          # Pequenas diferenças de antialiasing são toleradas, perda de conteúdo não.
          a, b = expected.samples, actual.samples
          if a != b:
            changed = sum(abs(x - z) > 32 for x, z in zip(a, b))
            require(changed / len(a) < 0.001, f"Imagem do recorte diverge do original: {q['qid']} ({changed / len(a):.4%}).")
          y += rect.height
          rendered += 1
  for subject in data:
    for topic in subject["assuntos"]:
      ordered = sorted(topic["questions"], key=lambda q: q["num"])
      with fitz.open(root / topic["pdfUrl"]) as pdf:
        require(len(pdf) == len(ordered) + 1, f"Número de páginas incorreto: {topic['name']}.")
        for index, q in enumerate(ordered):
          with fitz.open(root / q["pdfUrl"]) as individual:
            require(pdf[index].get_text() == individual[0].get_text(), f"Questão divergente no assunto: {q['qid']}.")
        actual_answers = re.findall(r"(\d+)\)\s*([A-E])\b", pdf[-1].get_text())
        expected_answers = [(str(q["num"]), records[q["qid"]]["answer"]) for q in ordered]
        require(actual_answers == expected_answers, f"Gabarito incorreto: {topic['name']}.")
  print(f"Verificados {len(records)} PDFs individuais, {sum(len(s['assuntos']) for s in data)} assuntos"
        + (f" e {rendered} trechos comparados visualmente por pixels." if render else "."))


def main():
  parser = argparse.ArgumentParser(description=__doc__)
  parser.add_argument("--check", action="store_true", help="Valida os arquivos existentes sem alterá-los.")
  parser.add_argument("--render-check", action="store_true", help="Compara também os pixels com o PDF original.")
  args = parser.parse_args()
  data = json.loads(DATA.read_text())
  with fitz.open(SOURCE) as source:
    records = inspect_source(source, data)
    manifest = {"source": str(SOURCE.relative_to(ROOT)), "sha256": hashlib.sha256(SOURCE.read_bytes()).hexdigest(),
                "pageNumbering": "1-based", "coordinates": "PDF points, top-left origin", "questions": records}
    if args.check:
      require(json.loads(MANIFEST.read_text()) == manifest, "Manifesto desatualizado.")
      verify(source, data, records, ROOT / "public", args.render_check)
      return
    # Só publica depois de gerar e validar tudo em uma pasta temporária.
    with tempfile.TemporaryDirectory(prefix="transpetro-recortes-") as temp:
      staging = Path(temp)
      (staging / "assets/questoes").mkdir(parents=True)
      (staging / "assets/assuntos").mkdir(parents=True)
      topic_paths = set()
      for subject in data:
        for topic in subject["assuntos"]:
          topic["pdfUrl"] = f"assets/assuntos/{slug(subject['materia'])}-{slug(topic['name'])}.pdf"
          require(topic["pdfUrl"] not in topic_paths, "Nomes de arquivo de assuntos colidem.")
          topic_paths.add(topic["pdfUrl"])
          for q in topic["questions"]:
            q["pdfUrl"] = f"assets/questoes/{q['qid']}.pdf"
            create_question(source, records[q["qid"]], staging / q["pdfUrl"])
          create_topic(topic, subject["materia"], records, staging)
      verify(source, data, records, staging, args.render_check)
      for path in staging.rglob("*.pdf"):
        target = ROOT / "public" / path.relative_to(staging)
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(path.read_bytes())
      DATA.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n")
      MANIFEST.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n")


if __name__ == "__main__":
  main()
