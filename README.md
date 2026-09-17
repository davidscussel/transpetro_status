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

As oito questões de Microcontroladores / Sist. Microprocessados têm ações **Questão**, **Teoria** e **Resolução**. As ações abrem a mesma janela na aba correspondente, com navegação por teclado e fechamento por Escape.

O conteúdo está em `public/data/microcontroladores_estudo.json`, associado pelo `qid` original. Cada entrada contém teoria, etapas da resolução, gabarito e fontes; os blocos aceitam parágrafos, fórmulas, código e tabelas. `materialUrl`, opcional em cada questão de `materias.json`, habilita os botões. O arquivo é carregado sob demanda e compartilhado entre as questões, com nova tentativa em caso de falha.

Os gabaritos foram conferidos com o caderno. Na Q54, a resolução distingue o trecho que provoca o defeito do código corrigido. Na Q55, explicita que a banca chama de “resposta” o tempo até a conclusão, diferente da definição usual de primeira resposta.

#### Eletrônica — área refinada

Os sete tópicos solicitados — Amplificadores Operacionais / Potência, Diodos, Outros Componentes Eletrônicos, Retificadores, Reguladores de Tensão, Conversores CC–CC e Tópicos Mesclados — foram movidos para a área **Eletrônica**, com 14 questões. Cada questão tem **Questão**, **Teoria** e **Resolução**. O conteúdo de `public/data/eletronica_estudo.json` reúne definições, fórmulas, hipóteses de modelo e etapas de aplicação associadas ao `qid` de cada questão.

As fontes incluem recortes precisos do livro **Dispositivos Eletrônicos e Teoria de Circuitos**, de Boylestad, 8ª edição, em `public/assets/teoria/boylestad/`. O sumário do PDF-imagem foi lido com RapidOCR; `manifesto.json` registra o deslocamento entre páginas impressas e páginas do PDF e os temas cobertos. O procedimento reproduzível fica em `layout/ocr_boylestad.py` e suas dependências em `layout/requirements-ocr.txt`.

#### Sinais e Sistemas — Q66 a Q114

As 49 questões também possuem **Questão**, **Teoria** e **Resolução**. O conteúdo de `public/data/sinais_sistemas_estudo.json` é associado por `qid` e carregado ao abrir o material. Cada questão tem sua base teórica (definições, hipóteses, fórmulas e critérios pertinentes) e uma resolução que aplica essa base aos dados, figuras e alternativas do enunciado.

As fontes do painel incluem recortes do livro **Sinais e Sistemas**, de Oppenheim e Willsky, com Nawab, 2ª edição. Os nove PDFs de consulta ficam em `public/assets/teoria/oppenheim/`; os links apontam para a página pertinente dentro do recorte. `manifesto.json` registra as páginas impressas e sua correspondência no PDF original. Os recortes são carregados somente quando seus links são abertos.

Para regenerá-los com o livro fornecido em `livros/Sinais e Sistemas/Sinais e Sistemas; Oppenheim.compressed.pdf`, instale as ferramentas Poppler (`pdfseparate` e `pdfunite`) e execute:

```bash
node layout/gerar_recortes_oppenheim.mjs
```

As resoluções identificam limitações do próprio caderno: Q93 pressupõe perturbação degrau unitário; Q103 omite condições iniciais, e a solução explica quais condições correspondem ao gabarito; Q113 distingue o numerador deduzido pelas equações do circuito da impressão ambígua “s2”. As aproximações gráficas e de tempo de acomodação também são explicitadas.

Para conferir cobertura, associação das questões, gabaritos, estrutura do material e referências locais:

```bash
node layout/verificar_material_estudo.mjs
```

Essa verificação detecta falhas de dados e conteúdo genérico repetido; a correção matemática das explicações requer revisão editorial com os enunciados e as fontes.

### Respostas e desempenho

A ação **Questão** está disponível para as 200 questões. Ela exibe o PDF individual e alternativas A–E, com correção imediata. É possível trocar ou limpar a resposta. Os links do título e da janela continuam permitindo abrir o PDF separadamente.

A correção usa a letra de `answer` da resolução quando existe material. Nas demais questões, usa `public/data/gabaritos.json`, extraído de `layout/recortes_manifesto.json`. Ao atualizar o caderno ou as resoluções, mantenha esses gabaritos sincronizados e confira:

```bash
node layout/verificar_respostas.mjs
```

As respostas são salvas na chave de progresso existente, independentes da conclusão manual e da dificuldade. A última seleção determina o resultado; limpar uma resposta a devolve à contagem de não respondidas. Limpar todo o progresso também remove as respostas.

O dashboard mostra quantidades absolutas de acertos, erros e não respondidas, uma pizza relativa apenas às respondidas e um radar por assunto. O radar usa acertos/respondidas, escala de 0% a 100% com intervalos de 10% e não atribui 0% aos assuntos sem respostas. A tabela complementar traz os nomes e valores completos. Os gráficos usam todo o caderno, independentemente dos filtros da lista.
