const { chromium, devices } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const errs = [];
  for (const slug of ['vivero-raiz', 'carbon', 'cerro-alegre']) {
    for (const [nom, ctxo] of [['desk', { viewport: { width: 1280, height: 860 } }], ['movil', devices['iPhone 13']]]) {
      const c = await b.newContext(ctxo); const p = await c.newPage();
      p.on('pageerror', e => errs.push(slug + ' ' + nom + ' ' + e.message));
      p.on('console', m => { if (m.type() === 'error' && !/fonts|ERR_TUNNEL|net::/.test(m.text())) errs.push(slug + ' ' + nom + ' console ' + m.text()); });
      await p.goto('http://localhost:4321/' + slug); await p.waitForSelector('.card');
      await p.screenshot({ path: `/tmp/shots/${slug}-${nom}.png` });
      await p.locator('.mas').first().click();
      await p.waitForTimeout(300);
      if (await p.locator('.panel').count()) { await p.screenshot({ path: `/tmp/shots/${slug}-${nom}-ficha.png` }); await p.click('#add-ficha'); await p.waitForTimeout(300); }
      await p.click('#b-carro'); await p.waitForTimeout(300);
      await p.click('input[value=domicilio] + .op').catch(()=>{});
      await p.fill('#f-nombre', 'Ana Pérez');
      await p.selectOption('#f-comuna', { index: 1 }).catch(()=>{});
      await p.fill('#f-dir', 'Los Leones 123').catch(()=>{});
      await p.screenshot({ path: `/tmp/shots/${slug}-${nom}-carro.png` });
      if (nom === 'desk') {
        let cap=''; await c.route(/wa\.me/, r => { cap = r.request().url(); r.fulfill({ body: 'ok' }); });
        await p.click('#enviar'); await p.waitForTimeout(800);
        const txt = new URL(cap).searchParams.get('text');
        console.log('---', slug, '\n', txt.slice(0, 900));
        const m = /(http:\/\/localhost[^\s]+#pedido=[^\s]+)/.exec(txt);
        if (m) { const q = await c.newPage(); q.on('pageerror', e => errs.push('comp ' + e.message)); await q.goto(m[1]); await q.waitForTimeout(500); await q.screenshot({ path: `/tmp/shots/${slug}-comprobante.png`, fullPage: true }); }
      }
      await c.close();
    }
  }
  console.log('ERRORES', errs);
  await b.close();
})();
