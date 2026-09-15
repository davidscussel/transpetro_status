# Transpetro Dashboard

Dashboard Angular para organizar estudos com base no caderno de questoes de provas anteriores da Transpetro.

## Desenvolvimento

- npm install: instala dependencias.
- npm start: inicia o servidor em http://localhost:4200.
- npm run build: gera a versao de producao em dist/.
- npm test -- --watch=false: executa os testes unitarios.

## Dados

As questoes ficam em public/data/materias.json. O PDF de referencia esta em public/assets/caderno-ultimas-provas-transpetro.pdf. O progresso e salvo somente no localStorage do navegador.

### PDFs por questão e assunto

Os links das questões abrem PDFs individuais em `public/assets/questoes/`. Cada assunto também tem um link para seu PDF completo em `public/assets/assuntos/`, com as questões na ordem do caderno e somente o gabarito daquele assunto ao final. Os PDFs individuais não incluem respostas.

Os campos `pdfUrl` da base apontam para esses arquivos locais; `url` mantém a referência original. Os nomes e números usados pelo progresso salvo não foram alterados.

Para regenerar os recortes a partir de `layout/Caderno ultimas provas da transpetro.pdf`:

```bash
python3 -m venv /tmp/transpetro-pdf-venv
/tmp/transpetro-pdf-venv/bin/pip install -r layout/requirements-pdf.txt
/tmp/transpetro-pdf-venv/bin/python layout/gerar_recortes.py --render-check
```

O script usa [PyMuPDF](https://pymupdf.readthedocs.io/en/latest/page.html#Page.apply_redactions) para preservar texto e figuras. Ele cruza os códigos `qid` com a classificação do aplicativo, reúne continuações em uma página por questão e remove cabeçalhos, rodapés e conteúdo das questões vizinhas. Os PDFs são gerados e conferidos em uma pasta temporária antes de serem publicados. Não é preciso Python para executar ou compilar o Angular.

`layout/recortes_manifesto.json` registra o SHA-256 do original, os números, respostas e retângulos de origem. As páginas começam em 1 e as coordenadas estão em pontos PDF a partir do canto superior esquerdo. A geração interrompe diante de códigos divergentes, alternativas ausentes ou limites que atravessem texto ou figuras; alterações de diagramação no caderno exigem revisar esses limites no script.

Para verificar os PDFs existentes, inclusive comparando cada trecho renderizado com o original, sem alterar arquivos:

```bash
/tmp/transpetro-pdf-venv/bin/python layout/gerar_recortes.py --check --render-check
```

### Teoria e resolução

As oito questões de Microcontroladores / Sist. Microprocessados têm ações **Questão**, **Teoria** e **Resolução**. A questão abre o PDF; o material abre em um modal com abas, navegação por teclado e fechamento por Escape, sem alterar o progresso salvo.

O conteúdo está em `public/data/microcontroladores_estudo.json`, associado pelo `qid` original. Cada entrada contém teoria, etapas da resolução, gabarito e fontes; os blocos aceitam parágrafos, fórmulas, código e tabelas. `materialUrl`, opcional em cada questão de `materias.json`, habilita os botões. O arquivo é carregado sob demanda e compartilhado entre as questões, com nova tentativa em caso de falha.

Os gabaritos foram conferidos com o caderno. Na Q54, a resolução distingue o trecho que provoca o defeito do código corrigido. Na Q55, explicita que a banca chama de “resposta” o tempo até a conclusão, diferente da definição usual de primeira resposta.
