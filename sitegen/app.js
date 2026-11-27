(function () {
  const G = window.GEN, R = window.RENDER;
  const $ = (s, r) => (r || document).querySelector(s), $$ = (s, r) => [...(r || document).querySelectorAll(s)];
  const LS = 'sitegen.v1';
  const TEXT = ['name', 'tagline', 'headline', 'sub', 'services', 'phone', 'email', 'address', 'hours', 'inn', 'about', 'calcTitle', 'qName', 'qUnit', 'qMin', 'qMax', 'qStep', 'calcRate', 'calcExtras', 'calcModName', 'calcModTxt', 'promoTitle', 'promoText'];
  const MODS = [
    ['calc', 'Калькулятор стоимости', 'Клиент сам считает цену'],
    ['quiz', 'Квиз-подбор', 'Пара вопросов и телефон'],
    ['booking', 'Онлайн-запись', 'Выбор дня и времени'],
    ['promo', 'Акция с таймером', 'Отсчёт до конца месяца'],
    ['steps', 'Этапы работы', '4 шага'],
    ['about', 'О компании и цифры', ''],
    ['gallery', 'Галерея работ', ''],
    ['reviews', 'Отзывы', ''],
    ['faq', 'Вопросы и ответы', ''],
    ['form', 'Форма заявки', ''],
    ['contacts', 'Контакты', ''],
    ['fab', 'Плавающая кнопка звонка', 'Появляется при скролле']
  ];
  let c, touched = {};

  const indOf = id => G.IND.find(x => x.id === id);
  function contentFrom(ind, j) {
    const k = ind.calc;
    return {
      name: ind.sample, tagline: ind.tag, headline: ind.heads[j || 0], sub: ind.sub, services: ind.svc,
      phone: '+7 (900) 123-45-67', email: 'hello@example.ru', address: 'Москва, ул. Примерная, 12', hours: 'Ежедневно 9:00–21:00', inn: '', about: '',
      calcTitle: k.title, calcMode: k.mode, qName: k.q ? k.q[0] : 'Количество', qUnit: k.q ? k.q[1] : 'шт', qMin: k.q ? k.q[2] : 1, qMax: k.q ? k.q[3] : 100, qStep: k.q ? k.q[4] : 1, qVal: k.q ? k.q[5] : 10,
      calcRate: k.rate || 1000, calcExtras: k.extras || '', calcModName: k.mod ? k.mod[0] : '', calcModTxt: k.mod ? k.mod[1].map(m => m[0] + ' — ' + m[1]).join('\n') : '',
      promoTitle: 'Скидка 10% до конца месяца', promoText: 'Назовите код САЙТ при обращении'
    };
  }
  function applyPreset(p, keepText) {
    const ind = indOf(p.ind);
    const base = contentFrom(ind, p.j);
    const old = c || {};
    c = Object.assign({}, base, {
      preset: p.id, ind: p.ind, pal: p.pal, font: p.font, hero: p.hero, svc: p.svc, art: p.art, rad: p.rad, caps: p.caps, order: p.order,
      mods: Object.assign({}, p.mods), seed: G.PRESETS.indexOf(p) + 1, leadTo: old.leadTo || 'demo'
    });
    if (keepText && old.ind === p.ind) TEXT.forEach(k => { if (touched[k]) c[k] = old[k]; });
    else if (keepText) ['name', 'phone', 'email', 'address', 'hours', 'inn'].forEach(k => { if (touched[k]) c[k] = old[k]; });
    if (!keepText || !touched.headline) c.headline = ind.heads[p.j];
    if (!keepText || old.ind !== p.ind) touched = Object.fromEntries(Object.entries(touched).filter(([k]) => ['name', 'phone', 'email', 'address', 'hours', 'inn'].includes(k)));
  }
  function cfg() {
    const mod = String(c.calcModTxt || '').split('\n').map(s => s.trim()).filter(Boolean).map(s => {
      const m = s.split(/\s+[—–-]\s+|:\s*/); const k = parseFloat(String(m[1] || '1').replace(',', '.')); return [m[0], isNaN(k) ? 1 : k];
    });
    const n = v => { const x = parseFloat(String(v).replace(',', '.')); return isNaN(x) ? 0 : x; };
    const qMin = n(c.qMin), qMax = Math.max(n(c.qMax), qMin + 1), qStep = n(c.qStep) || 1;
    const qVal = Math.min(qMax, Math.max(qMin, n(c.qVal) || qMin));
    return Object.assign({}, c, { calcMod: mod, calcQ: [c.qName, c.qUnit, qMin, qMax, qStep, qVal], calcRate: n(c.calcRate) });
  }

  // ---------- UI ----------
  function renderInds() {
    $('#inds').innerHTML = G.IND.map(i => `<button data-i="${i.id}" class="${i.id === c.ind ? 'on' : ''}"><i>${i.code}</i><span>${i.name}</span></button>`).join('');
    $('#indName').textContent = indOf(c.ind).name;
    const ps = G.PRESETS.filter(p => p.ind === c.ind);
    $('#pres').innerHTML = ps.map(p => { const P = G.PAL[p.pal]; return `<button data-p="${p.id}" class="${p.id === c.preset ? 'on' : ''}" style="background:${P.bg};color:${P.fg}" title="${p.id} · ${P.n} · ${G.FONT[p.font].n} · ${G.HERO[p.hero]}"><em style="background:${P.acc}"></em><div><b>${p.id.split('-')[1]}</b><b style="opacity:.6;font-weight:500;font-family:'${G.FONT[p.font].h}'">Aa</b></div></button>`; }).join('');
  }
  function fillFields() {
    TEXT.forEach(k => { const el = $('#' + k); if (el && document.activeElement !== el) el.value = c[k] == null ? '' : c[k]; });
    $('#mods').innerHTML = MODS.map(([k, t, s]) => `<label class="tg"><div><b>${t}</b>${s ? `<small>${s}</small>` : ''}</div><input type="checkbox" class="sw" data-m="${k}" ${c.mods[k] ? 'checked' : ''}></label>`).join('');
    $('#calcBox').style.display = c.mods.calc ? '' : 'none';
    $('#rateBox').style.display = c.calcMode === 'rate' ? '' : 'none';
    setSeg('#calcMode', c.calcMode); setSeg('#leadTo', c.leadTo);
    $('#pals').innerHTML = G.PAL.map((P, i) => `<button data-v="${i}" class="${i === c.pal ? 'on' : ''}" style="background:${P.bg}" title="${P.n}"><i style="background:${P.acc}"></i></button>`).join('');
    $('#palName').textContent = G.PAL[c.pal].n;
    seg('#fonts', G.FONT.map(f => f.n), c.font, 'font');
    seg('#heroes', G.HERO, c.hero, 'hero');
    seg('#svcs', G.SVC, c.svc, 'svc');
    seg('#arts', G.ART, c.art, 'art');
    seg('#rads', ['0', '6', '14', '24'], [0, 6, 14, 24].indexOf(c.rad), 'rad');
    seg('#orders', ['Схема A', 'Схема B', 'Схема C', 'Схема D'], c.order, 'order');
    setSeg('#caps', String(c.caps));
  }
  function seg(sel, names, cur, key) { $(sel).innerHTML = names.map((n, i) => `<button data-v="${i}" data-k="${key}" class="${i === cur ? 'on' : ''}">${n}</button>`).join(''); }
  function setSeg(sel, v) { $$(sel + ' button').forEach(b => b.classList.toggle('on', b.dataset.v === String(v))); }

  let tmr;
  function preview(now) {
    clearTimeout(tmr);
    tmr = setTimeout(() => {
      const html = R.build(cfg());
      const f = $('#pv'), y = f.contentWindow ? f.contentWindow.scrollY : 0;
      f.onload = () => { try { f.contentWindow.scrollTo(0, y); } catch (e) {} };
      f.srcdoc = html;
      const P = G.PAL[c.pal];
      $('#code').textContent = c.preset + (isCustom() ? ' · изменён' : '');
      $('#meta').textContent = `${indOf(c.ind).name} · ${P.n} · ${G.FONT[c.font].n} · ${G.HERO[c.hero]}`;
      save();
    }, now ? 0 : 220);
  }
  function isCustom() { const p = G.PRESETS.find(x => x.id === c.preset); return !p || p.pal !== c.pal || p.font !== c.font || p.hero !== c.hero || p.svc !== c.svc || p.art !== c.art || p.rad !== c.rad || p.order !== c.order || p.caps !== c.caps; }
  function save() { try { localStorage.setItem(LS, JSON.stringify({ c, touched })); } catch (e) {} }
  function toast(t) { const el = $('#toast'); el.textContent = t; el.classList.add('on'); setTimeout(() => el.classList.remove('on'), 2200); }
  const all = () => { renderInds(); fillFields(); preview(1); };

  // ---------- events ----------
  $('#tabs').onclick = e => { const b = e.target.closest('button'); if (!b) return; $$('#tabs button').forEach(x => x.classList.toggle('on', x === b)); $$('.pane').forEach(p => p.classList.toggle('on', p.dataset.p === b.dataset.t)); };
  $('#inds').onclick = e => { const b = e.target.closest('button'); if (!b) return; applyPreset(G.PRESETS.find(p => p.ind === b.dataset.i), true); all(); };
  $('#pres').onclick = e => { const b = e.target.closest('button'); if (!b) return; applyPreset(G.PRESETS.find(p => p.id === b.dataset.p), true); all(); };
  TEXT.forEach(k => { const el = $('#' + k); if (el) el.addEventListener('input', () => { c[k] = el.value; touched[k] = 1; preview(); }); });
  $('#mods').onchange = e => { const m = e.target.dataset.m; if (!m) return; c.mods[m] = e.target.checked ? 1 : 0; $('#calcBox').style.display = c.mods.calc ? '' : 'none'; preview(); };
  $('#calcMode').onclick = e => { const b = e.target.closest('button'); if (!b) return; c.calcMode = b.dataset.v; setSeg('#calcMode', c.calcMode); $('#rateBox').style.display = c.calcMode === 'rate' ? '' : 'none'; preview(); };
  $('#leadTo').onclick = e => { const b = e.target.closest('button'); if (!b) return; c.leadTo = b.dataset.v; setSeg('#leadTo', c.leadTo); preview(); };
  $('#caps').onclick = e => { const b = e.target.closest('button'); if (!b) return; c.caps = +b.dataset.v; setSeg('#caps', c.caps); preview(); };
  $('#pals').onclick = e => { const b = e.target.closest('button'); if (!b) return; c.pal = +b.dataset.v; fillFields(); preview(); };
  $('[data-p="3"]').addEventListener('click', e => { const b = e.target.closest('button[data-k]'); if (!b) return; const k = b.dataset.k, v = +b.dataset.v; c[k] = k === 'rad' ? [0, 6, 14, 24][v] : v; fillFields(); preview(); });
  $('#dev').onclick = e => { const b = e.target.closest('button'); if (!b) return; $$('#dev button').forEach(x => x.classList.toggle('on', x === b)); $('#frame').classList.toggle('m', b.dataset.v === 'm'); };
  $('#rnd').onclick = () => { applyPreset(G.PRESETS[Math.floor(Math.random() * 100)], false); all(); toast('Пресет ' + c.preset); };
  const slug = () => (c.name || 'site').toLowerCase().replace(/[^a-zа-я0-9]+/gi, '-').replace(/^-|-$/g, '') || 'site';
  const translit = s => s.replace(/[а-яё]/g, ch => ({ а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'c', ч: 'ch', ш: 'sh', щ: 'sch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya' }[ch]));
  $('#dl').onclick = () => {
    const blob = new Blob([R.build(cfg())], { type: 'text/html;charset=utf-8' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = translit(slug()) + '.html'; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000); toast('Сайт скачан одним файлом index.html');
  };
  $('#open').onclick = () => { const w = window.open('', '_blank'); if (!w) return toast('Разрешите всплывающие окна'); w.document.open(); w.document.write(R.build(cfg())); w.document.close(); };

  // ---------- gallery ----------
  let gf = 'all', thumbIO;
  function gallery() {
    $('#flt').innerHTML = [['all', 'Все']].concat(G.IND.map(i => [i.id, i.name])).map(([k, n]) => `<button data-f="${k}" class="${k === gf ? 'on' : ''}">${n}</button>`).join('');
    const list = G.PRESETS.filter(p => gf === 'all' || p.ind === gf);
    $('#galCount').textContent = list.length;
    $('#grid').innerHTML = list.map(p => `<div class="card" data-p="${p.id}"><div class="th"><iframe loading="lazy" tabindex="-1" title="${p.id}"></iframe></div><div class="cm"><b>${p.id}</b><span>${indOf(p.ind).name} · ${G.PAL[p.pal].n} · ${G.HERO[p.hero]}</span></div></div>`).join('');
    if (thumbIO) thumbIO.disconnect();
    thumbIO = new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting) return; thumbIO.unobserve(e.target);
      const card = e.target, p = G.PRESETS.find(x => x.id === card.dataset.p), th = $('.th', card), fr = $('iframe', card);
      fr.style.transform = `scale(${th.clientWidth / 1280})`;
      const save = c; applyPreset(p, false); const html = R.build(cfg()); c = save;
      fr.srcdoc = html.replace('</style>', '.rv{opacity:1!important;transform:none!important}.fab{display:none}</style>');
    }), { root: $('#grid'), rootMargin: '300px' });
    $$('#grid .card').forEach(el => thumbIO.observe(el));
  }
  $('#openGal').onclick = e => { e.preventDefault(); gf = c.ind; $('#gal').classList.add('on'); gallery(); };
  $('#galX').onclick = () => $('#gal').classList.remove('on');
  $('#flt').onclick = e => { const b = e.target.closest('button'); if (!b) return; gf = b.dataset.f; gallery(); };
  $('#grid').onclick = e => { const card = e.target.closest('.card'); if (!card) return; applyPreset(G.PRESETS.find(p => p.id === card.dataset.p), true); $('#gal').classList.remove('on'); all(); };
  addEventListener('keydown', e => { if (e.key === 'Escape') $('#gal').classList.remove('on'); });
  addEventListener('resize', () => $$('#grid .th').forEach(th => { const f = $('iframe', th); f.style.transform = `scale(${th.clientWidth / 1280})`; }));

  // ---------- init ----------
  try { const s = JSON.parse(localStorage.getItem(LS)); if (s && s.c && s.c.mods && indOf(s.c.ind)) { c = s.c; touched = s.touched || {}; } } catch (e) {}
  if (!c) applyPreset(G.PRESETS[0], false);
  if (new URLSearchParams(location.search).get('p')) { const p = G.PRESETS.find(x => x.id === new URLSearchParams(location.search).get('p').toUpperCase()); if (p) applyPreset(p, false); }
  all();
})();
