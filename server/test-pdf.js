const fs = require('fs');
const path = require('path');
const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');
const { Canvas } = require('skia-canvas');

async function testPdf() {
  const pdfPath = path.join(__dirname, '..', '..', 'brain', '15bb6a18-0259-4fab-9a59-0e2704fa8c43', 'scratch', 'test-qp.pdf');
  const data = new Uint8Array(fs.readFileSync(pdfPath));
  
  const loadingTask = pdfjsLib.getDocument({
    data,
    disableFontFace: true,
    standardFontDataUrl: path.join(__dirname, 'node_modules', 'pdfjs-dist', 'standard_fonts') + '/'
  });

  const pdfDocument = await loadingTask.promise;
  console.log(`Pages: ${pdfDocument.numPages}`);

  const page = await pdfDocument.getPage(1);
  const viewport = page.getViewport({ scale: 2.0 });

  const canvas = new Canvas(viewport.width, viewport.height);
  const ctx = canvas.getContext('2d');

  await page.render({
    canvasContext: ctx,
    viewport: viewport
  }).promise;

  const outPath = path.join(__dirname, 'out.png');
  await canvas.saveAs(outPath);
  console.log(`Saved to ${outPath}`);
}

testPdf().catch(console.error);
