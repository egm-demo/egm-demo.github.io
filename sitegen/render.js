/* Сборка готового сайта из конфига -> строка HTML (один файл) */
window.RENDER = (function () {
  const G = window.GEN;
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const nb = t => String(t).replace(/(^|\s)(\S{1,2}|\d+)\s+/g, (m, a, b) => a + b + '\u00a0');
  const fmt = n => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '\u2009');

  // "Профгигиена — от 4500 ₽/ч"  -> {name, from, price, unit}
  function parseLine(line) {
    const m = line.split(/\s+[—–-]\s+|:\s+/);
    const name = (m[0] || '').trim();
    const rest = m.slice(1).join(' — ').trim();
    const num = rest.match(/(\d[\d\s\u2009.,]*)/);
    let price = num ? parseFloat(num[1].replace(/[\s\u2009]/g, '').replace(',', '.')) : 0;
    if (isNaN(price)) price = 0;
    const from = /^от\b/i.test(rest);
    let unit = num ? rest.slice(rest.indexOf(num[1]) + num[1].length).replace(/₽|руб\.?/i, '').trim() : '';
    if (/%/.test(unit) || /%/.test(rest)) unit = '%';
    return { name, from, price, unit, raw: rest };
  }
  const parseList = t => String(t || '').split('\n').map(s => s.trim()).filter(Boolean).map(parseLine).filter(x => x.name);
  function priceLabel(s) {
    if (!s.raw) return '';
    if (s.unit === '%') return esc(s.raw);
    if (s.price === 0) return 'Бесплатно';
    return (s.from ? 'от ' : '') + fmt(s.price) + '\u00a0₽' + (s.unit ? '\u00a0' + esc(s.unit) : '');
  }

  // ---------- Генеративная графика вместо фото ----------
  function art(type, P, seed, letter, w, h) {
    w = w || 800; h = h || 600;
    let r = seed * 9301 + 49297;
    const rnd = () => ((r = (r * 9301 + 49297) % 233280) / 233280);
    const a = P.acc, f = P.fg, c = P.card, l = P.line;
    let s = '';
    switch (type) {
      case 0: // круги
        for (let i = 0; i < 4; i++) s += `<circle cx="${w * (0.25 + rnd() * 0.5)}" cy="${h * (0.25 + rnd() * 0.5)}" r="${h * (0.18 + rnd() * 0.3)}" fill="${i === 1 ? a : 'none'}" stroke="${f}" stroke-opacity=".18" stroke-width="1.5" ${i === 1 ? 'fill-opacity=".9"' : ''}/>`;
        break;
      case 1: { // сетка
        const n = 8, cw = w / n, ch = h / 6;
        for (let x = 0; x < n; x++) for (let y = 0; y < 6; y++) { const v = rnd(); s += `<rect x="${x * cw + 3}" y="${y * ch + 3}" width="${cw - 6}" height="${ch - 6}" rx="4" fill="${v > .86 ? a : f}" fill-opacity="${v > .86 ? 1 : (v * .1).toFixed(2)}"/>`; }
        break; }
      case 2: // полосы
        for (let i = 0; i < 14; i++) s += `<rect x="0" y="${i * h / 14}" width="${w * (0.3 + rnd() * 0.7)}" height="${h / 14 - 6}" fill="${i === 5 ? a : f}" fill-opacity="${i === 5 ? 1 : .07 + (i % 3) * .03}"/>`;
        break;
      case 3: // буква
        s += `<text x="50%" y="58%" text-anchor="middle" dominant-baseline="middle" font-family="var(--fh)" font-weight="800" font-size="${h * 1.05}" fill="${f}" fill-opacity=".14">${esc(letter)}</text><circle cx="${w * .72}" cy="${h * .3}" r="${h * .08}" fill="${a}"/>`;
        break;
      case 4: { // блоки
        const cols = [[0, 0, .55, .62], [.58, 0, .42, .3], [.58, .33, .42, .29], [0, .65, .3, .35], [.33, .65, .67, .35]];
        cols.forEach((q, i) => s += `<rect x="${q[0] * w}" y="${q[1] * h}" width="${q[2] * w - 6}" height="${q[3] * h - 6}" rx="var(--r)" fill="${i === 2 ? a : f}" fill-opacity="${i === 2 ? 1 : .05 + i * .025}"/>`);
        break; }
      case 5: // волны
        for (let i = 0; i < 9; i++) { const y = h * (0.15 + i * 0.09), amp = 20 + rnd() * 40; s += `<path d="M0 ${y} C ${w * .25} ${y - amp}, ${w * .5} ${y + amp}, ${w} ${y - amp / 2}" fill="none" stroke="${i === 4 ? a : f}" stroke-opacity="${i === 4 ? 1 : .16}" stroke-width="${i === 4 ? 4 : 1.5}"/>`; }
        break;
      case 6: // точки
        for (let x = 0; x < 16; x++) for (let y = 0; y < 12; y++) { const d = Math.hypot(x - 10, y - 5); s += `<circle cx="${(x + .5) * w / 16}" cy="${(y + .5) * h / 12}" r="${Math.max(1.2, 9 - d * 0.9)}" fill="${d < 2 ? a : f}" fill-opacity="${d < 2 ? 1 : .22}"/>`; }
        break;
      case 7: // арки
        for (let i = 0; i < 5; i++) { const rr = h * (0.2 + i * 0.16); s += `<path d="M${w / 2 - rr} ${h} A ${rr} ${rr} 0 0 1 ${w / 2 + rr} ${h}" fill="none" stroke="${i === 2 ? a : f}" stroke-opacity="${i === 2 ? 1 : .18}" stroke-width="${i === 2 ? 14 : 1.5}"/>`; }
        break;
    }
    return `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><rect width="${w}" height="${h}" fill="${c}"/>${s}</svg>`;
  }

  function fontLink(F) {
    const fams = [...new Set([F.h, F.b])].map(n => 'family=' + n.replace(/ /g, '+') + ':wght@400;500;600;700;800').join('&');
    return `<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?${fams}&display=swap" rel="stylesheet">`;
  }

  function css(P, F, c) {
    const R = c.rad;
    return `
:root{--bg:${P.bg};--fg:${P.fg};--mut:${P.mut};--card:${P.card};--line:${P.line};--acc:${P.acc};--af:${P.af};--r:${R}px;--rs:${Math.min(R, 10)}px;--fh:'${F.h}',${F.serif ? 'Georgia,serif' : 'system-ui,sans-serif'};--fb:'${F.b}',system-ui,-apple-system,'Segoe UI',sans-serif;--hw:${F.hw};--ls:${F.ls}}
${F.h==='Unbounded'?'.hero h1{font-size:clamp(34px,6vw,80px)!important}h2{font-size:clamp(26px,3.6vw,44px)}':''}
*{box-sizing:border-box;margin:0;padding:0}html{color-scheme:${P.dark ? 'dark' : 'light'};scroll-behavior:smooth;-webkit-text-size-adjust:100%}
body{background:var(--bg);color:var(--fg);font:16px/1.55 var(--fb);-webkit-font-smoothing:antialiased;overflow-x:hidden}
a{color:inherit;text-decoration:none}button,input,select,textarea{font:inherit;color:inherit}
img,svg{display:block;max-width:100%}
.w{max-width:1200px;margin:0 auto;padding:0 24px}
h1,h2,h3{overflow-wrap:break-word;hyphens:auto;-webkit-hyphens:auto;min-width:0;font-family:var(--fh);font-weight:var(--hw);letter-spacing:var(--ls);line-height:1.04}
${c.caps ? `h2{text-transform:uppercase;font-size:13px!important;letter-spacing:.16em!important;font-weight:600;font-family:var(--fb)}` : ''}
h2{font-size:clamp(30px,4.4vw,52px);margin-bottom:12px}
.lead{color:var(--mut);font-size:18px;max-width:560px}
section{padding:clamp(64px,9vw,120px) 0}
.sh{display:flex;justify-content:space-between;align-items:end;gap:24px;margin-bottom:44px;flex-wrap:wrap}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;height:52px;padding:0 26px;border-radius:${R >= 14 ? 999 : R}px;background:var(--acc);color:var(--af);font-weight:600;border:0;cursor:pointer;transition:opacity .2s,transform .2s;white-space:nowrap}
.btn:hover{opacity:.86}.btn:active{transform:scale(.98)}
.btn.o{background:transparent;color:var(--fg);box-shadow:inset 0 0 0 1.5px color-mix(in srgb,var(--fg) 28%,transparent)}
.btn.o:hover{box-shadow:inset 0 0 0 1.5px var(--fg);opacity:1}
:focus-visible{outline:2px solid var(--acc);outline-offset:3px}
/* nav */
.nav{position:sticky;top:0;z-index:40;background:color-mix(in srgb,var(--bg) 82%,transparent);backdrop-filter:saturate(1.6) blur(16px);-webkit-backdrop-filter:saturate(1.6) blur(16px);border-bottom:1px solid color-mix(in srgb,var(--line) 70%,transparent)}
.nav .w{display:flex;align-items:center;height:64px;gap:28px}
.logo{font-family:var(--fh);font-weight:var(--hw);font-size:19px;letter-spacing:var(--ls);display:flex;align-items:center;gap:10px;white-space:nowrap}
.logo i{width:12px;height:12px;border-radius:${R ? '50%' : '0'};background:var(--acc);display:block}
.nav nav{display:flex;gap:24px;margin-left:auto;font-size:14px;color:var(--mut)}.nav nav a:hover{color:var(--fg)}
.nav .btn{height:40px;padding:0 18px;font-size:14px}
.tel{font-weight:600;font-size:14px;white-space:nowrap}
/* hero */
.hero{padding:clamp(48px,8vw,110px) 0 clamp(56px,8vw,100px)}
.hero h1{font-size:clamp(42px,7.2vw,96px);max-width:14ch;text-wrap:balance;padding-bottom:.06em}
.hero .tag{font-size:13px;letter-spacing:.14em;text-transform:uppercase;color:var(--mut);margin-bottom:22px;font-weight:600}
.hero .lead{margin:24px 0 34px}
.cta{display:flex;gap:12px;flex-wrap:wrap}
.art{border-radius:var(--r);overflow:hidden;background:var(--card)}.art svg{width:100%;height:100%}
.h-split .w{display:grid;grid-template-columns:1.1fr 1fr;gap:56px;align-items:center}.h-split .art{aspect-ratio:4/4.4}
.h-center{text-align:center}.h-center h1{margin:0 auto}.h-center .lead{margin:24px auto 34px}.h-center .cta{justify-content:center}.h-center .art{aspect-ratio:21/8;margin-top:64px}
.h-cover{padding:0}.h-cover .cv{position:relative;min-height:min(86vh,820px);display:flex;align-items:flex-end;background:var(--acc);color:var(--af);overflow:hidden}
.h-cover .cv .art{position:absolute;inset:0;border-radius:0;opacity:.22;mix-blend-mode:luminosity}
.h-cover .w{position:relative;padding-bottom:clamp(40px,7vw,90px);width:100%}.h-cover .tag,.h-cover .lead{color:inherit;opacity:.78}
.h-cover .btn{background:var(--af);color:var(--acc)}.h-cover .btn.o{background:transparent;color:var(--af);box-shadow:inset 0 0 0 1.5px currentColor}
.h-word h1.big{font-size:clamp(56px,15vw,220px);max-width:none;line-height:.88;letter-spacing:-.05em;word-break:break-word}
.h-word .row{display:flex;justify-content:space-between;align-items:end;gap:32px;margin-top:40px;border-top:1px solid var(--line);padding-top:28px;flex-wrap:wrap}
.h-word .row p{font-size:clamp(20px,2.2vw,28px);max-width:22ch;font-family:var(--fh);font-weight:600;letter-spacing:var(--ls);line-height:1.15}
.h-calc .w{display:grid;grid-template-columns:1fr 1fr;gap:56px;align-items:center}
.h-edit h1{font-size:clamp(42px,8.4vw,124px);max-width:16ch}.h-edit .row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:40px;margin-top:36px;align-items:end}.h-edit .art{aspect-ratio:21/7;margin-top:56px}
.h-air{text-align:center;padding-top:clamp(80px,12vw,160px)}.h-air h1{font-size:clamp(38px,5.6vw,72px);margin:0 auto;max-width:16ch}.h-air .lead{margin:20px auto 30px}.h-air .cta{justify-content:center}.h-air .art{aspect-ratio:16/7;margin-top:72px}
.h-marq h1{font-size:clamp(44px,8vw,112px);max-width:13ch}
.marq{overflow:hidden;border-block:1px solid var(--line);margin-top:56px;padding:22px 0;white-space:nowrap}
.marq div{display:inline-flex;gap:48px;animation:mq 38s linear infinite;font-family:var(--fh);font-size:clamp(22px,3vw,40px);font-weight:var(--hw);letter-spacing:var(--ls)}
.marq span:nth-child(odd){color:var(--mut)}
@keyframes mq{to{transform:translateX(-50%)}}
/* promo */
.promo{padding:0}.promo .in{background:var(--fg);color:var(--bg);border-radius:var(--r);padding:clamp(28px,4vw,48px);display:flex;justify-content:space-between;align-items:center;gap:28px;flex-wrap:wrap}
.promo h3{font-size:clamp(24px,3vw,36px)}.promo p{opacity:.7;margin-top:6px}
.cd{display:flex;gap:10px}.cd div{min-width:72px;text-align:center;padding:12px 6px;border-radius:var(--rs);background:color-mix(in srgb,var(--bg) 10%,transparent)}
.cd b{display:block;font-size:30px;font-family:var(--fh);font-weight:var(--hw);font-variant-numeric:tabular-nums;line-height:1.1}.cd small{font-size:11px;opacity:.6;text-transform:uppercase;letter-spacing:.1em}
/* services */
.s-rows .it{display:grid;grid-template-columns:1fr auto auto;gap:24px;align-items:center;padding:24px 0;border-top:1px solid var(--line)}
.s-rows .it:last-child{border-bottom:1px solid var(--line)}.s-rows .it h3{font-size:clamp(20px,2.2vw,28px)}
.pr{font-weight:600;white-space:nowrap;font-variant-numeric:tabular-nums}
.add{width:40px;height:40px;border-radius:50%;border:1.5px solid var(--line);background:none;cursor:pointer;font-size:20px;line-height:1;transition:.2s}
.add:hover,.add.on{background:var(--acc);color:var(--af);border-color:var(--acc)}
.s-tiles{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}
.s-tiles .it{background:var(--card);border-radius:var(--r);padding:28px;min-height:230px;display:flex;flex-direction:column;justify-content:space-between;gap:24px}
.s-tiles .it:first-child{grid-column:span 2;background:var(--acc);color:var(--af)}.s-tiles .it:first-child .add{border-color:currentColor;color:inherit}
.s-tiles .it h3{font-size:24px}.s-tiles .ft{display:flex;justify-content:space-between;align-items:center}
.s-price{border-radius:var(--r);overflow:hidden;background:var(--card)}
.s-price .it{display:flex;align-items:center;gap:20px;padding:20px 28px;border-bottom:1px solid var(--line)}.s-price .it:last-child{border:0}
.s-price h3{font-size:18px;font-family:var(--fb);font-weight:500;letter-spacing:0;flex:1}
.s-price .dot{flex:1;border-bottom:1px dotted var(--mut);opacity:.5;margin:0 8px;transform:translateY(-4px)}
.s-large .it{display:flex;align-items:baseline;gap:20px;padding:18px 0;border-top:1px solid var(--line);transition:padding .3s}
.s-large .it:hover{padding-left:14px}.s-large .it h3{font-size:clamp(28px,5vw,68px);flex:1;min-width:0}.s-large .n{color:var(--mut);font-size:14px;width:36px}
.s-feed{display:grid;grid-auto-flow:column;grid-auto-columns:min(320px,80%);gap:12px;overflow-x:auto;scroll-snap-type:x mandatory;padding-bottom:12px;scrollbar-width:thin}
.s-feed .it{scroll-snap-align:start;border-radius:var(--r);overflow:hidden;background:var(--card)}
.s-feed .art{aspect-ratio:4/3;border-radius:0}.s-feed .bd{padding:22px}.s-feed h3{font-size:21px;margin-bottom:14px}.s-feed .ft{display:flex;justify-content:space-between;align-items:center}
/* calc */
.calc{background:var(--card);border-radius:var(--r);padding:clamp(22px,3vw,40px);display:grid;grid-template-columns:1.3fr 1fr;gap:clamp(24px,3vw,44px)}
.h-calc .calc{grid-template-columns:1fr;background:var(--card)}
.calc .lb{font-size:13px;color:var(--mut);margin-bottom:10px;font-weight:500}
.calc .grp{margin-bottom:26px}
.chips{display:flex;flex-wrap:wrap;gap:8px}
.chip{padding:10px 16px;border-radius:999px;border:1.5px solid var(--line);background:var(--bg);cursor:pointer;font-size:14px;transition:.2s}
.chip.on{background:var(--fg);color:var(--bg);border-color:var(--fg)}
.qv{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:12px}.qv b{font-size:30px;font-family:var(--fh);font-weight:var(--hw);font-variant-numeric:tabular-nums}
input[type=range]{width:100%;accent-color:var(--acc);height:28px}
.ck{display:flex;align-items:center;gap:12px;padding:12px 0;border-top:1px solid var(--line);cursor:pointer;font-size:15px}
.ck input{width:20px;height:20px;accent-color:var(--acc);flex:none}.ck span{flex:1}.ck em{font-style:normal;color:var(--mut);white-space:nowrap;font-size:14px}
.res{background:var(--fg);color:var(--bg);border-radius:var(--r);padding:28px;display:flex;flex-direction:column;justify-content:space-between;gap:20px;min-height:280px}
.res .t{font-size:clamp(38px,4.6vw,56px);font-family:var(--fh);font-weight:var(--hw);letter-spacing:-.03em;line-height:1;font-variant-numeric:tabular-nums}
.res ul{list-style:none;font-size:14px;opacity:.72;display:grid;gap:6px}.res li{display:flex;justify-content:space-between;gap:12px}
.res .btn{background:var(--bg);color:var(--fg);width:100%}.res small{opacity:.55;font-size:12px}
/* quiz */
.quiz{max-width:760px;margin:0 auto;background:var(--card);border-radius:var(--r);padding:clamp(24px,4vw,48px)}
.qbar{height:3px;background:var(--line);border-radius:3px;margin-bottom:30px;overflow:hidden}.qbar i{display:block;height:100%;background:var(--acc);transition:width .4s}
.quiz h3{font-size:clamp(24px,3vw,34px);margin-bottom:24px}
.qopts{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.qopts button{text-align:left;padding:18px 20px;border-radius:var(--rs);border:1.5px solid var(--line);background:var(--bg);cursor:pointer;font-size:16px;transition:.2s}
.qopts button:hover{border-color:var(--fg)}
.qnote{margin-top:20px;font-size:14px;color:var(--mut)}
/* booking */
.book{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.book>div{background:var(--card);border-radius:var(--r);padding:28px}
.days{display:grid;grid-template-columns:repeat(7,1fr);gap:6px}
.days button,.slots button{border:1.5px solid var(--line);background:var(--bg);border-radius:var(--rs);padding:10px 4px;cursor:pointer;text-align:center;font-size:14px;transition:.2s}
.days button b{display:block;font-size:20px;font-family:var(--fh)}.days button small{color:var(--mut);font-size:11px}
.days button.on,.slots button.on{background:var(--fg);color:var(--bg);border-color:var(--fg)}.days button.on small{color:inherit;opacity:.7}
.slots{display:grid;grid-template-columns:repeat(4,1fr);gap:6px}.slots button:disabled{opacity:.3;text-decoration:line-through;cursor:not-allowed}
.bsum{margin-top:22px;display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap}
/* steps */
.steps{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;counter-reset:s}
.steps div{border-top:2px solid var(--fg);padding-top:20px}.steps div::before{counter-increment:s;content:counter(s,decimal-leading-zero);font-size:13px;color:var(--mut);display:block;margin-bottom:28px;font-variant-numeric:tabular-nums}
.steps div:first-child{border-color:var(--acc)}.steps h3{font-size:21px;font-family:var(--fb);font-weight:600;letter-spacing:-.01em;line-height:1.25}
/* about */
.about .w{display:grid;grid-template-columns:1fr 1fr;gap:56px;align-items:start}
.stats{display:grid;gap:0}.stats div{display:flex;justify-content:space-between;align-items:baseline;gap:20px;padding:22px 0;border-top:1px solid var(--line)}
.stats b{font-size:clamp(36px,5vw,64px);font-family:var(--fh);font-weight:var(--hw);letter-spacing:-.04em;line-height:1}.stats span{color:var(--mut);text-align:right}
/* gallery */
.gal{display:grid;grid-template-columns:2fr 1fr 1fr;grid-template-rows:240px 240px;gap:12px}.gal .art:first-child{grid-row:span 2}
/* reviews */
.revs{display:grid;grid-template-columns:1fr 1fr;gap:12px}.revs blockquote{background:var(--card);border-radius:var(--r);padding:clamp(24px,3vw,40px);font-size:clamp(19px,2vw,24px);line-height:1.4;font-family:var(--fh);letter-spacing:-.01em}
.revs cite{display:block;margin-top:22px;font:500 14px var(--fb);color:var(--mut);font-style:normal}.stars{color:var(--acc);letter-spacing:2px;font-size:14px;margin-bottom:14px;font-family:var(--fb)}
/* faq */
.faq .w{display:grid;grid-template-columns:1fr 1.6fr;gap:56px}
details{border-top:1px solid var(--line)}details:last-child{border-bottom:1px solid var(--line)}
summary{list-style:none;cursor:pointer;padding:24px 40px 24px 0;font-size:19px;font-weight:600;position:relative}summary::-webkit-details-marker{display:none}
summary::after{content:'';position:absolute;right:6px;top:50%;width:12px;height:12px;border-right:1.5px solid;border-bottom:1.5px solid;transform:translateY(-70%) rotate(45deg);transition:transform .3s}
details[open] summary::after{transform:translateY(-30%) rotate(225deg)}details p{padding:0 40px 24px 0;color:var(--mut)}
/* form */
.form .in{background:var(--fg);color:var(--bg);border-radius:var(--r);padding:clamp(28px,5vw,72px);display:grid;grid-template-columns:1fr 1fr;gap:48px}
.form h2{color:inherit}.form .lead{color:inherit;opacity:.65}
.form form{display:grid;gap:12px}
.form input,.form textarea{width:100%;background:color-mix(in srgb,var(--bg) 8%,transparent);border:1.5px solid color-mix(in srgb,var(--bg) 18%,transparent);border-radius:var(--rs);padding:16px 18px;color:var(--bg);outline:none;transition:border-color .2s}
.form input::placeholder,.form textarea::placeholder{color:color-mix(in srgb,var(--bg) 55%,transparent)}
.form input:focus,.form textarea:focus{border-color:var(--bg)}
.form .btn{background:var(--bg);color:var(--fg);width:100%}
.form small{opacity:.55;font-size:12px;line-height:1.4}
.ok{display:none;font-size:20px;font-weight:600}.sent form{display:none}.sent .ok{display:block}
/* contacts */
.cont .w{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.cont .w>div{padding:26px 0;border-top:1px solid var(--line)}
.cont small{display:block;color:var(--mut);font-size:13px;margin-bottom:8px}.cont b{font-size:20px;font-weight:600}
footer{padding:40px 0 60px;color:var(--mut);font-size:14px}footer .w{display:flex;justify-content:space-between;gap:20px;flex-wrap:wrap}
.fab{position:fixed;right:20px;bottom:20px;z-index:50;height:56px;padding:0 22px;border-radius:999px;background:var(--acc);color:var(--af);display:flex;align-items:center;gap:10px;font-weight:600;box-shadow:0 10px 30px rgba(0,0,0,.18);opacity:0;transform:translateY(20px);pointer-events:none;transition:.35s}
.fab.on{opacity:1;transform:none;pointer-events:auto}
.rv{opacity:0;transform:translateY(18px);transition:opacity .8s cubic-bezier(.2,.7,.2,1),transform .8s cubic-bezier(.2,.7,.2,1)}.rv.in{opacity:1;transform:none}
@media (prefers-reduced-motion:reduce){.rv{opacity:1;transform:none;transition:none}.marq div{animation:none}html{scroll-behavior:auto}}
@media (max-width:900px){
 .nav nav,.tel{display:none}.nav .btn{margin-left:auto}
 .h-split .w,.h-calc .w,.about .w,.faq .w,.form .in,.calc,.book,.h-edit .row{grid-template-columns:1fr}
 .h-split .art{aspect-ratio:4/3}.s-tiles{grid-template-columns:repeat(2,minmax(0,1fr))}.steps{grid-template-columns:1fr 1fr;row-gap:36px}
 .revs,.cont .w{grid-template-columns:1fr}.gal{grid-template-columns:1fr 1fr;grid-template-rows:180px 180px 180px}.gal .art:first-child{grid-column:span 2;grid-row:auto}
}
@media (max-width:560px){
 .w{padding:0 18px}body{font-size:15px}.lead{font-size:16px}
 .s-tiles{grid-template-columns:minmax(0,1fr)}.s-tiles .it{padding:22px}.s-tiles .it:first-child{grid-column:auto}.s-tiles .it{min-height:180px}
 .s-rows .it{grid-template-columns:1fr auto;gap:8px 16px}.s-rows .it .pr{grid-column:1;grid-row:2;color:var(--mut)}.s-rows .it .add{grid-row:1/3;grid-column:2}
 .s-price .it{padding:16px 18px;gap:12px}.s-price .dot{display:none}.s-price h3{font-size:16px}
 .qopts{grid-template-columns:1fr}.slots{grid-template-columns:repeat(3,1fr)}.days{grid-template-columns:repeat(4,1fr)}
 .cd div{min-width:60px}.cd b{font-size:24px}.cta .btn{flex:1}.fab span{display:none}.fab{padding:0;width:56px;justify-content:center}
 .h-word .row .cta{width:100%}
 .s-large .it{display:grid;grid-template-columns:28px 1fr auto;gap:4px 12px;align-items:center}.s-large .it h3{font-size:26px}.s-large .it .pr{grid-column:2;color:var(--mut);font-size:14px}.s-large .it .add{grid-row:1/3;grid-column:3}.s-large .n{grid-row:1/3}
 .hero h1{font-size:clamp(34px,10.5vw,56px)}.h-word h1.big{font-size:clamp(48px,17vw,96px)}
}`;
  }

  function build(c) {
    const P = G.PAL[c.pal], F = G.FONT[c.font], ind = G.IND.find(x => x.id === c.ind) || G.IND[0];
    const svcs = parseList(c.services);
    const name = c.name || ind.sample;
    const letter = (name.trim()[0] || 'A').toUpperCase();
    const seed = (c.seed || 1);
    const M = c.mods;
    const phone = c.phone || '+7 (900) 000-00-00';
    const tel = phone.replace(/[^\d+]/g, '');
    const A = (t, k, w, h) => `<div class="art">${art(t, P, seed + (k || 0), letter, w, h)}</div>`;
    const cta = `<div class="cta"><a class="btn" href="#${M.calc ? 'calc' : 'form'}">${esc(c.ctaText || (M.calc ? 'Рассчитать стоимость' : 'Оставить заявку'))}</a><a class="btn o" href="#services">Услуги и цены</a></div>`;
    const tag = `<div class="tag">${esc(c.tagline || ind.tag)}</div>`;
    const H1 = esc(nb(c.headline || ind.heads[0]));
    const sub = esc(nb(c.sub || ind.sub));
    const S = {};

    // ---- hero ----
    const calcHero = c.hero === 4 && M.calc;
    switch (c.hero) {
      case 0: S.hero = `<section class="hero h-split"><div class="w"><div>${tag}<h1>${H1}</h1><p class="lead">${sub}</p>${cta}</div>${A(c.art, 0, 800, 880)}</div></section>`; break;
      case 1: S.hero = `<section class="hero h-center"><div class="w">${tag}<h1>${H1}</h1><p class="lead">${sub}</p>${cta}${A(c.art, 0, 1200, 460)}</div></section>`; break;
      case 2: S.hero = `<section class="hero h-cover"><div class="cv">${A(c.art, 0, 1400, 820)}<div class="w">${tag}<h1>${H1}</h1><p class="lead">${sub}</p>${cta}</div></div></section>`; break;
      case 3: S.hero = `<section class="hero h-word"><div class="w">${tag}<h1 class="big">${esc(name)}</h1><div class="row"><p>${H1}</p>${cta}</div></div></section>`; break;
      case 4: S.hero = `<section class="hero h-calc"><div class="w"><div>${tag}<h1>${H1}</h1><p class="lead">${sub}</p>${cta.replace('#calc', '#form')}</div>${calcHero ? '<div id="calc">@@CALC@@</div>' : A(c.art, 0, 800, 800)}</div></section>`; break;
      case 5: S.hero = `<section class="hero h-edit"><div class="w">${tag}<h1>${H1}</h1><div class="row"><p class="lead" style="margin:0">${sub}</p>${cta}</div>${A(c.art, 0, 1400, 470)}</div></section>`; break;
      case 6: S.hero = `<section class="hero h-air"><div class="w">${tag}<h1>${H1}</h1><p class="lead">${sub}</p>${cta}${A(c.art, 0, 1400, 610)}</div></section>`; break;
      default: {
        const items = svcs.map(s => `<span>${esc(s.name)}</span>`).join('');
        S.hero = `<section class="hero h-marq"><div class="w">${tag}<h1>${H1}</h1><p class="lead">${sub}</p>${cta}</div><div class="marq"><div>${items}${items}</div></div></section>`;
      }
    }

    // ---- promo ----
    if (M.promo) S.promo = `<section class="promo" style="padding-top:0"><div class="w"><div class="in rv"><div><h3>${esc(c.promoTitle || 'Скидка 10% до конца месяца')}</h3><p>${esc(c.promoText || 'Назовите код САЙТ при записи')}</p></div><div class="cd" id="cd"><div><b>00</b><small>дней</small></div><div><b>00</b><small>часов</small></div><div><b>00</b><small>минут</small></div></div><a class="btn" style="background:var(--bg);color:var(--fg)" href="#form">Забрать скидку</a></div></div></section>`;

    // ---- services ----
    const addB = (i) => M.calc && c.calcMode === 'sum' ? `<button class="add" data-add="${i}" aria-label="Добавить в расчёт">+</button>` : '';
    let sv = '';
    const sh = `<div class="sh"><div><h2>Услуги и цены</h2><p class="lead">${M.calc && c.calcMode === 'sum' ? 'Нажмите «+», чтобы добавить услугу в расчёт.' : 'Цены актуальны на сегодня. Точную стоимость назовём после консультации.'}</p></div></div>`;
    switch (c.svc) {
      case 0: sv = `<div class="s-rows">${svcs.map((s, i) => `<div class="it rv"><h3>${esc(s.name)}</h3><span class="pr">${priceLabel(s)}</span>${addB(i) || '<span></span>'}</div>`).join('')}</div>`; break;
      case 1: sv = `<div class="s-tiles">${svcs.map((s, i) => `<div class="it rv"><h3>${esc(s.name)}</h3><div class="ft"><span class="pr">${priceLabel(s)}</span>${addB(i)}</div></div>`).join('')}</div>`; break;
      case 2: sv = `<div class="s-price rv">${svcs.map((s, i) => `<div class="it"><h3>${esc(s.name)}</h3><span class="pr">${priceLabel(s)}</span>${addB(i)}</div>`).join('')}</div>`; break;
      case 3: sv = `<div class="s-large">${svcs.map((s, i) => `<div class="it rv"><span class="n">${String(i + 1).padStart(2, '0')}</span><h3>${esc(s.name)}</h3><span class="pr">${priceLabel(s)}</span>${addB(i)}</div>`).join('')}</div>`; break;
      default: sv = `<div class="s-feed">${svcs.map((s, i) => `<div class="it">${A((c.art + i) % 8, i + 3, 640, 480)}<div class="bd"><h3>${esc(s.name)}</h3><div class="ft"><span class="pr">${priceLabel(s)}</span>${addB(i)}</div></div></div>`).join('')}</div>`;
    }
    S.services = `<section id="services"><div class="w">${sh}${sv}</div></section>`;

    // ---- calc ----
    let calcHTML = '';
    if (M.calc) {
      const mod = c.calcMod || [];
      const chips = mod.length ? `<div class="grp"><div class="lb">${esc(c.calcModName || 'Вариант')}</div><div class="chips" data-g="mod">${mod.map((m, i) => `<button type="button" class="chip${i === 0 ? ' on' : ''}" data-k="${m[1]}">${esc(m[0])}</button>`).join('')}</div></div>` : '';
      let left = '';
      if (c.calcMode === 'rate') {
        const q = c.calcQ;
        const ex = parseList(c.calcExtras);
        left = `<div class="grp"><div class="qv"><span class="lb" style="margin:0">${esc(q[0])}</span><b><span id="qn">${q[5]}</span> ${esc(q[1])}</b></div><input type="range" id="qr" min="${q[2]}" max="${q[3]}" step="${q[4]}" value="${q[5]}" aria-label="${esc(q[0])}"></div>${chips}${ex.length ? `<div class="grp"><div class="lb">Дополнительно</div>${ex.map(e => `<label class="ck"><input type="checkbox" data-x="${e.price}"><span>${esc(e.name)}</span><em>+${fmt(e.price)} ₽</em></label>`).join('')}</div>` : ''}`;
      } else {
        left = `${chips}<div class="grp"><div class="lb">Выберите услуги</div>${svcs.map((s, i) => `<label class="ck"><input type="checkbox" data-s="${i}" ${i === 0 ? 'checked' : ''}><span>${esc(s.name)}</span><em>${priceLabel(s)}</em></label>`).join('')}</div>`;
      }
      calcHTML = `<div class="calc rv"><div>${calcHero ? `<h3 style="font-size:24px;margin-bottom:22px">${esc(c.calcTitle)}</h3>` : ''}${left}</div><div class="res"><div><div class="lb" style="color:inherit;opacity:.6">Итого${c.calcMode === 'sum' && svcs.some(s => s.from) ? ', от' : ''}</div><div class="t"><span id="tot">0</span>&nbsp;₽</div></div><ul id="br"></ul><div><a class="btn" href="#form" id="cgo">Зафиксировать цену</a><small style="display:block;margin-top:12px">Расчёт предварительный. Точную цену подтвердим после звонка.</small></div></div></div>`;
      if (!calcHero) S.calc = `<section id="calc"><div class="w"><div class="sh"><div><h2>${esc(c.calcTitle)}</h2><p class="lead">Цена считается сразу. Отправьте расчёт, и мы закрепим её за вами.</p></div></div>${calcHTML}</div></section>`;
    }
    if (calcHero) S.hero = S.hero.replace('@@CALC@@', calcHTML);

    // ---- quiz ----
    if (M.quiz) S.quiz = `<section id="quiz"><div class="w"><div class="sh" style="justify-content:center;text-align:center"><div><h2>Подберём решение за минуту</h2><p class="lead" style="margin:0 auto">Ответьте на ${ind.quiz.length + 1} вопроса и получите расчёт со скидкой 5%.</p></div></div><div class="quiz rv" id="qz"><div class="qbar"><i style="width:0"></i></div><div id="qb"></div></div></div></section>`;

    // ---- booking ----
    if (M.booking) S.booking = `<section id="booking"><div class="w"><div class="sh"><div><h2>Онлайн-запись</h2><p class="lead">Выберите день и время. Мы перезвоним и подтвердим.</p></div></div><div class="book rv"><div><div class="lb" style="font-size:13px;color:var(--mut);margin-bottom:14px">День</div><div class="days" id="days"></div></div><div><div class="lb" style="font-size:13px;color:var(--mut);margin-bottom:14px">Время</div><div class="slots" id="slots"></div><div class="bsum"><span id="bsel" style="color:var(--mut)">Время не выбрано</span><a class="btn" href="#form" id="bgo">Записаться</a></div></div></div></div></section>`;

    // ---- steps ----
    if (M.steps) S.steps = `<section><div class="w"><div class="sh"><h2>Как мы работаем</h2></div><div class="steps">${ind.steps.map(s => `<div class="rv"><h3>${esc(s)}</h3></div>`).join('')}</div></div></section>`;

    // ---- about ----
    if (M.about) S.about = `<section class="about" id="about"><div class="w"><div><h2>${esc(name)}</h2><p class="lead">${esc(c.about || ind.sub)}</p></div><div class="stats">${ind.stats.map(s => `<div class="rv"><b>${esc(s[0])}</b><span>${esc(s[1])}</span></div>`).join('')}</div></div></section>`;

    // ---- gallery ----
    if (M.gallery) S.gallery = `<section><div class="w"><div class="sh"><h2>Работы</h2></div><div class="gal rv">${[0, 1, 2, 3, 4].map(i => A((c.art + i * 3) % 8, i + 10, i ? 600 : 900, i ? 480 : 980)).join('')}</div></div></section>`;

    // ---- reviews ----
    if (M.reviews) S.reviews = `<section id="reviews"><div class="w"><div class="sh"><h2>Отзывы</h2></div><div class="revs">${ind.rev.map(r => `<blockquote class="rv"><div class="stars">★★★★★</div>«${esc(r[1])}»<cite>${esc(r[0])}</cite></blockquote>`).join('')}</div></div></section>`;

    // ---- faq ----
    if (M.faq) S.faq = `<section class="faq" id="faq"><div class="w"><div><h2>Вопросы</h2><p class="lead">Не нашли ответ? Позвоните, ответим за пару минут.</p></div><div>${ind.faq.map((f, i) => `<details${i === 0 ? ' open' : ''}><summary>${esc(f[0])}</summary><p>${esc(f[1])}</p></details>`).join('')}</div></div></section>`;

    // ---- form ----
    const via = c.leadTo || 'demo';
    if (M.form) S.form = `<section class="form" id="form"><div class="w"><div class="in rv"><div><h2>Оставьте заявку</h2><p class="lead">Перезвоним в течение 15 минут в рабочее время.</p></div><div id="fw"><form id="lf"><input name="n" placeholder="Имя" required autocomplete="name"><input name="p" type="tel" placeholder="Телефон" required autocomplete="tel"><textarea name="m" id="fm" rows="3" placeholder="Комментарий"></textarea><button class="btn" type="submit">${via === 'wa' ? 'Отправить в WhatsApp' : via === 'mail' ? 'Отправить на почту' : 'Отправить'}</button><small>Нажимая кнопку, вы соглашаетесь на обработку персональных данных.</small></form><div class="ok">Спасибо! Мы скоро перезвоним.</div></div></div></div></section>`;

    // ---- contacts ----
    if (M.contacts) S.contacts = `<section class="cont" id="contacts" style="padding-bottom:0"><div class="w"><div><small>Телефон</small><b><a href="tel:${tel}">${esc(phone)}</a></b></div><div><small>Адрес</small><b>${esc(c.address || 'Москва, ул. Примерная, 1')}</b></div><div><small>Режим работы</small><b>${esc(c.hours || 'Ежедневно 9:00–21:00')}</b></div></div></section>`;

    const order = G.ORDERS[c.order] || G.ORDERS[0];
    const body = order.map(k => S[k] || '').join('');
    const links = [['services', 'Услуги'], M.calc && !calcHero ? ['calc', 'Цены'] : null, M.booking ? ['booking', 'Запись'] : null, M.reviews ? ['reviews', 'Отзывы'] : null, M.contacts ? ['contacts', 'Контакты'] : null].filter(Boolean);

    const cfg = {
      svcs: svcs.map(s => ({ n: s.name, p: s.price, f: s.from })), mode: c.calcMode, rate: +c.calcRate || 0,
      q: c.calcQ, modName: c.calcModName, quiz: ind.quiz, name, via, wa: tel.replace('+', ''), mail: c.email || '', calc: !!M.calc
    };

    return `<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(name)} — ${esc(c.tagline || ind.tag)}</title><meta name="description" content="${sub}"><meta name="theme-color" content="${P.bg}">${fontLink(F)}<link rel="icon" href="data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' rx='${Math.min(c.rad, 16)}' fill='${P.acc}'/><text x='16' y='22' text-anchor='middle' font-family='Arial' font-weight='700' font-size='17' fill='${P.af}'>${esc(letter)}</text></svg>`)}"><style>${css(P, F, c)}</style></head><body>
