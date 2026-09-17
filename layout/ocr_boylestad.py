"""Localiza capítulos do Boylestad em PDF-imagem e salva OCR por página.
Uso: python layout/ocr_boylestad.py --pdf livros/...pdf --out /tmp/boylestad-ocr
Requer rapidocr_onnxruntime (instalação em ambiente virtual recomendada).
"""
import argparse
from pathlib import Path
import cv2
from rapidocr_onnxruntime import RapidOCR

parser=argparse.ArgumentParser(); parser.add_argument('--pdf',required=True); parser.add_argument('--out',required=True); parser.add_argument('--images',required=True)
args=parser.parse_args(); out=Path(args.out); out.mkdir(parents=True,exist_ok=True)
ocr=RapidOCR()
for image in sorted(Path(args.images).glob('*.jpg')):
    target=out/(image.stem+'.txt')
    if target.exists(): continue
    result,_=ocr(cv2.imread(str(image)))
    target.write_text('\n'.join(item[1] for item in (result or [])),encoding='utf-8')
