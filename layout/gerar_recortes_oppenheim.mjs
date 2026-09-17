import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// A página impressa 1 corresponde à página 22 do PDF fornecido pelo usuário.
const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const source = join(root, 'livros/Sinais e Sistemas/Sinais e Sistemas; Oppenheim.compressed.pdf');
const output = join(root, 'public/assets/teoria/oppenheim');
const temporary = mkdtempSync(join(tmpdir(), 'transpetro-oppenheim-'));
const groups = [
  { name: 'modelos_equacoes', pages: [25, 26, 27, 70, 71, 74, 75], sections: '1.5 e 2.4: sistemas, equações e diagramas' },
  { name: 'primeira_segunda_ordem', pages: [262, 264, 265, 266, 267], sections: '6.5.1 e 6.5.2: respostas de primeira e segunda ordem' },
  { name: 'bode', pages: [255, 268, 269], sections: '6.2.3 e 6.5.3: magnitude, fase e diagramas de Bode' },
  { name: 'laplace_fourier', pages: [391, 392], sections: '9.1: transformada de Laplace e relação com Fourier' },
  { name: 'laplace_valores_limites', pages: [412, 413], sections: '9.5.10: teoremas dos valores inicial e final' },
  { name: 'polos_estabilidade', pages: [415, 416, 417], sections: '9.7.2 e 9.7.3: estabilidade e equações diferenciais' },
  { name: 'transformada_z', pages: [442, 443, 458, 465, 474], sections: '10.1, 10.5.2, 10.7.3 e 10.9.3: definição, atraso e equações de diferenças' },
  { name: 'realimentacao', pages: [488, 489], sections: '11.1: sistemas com realimentação linear' },
  { name: 'lugar_raizes', pages: [497, 498, 499, 500, 501, 502, 503], sections: '11.3: análise do lugar das raízes' },
];

mkdirSync(output, { recursive: true });
for (const group of groups) {
  const files = group.pages.map((page) => {
    const pdfPage = page + 21;
    const target = join(temporary, `page-${pdfPage}.pdf`);
    execFileSync('pdfseparate', ['-f', String(pdfPage), '-l', String(pdfPage), source, target]);
    return target;
  });
  execFileSync('pdfunite', [...files, join(output, `${group.name}.pdf`)]);
  console.log(`${group.name}: páginas impressas ${group.pages.join(', ')}`);
}
writeFileSync(join(output, 'manifesto.json'), JSON.stringify({
  source: 'Sinais e Sistemas — Oppenheim e Willsky, com Nawab, 2ª edição, tradução brasileira, 2010',
  sourcePath: 'livros/Sinais e Sistemas/Sinais e Sistemas; Oppenheim.compressed.pdf',
  printedToPdfOffset: 21,
  excerpts: groups.map((group) => ({ ...group, pdfPages: group.pages.map((p) => p + 21), file: `${group.name}.pdf` })),
}, null, 2) + '\n');
