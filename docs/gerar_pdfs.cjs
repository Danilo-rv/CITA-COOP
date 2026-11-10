// Converte os documentos HTML em PDF (A4, com numeração de páginas).
// Uso: node docs/gerar_pdfs.cjs arquivo.html saida.pdf "Título no rodapé" [arquivo2.html saida2.pdf "Título 2" ...]
const { chromium } = require('playwright')
const path = require('path')
;(async () => {
  const a = process.argv.slice(2)
  const b = await chromium.launch()
  const p = await b.newPage()
  for (let i = 0; i < a.length; i += 3) {
    await p.goto('file://' + path.resolve(a[i]), { waitUntil: 'networkidle' })
    await p.evaluate(() => document.fonts.ready)
    await p.pdf({
      path: a[i + 1], format: 'A4', printBackground: true, displayHeaderFooter: true, preferCSSPageSize: true,
      headerTemplate: '<span></span>',
      footerTemplate: `<div style="width:100%;font-family:Arial,sans-serif;font-size:7.5pt;color:#6b7a90;padding:0 16mm;display:flex;justify-content:space-between"><span>${a[i + 2]}</span><span><span class="pageNumber"></span> / <span class="totalPages"></span></span></div>`,
    })
    console.log('pdf', a[i + 1])
  }
  await b.close()
})()
