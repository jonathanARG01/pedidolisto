const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage();
  for (const slug of fs.readdirSync(path.join(__dirname, '..', 'sitio', 'tiendas'))) {
    const svg = fs.readFileSync(path.join(__dirname, '..', 'sitio', 'tiendas', slug, 'icon.svg'), 'utf8');
    for (const s of [192, 512]) {
      await p.setViewportSize({ width: s, height: s });
      await p.setContent(`<html><body style="margin:0">${svg.replace('<svg ', `<svg width="${s}" height="${s}" `)}</body></html>`);
      await p.screenshot({ path: path.join(__dirname, '..', 'sitio', 'tiendas', slug, `icon-${s}.png`) });
    }
  }
  await b.close();
})();