<header class="nav"><div class="w"><a class="logo" href="#"><i></i>${esc(name)}</a><nav>${links.map(l => `<a href="#${l[0]}">${l[1]}</a>`).join('')}</nav><a class="tel" href="tel:${tel}">${esc(phone)}</a><a class="btn" href="#form">Заявка</a></div></header>
<main>${body}</main>
<footer><div class="w"><span>© ${new Date().getFullYear()} ${esc(name)}</span><span>${esc(c.inn ? 'ИНН ' + c.inn : '')}</span></div></footer>
${M.fab ? `<a class="fab" id="fab" href="tel:${tel}"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/></svg><span>Позвонить</span></a>` : ''}
<script>window.SITE=${JSON.stringify(cfg).replace(/</g, '\\u003c')};
${SITE_JS}
</script></body></html>`;
  }

  // Скрипт, который живёт внутри сгенерированного сайта
  const SITE_JS = `(function(){var C=window.SITE,$=function(s,r){return (r||document).querySelector(s)},$$=function(s,r){return [].slice.call((r||document).querySelectorAll(s))};
var f=function(n){return Math.round(n).toString().replace(/\\B(?=(\\d{3})+(?!\\d))/g,'\\u2009')};
var io=new IntersectionObserver(function(e){e.forEach(function(x){if(x.isIntersecting){x.target.classList.add('in');io.unobserve(x.target)}})},{threshold:.12});$$('.rv').forEach(function(el){io.observe(el)});
var fab=$('#fab');if(fab){var hero=$('.hero');addEventListener('scroll',function(){fab.classList.toggle('on',scrollY>(hero?hero.offsetHeight*.8:500))},{passive:true})}
var cd=$('#cd');if(cd){var tick=function(){var n=new Date(),e=new Date(n.getFullYear(),n.getMonth()+1,1),d=Math.max(0,e-n),b=$$('b',cd);b[0].textContent=String(Math.floor(d/864e5)).padStart(2,'0');b[1].textContent=String(Math.floor(d/36e5)%24).padStart(2,'0');b[2].textContent=String(Math.floor(d/6e4)%60).padStart(2,'0')};tick();setInterval(tick,3e4)}
var summary='';
if(C.calc){var k=1,qr=$('#qr'),qn=$('#qn'),tot=$('#tot'),br=$('#br');
$$('[data-g=mod] .chip').forEach(function(b){b.onclick=function(){$$('[data-g=mod] .chip').forEach(function(x){x.classList.remove('on')});b.classList.add('on');calc()}});
function calc(){var on=$('[data-g=mod] .chip.on');k=on?+on.dataset.k:1;var t=0,rows=[];
if(C.mode==='rate'){var q=+qr.value;qn.textContent=String(q).replace('.',',');var base=q*C.rate*k;t=base;rows.push([C.q[0]+': '+String(q).replace('.',',')+' '+C.q[1],base]);
$$('[data-x]').forEach(function(x){if(x.checked){t+=+x.dataset.x;rows.push([x.parentNode.querySelector('span').textContent,+x.dataset.x])}})}
else{$$('[data-s]').forEach(function(x){if(x.checked){var s=C.svcs[+x.dataset.s];t+=s.p*k;rows.push([s.n,s.p*k])}});
$$('[data-add]').forEach(function(b){var x=$('[data-s="'+b.dataset.add+'"]');b.classList.toggle('on',!!(x&&x.checked));b.textContent=x&&x.checked?'✓':'+'})}
if(on&&k!==1)rows.push([on.textContent,null]);
tot.textContent=f(t);br.innerHTML=rows.slice(0,5).map(function(r){return '<li><span>'+r[0].replace(/</g,'&lt;')+'</span><span>'+(r[1]==null?'':f(r[1])+' ₽')+'</span></li>'}).join('')||'<li>Выберите услуги</li>';
summary='Расчёт: '+rows.map(function(r){return r[0]}).join(', ')+'. Итого '+f(t)+' ₽'}
if(qr)qr.oninput=calc;$$('[data-x],[data-s]').forEach(function(x){x.onchange=calc});
$$('[data-add]').forEach(function(b){b.onclick=function(){var x=$('[data-s="'+b.dataset.add+'"]');if(x){x.checked=!x.checked;calc()}}});
calc();var g=$('#cgo');if(g)g.onclick=function(){var m=$('#fm');if(m)m.value=summary}}
var qz=$('#qz');if(qz){var st=0,ans=[],Q=C.quiz.concat([['Как с вами связаться?',null]]);
function draw(){$('.qbar i',qz).style.width=(st/Q.length*100)+'%';var q=Q[st],b=$('#qb');
if(!q){b.innerHTML='<h3>Готово! Ваша скидка 5% закреплена</h3><p class="qnote">Менеджер свяжется с вами и пришлёт расчёт.</p>';return}
if(!q[1]){b.innerHTML='<h3>'+q[0]+'</h3><form id="qf" style="display:grid;gap:10px"><input required placeholder="Телефон" type="tel" style="padding:16px 18px;border-radius:var(--rs);border:1.5px solid var(--line);background:var(--bg)"><button class="btn">Получить расчёт</button></form><p class="qnote">Шаг '+(st+1)+' из '+Q.length+'</p>';
$('#qf').onsubmit=function(e){e.preventDefault();var p=$('input',this).value;send('Квиз: '+ans.join(' / '),'',p);st++;draw()};return}
b.innerHTML='<h3>'+q[0]+'</h3><div class="qopts">'+q[1].map(function(o){return '<button type="button">'+o+'</button>'}).join('')+'</div><p class="qnote">Шаг '+(st+1)+' из '+Q.length+'</p>';
$$('.qopts button',b).forEach(function(x){x.onclick=function(){ans.push(x.textContent);st++;draw()}})}draw()}
var days=$('#days');if(days){var D=['вс','пн','вт','ср','чт','пт','сб'],sel={d:null,t:null},now=new Date();
for(var i=0;i<7;i++){var d=new Date(now);d.setDate(now.getDate()+i);var bt=document.createElement('button');bt.type='button';bt.innerHTML='<small>'+(i?D[d.getDay()]:'сегодня')+'</small><b>'+d.getDate()+'</b>';bt.dataset.l=d.toLocaleDateString('ru-RU',{day:'numeric',month:'long'});bt.dataset.i=i;days.appendChild(bt)}
function slots(i){var s=$('#slots');s.innerHTML='';for(var h=10;h<=20;h++){var b=document.createElement('button');b.type='button';b.textContent=h+':00';if((h*7+i*3)%5===0||(i===0&&h<=now.getHours()))b.disabled=true;s.appendChild(b)}
$$('#slots button').forEach(function(b){b.onclick=function(){$$('#slots button').forEach(function(x){x.classList.remove('on')});b.classList.add('on');sel.t=b.textContent;upd()}})}
function upd(){$('#bsel').textContent=sel.d&&sel.t?sel.d+', '+sel.t:'Время не выбрано'}
$$('#days button').forEach(function(b){b.onclick=function(){$$('#days button').forEach(function(x){x.classList.remove('on')});b.classList.add('on');sel.d=b.dataset.l;sel.t=null;slots(+b.dataset.i);upd()}});
$$('#days button')[0].click();$('#bgo').onclick=function(){var m=$('#fm');if(m&&sel.d&&sel.t)m.value='Запись: '+sel.d+', '+sel.t}}
function send(msg,n,p){var t=C.name+'. Заявка с сайта\\n'+(n?'Имя: '+n+'\\n':'')+'Телефон: '+p+(msg?'\\n'+msg:'');
if(C.via==='wa'&&C.wa)window.open('https://wa.me/'+C.wa+'?text='+encodeURIComponent(t),'_blank');
else if(C.via==='mail'&&C.mail)location.href='mailto:'+C.mail+'?subject='+encodeURIComponent('Заявка с сайта')+'&body='+encodeURIComponent(t)}
var lf=$('#lf');if(lf)lf.onsubmit=function(e){e.preventDefault();send(lf.m.value,lf.n.value,lf.p.value);$('#fw').classList.add('sent')};
})();`;

  return { build, parseList };
})();
