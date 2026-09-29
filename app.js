/* agentic gtm audit v0.1
   Everything here is scripted rules: fixed scores per answer, fixed thresholds,
   a fixed bank of diagnoses and next moves. No model, no server, no tracking. */
(function () {
  'use strict';

  var STORE = 'gtm-audit-answers';

  var AREAS = [
    { id: 'pricing', name: 'pricing model',
      diag: {
        ok: 'your price moves with the value the agent delivers, and a buyer can see the maths.',
        dev: 'pricing is part way to usage or outcomes; a buyer still needs a call to understand the bill.',
        risk: 'you are pricing an agent like software seats, so the better it works, the less you earn.'
      },
      stretch: 'run a pricing review with finance every quarter: outcome volume billed against cost to serve, per customer. fix the three accounts where the gap is widest.' },
    { id: 'motion', name: 'motion',
      diag: {
        ok: 'buyers reach value fast and someone owns the path from pilot to contract.',
        dev: 'pilots happen, but whether they convert depends on who is in the room.',
        risk: 'long implementations and unowned pilots are where your deals go quiet.'
      },
      stretch: 'turn your fastest pilot into a written template, and ask that customer to tell the story on one prospect call this month.' },
    { id: 'icp', name: 'icp clarity',
      diag: {
        ok: 'the team agrees on who buys and why now, and the closed deals back it up.',
        dev: 'you know the segment, but not the trigger that makes them buy this quarter.',
        risk: 'each person on the team carries a different ideal customer, so pipeline is scattered.'
      },
      stretch: 'write the anti-icp: three kinds of customer you will say no to, with one line on why. share it with sales and marketing the same day.' },
    { id: 'messaging', name: 'messaging',
      diag: {
        ok: 'you lead with the job done and back it with proof a buyer can check.',
        dev: 'the message is clear inside the company but blurs when a buyer compares you.',
        risk: 'buyers cannot say what you do differently, so they compare you on price.'
      },
      stretch: 'ask a new hire to pitch the product after one week. whatever they get wrong is your next copy fix.' },
    { id: 'agent', name: 'agent-readiness',
      diag: {
        ok: 'buyers and their research agents can check your claims without talking to sales.',
        dev: 'some of your proof is public, but a buyer’s agent still runs into a form or a missing answer.',
        risk: 'a buyer’s research agent cannot read your pricing or proof, so you drop off the shortlist before a human looks.'
      },
      stretch: 'ask two ai research assistants to compare you with your two closest competitors. fix every fact they get wrong about you, at the source page.' }
  ];

  /* each option: [text, score 0..3]. move: prescribed when the answer scores 0 or 1. */
  var QUESTIONS = [
    { area: 'pricing', text: 'how do you price today?',
      opts: [['per seat, on an annual contract', 0],
             ['per seat, plus a usage add-on', 1],
             ['usage or credits, metered monthly', 2],
             ['per outcome: a resolved ticket, a booked meeting, a processed claim', 3]],
      move: 'price one line item per outcome. pick the unit your best customer already counts (tickets closed, meetings booked) and put it next to the seat price in your next three proposals.' },
    { area: 'pricing', text: 'a buyer asks what year one will cost them. you can',
      opts: [['only give a range after a scoping call', 0],
             ['point to a pricing page, though real deals are all custom', 1],
             ['model it together in a spreadsheet on the first call', 2],
             ['send a public calculator they can run on their own volumes', 3]],
      move: 'publish a year-one cost calculator: three inputs (monthly volume, team size, current cost per task) and one output. link it from the pricing page and the first sales email.' },
    { area: 'pricing', text: 'if your agent does the work of two people, your price',
      opts: [['drops, because they now need fewer seats', 0],
             ['stays flat; we have not worked this out', 1],
             ['rises with volume handled, with a cap the buyer agrees to', 2],
             ['is anchored to the cost of the work replaced, and the buyer can see the maths', 3]],
      move: 'write the replacement maths for your top use case on one page: hours saved times loaded cost, against your price. test it on two live deals this month.' },

    { area: 'motion', text: 'how do most new customers reach their first real result?',
      opts: [['after a sixty to ninety day implementation led by our team', 0],
             ['demo, then a long security review, then a pilot', 1],
             ['a guided pilot with success criteria written down up front', 2],
             ['a self-serve trial on their own data, and sales steps in on usage signals', 3]],
      move: 'cut time to first result to under two weeks: define the smallest useful workflow and make it the default pilot scope. anything bigger is phase two.' },
    { area: 'motion', text: 'who owns turning a pilot into a contract?',
      opts: [['nobody in particular; it happens when it happens', 0],
             ['customer success, after sales hands it over', 1],
             ['the account executive who sold the pilot', 2],
             ['a named owner on both sides, with an exit criterion agreed on day one', 3]],
      move: 'for every open pilot, write a one-line exit criterion with the buyer and name an owner on each side. review the list every monday until each one is signed or closed.' },

    { area: 'icp', text: 'ask five people on your team to describe the ideal customer in one sentence. you would get',
      opts: [['five different answers', 0],
             ['the same industry and size, but no reason they buy now', 1],
             ['the same industry, size and the job the agent takes over', 2],
             ['all of that plus the buying trigger, like “just raised a series b and support tickets doubled”', 3]],
      move: 'run a thirty-minute icp session: everyone writes the one-sentence ideal customer alone, you compare, then agree the buying trigger. pin the final sentence in the sales channel.' },
    { area: 'icp', text: 'of your last ten closed deals, how many matched that profile?',
      opts: [['we have not checked', 0],
             ['fewer than half', 1],
             ['about half to three quarters', 2],
             ['eight or more', 3]],
      move: 'tag your last twenty won and lost deals against the icp. pause outbound to the segment with the worst win rate for one quarter and move that time to the best one.' },

    { area: 'messaging', text: 'your homepage headline leads with',
      opts: [['the technology: “an ai-native platform powered by llms”', 0],
             ['a broad promise: “transform your customer experience”', 1],
             ['the job done: “resolves tier-one support tickets end to end”', 2],
             ['the job done, plus a proof number with its source and date', 3]],
      move: 'rewrite the homepage headline as the job your agent does, in the buyer’s words. read two versions aloud on your next ten sales calls and keep the one people repeat back.' },
    { area: 'messaging', text: 'when a buyer compares you with a competitor, the difference they repeat back is',
      opts: [['they cannot name one', 0],
             ['price', 1],
             ['a feature we shipped first', 1],
             ['a specific outcome in their workflow that only we deliver', 3]],
      move: 'ask your last five customers why they chose you over the alternative. put their exact words on a comparison page and in the second slide of the deck.' },

    { area: 'agent', text: 'can a buyer’s ai research assistant read your product, pricing and security details?',
      opts: [['no; the key pages sit behind a form or a demo request', 0],
             ['partly; the pricing page exists but says “contact us”', 1],
             ['yes; plain pages for pricing, docs and security, no login', 2],
             ['yes, plus structured docs, an llms.txt file and an open api spec', 3]],
      move: 'ungate the pricing, docs and security pages this week and add an llms.txt that points to them. a buyer’s research agent should find every answer without filling a form.' },
    { area: 'agent', text: 'how do you prove your agent works before a contract?',
      opts: [['customer logos and a demo video', 0],
             ['case studies with outcome numbers', 1],
             ['a sandbox run on the buyer’s own sample data', 2],
             ['a published evaluation: accuracy, escalation rate and known failure cases, refreshed every quarter', 3]],
      move: 'publish one honest evaluation: accuracy on a named task, escalation rate and three known failure cases. date it and refresh it every quarter.' },
    { area: 'agent', text: 'when your agent gets something wrong in production',
      opts: [['we find out when the customer complains', 0],
             ['we catch it in a weekly log review', 1],
             ['every hand-off to a human is logged and visible to the customer', 2],
             ['customers set their own guardrails and see an audit trail for every action', 3]],
      move: 'log every hand-off and every wrong action, and give customers a view of it. make that view the first thing you show in a security review.' }
  ];

  var N = QUESTIONS.length;
  var answers = new Array(N).fill(null);

  var form = document.getElementById('audit');
  var progress = document.getElementById('progress');
  var remaining = document.getElementById('remaining');
  var result = document.getElementById('result');
  var stampDate = document.getElementById('stamp-date');

  /* all markup below is built from the static strings above, escaped */
  function setHTML(el, html) {
    el.replaceChildren(document.createRange().createContextualFragment(html));
  }
  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function today() {
    var d = new Date();
    return pad(d.getDate()) + '.' + pad(d.getMonth() + 1) + '.' + String(d.getFullYear()).slice(2);
  }

  /* ---------- encoding: #a=012312... one char per question, x = unanswered ---------- */
  function encode() {
    return answers.map(function (a) { return a === null ? 'x' : String(a); }).join('');
  }
  function decode(str) {
    if (!str || str.length !== N) return null;
    var out = [];
    for (var i = 0; i < N; i++) {
      var c = str.charAt(i);
      if (c === 'x') { out.push(null); continue; }
      var v = parseInt(c, 10);
      if (isNaN(v) || v < 0 || v >= QUESTIONS[i].opts.length) return null;
      out.push(v);
    }
    return out;
  }
  function fromHash() {
    var m = (location.hash || '').match(/(?:^#|&)a=([0-9x]+)/);
    return m ? decode(m[1]) : null;
  }
  function shareUrl() {
    return location.href.split('#')[0] + '#a=' + encode();
  }
  function save() {
    try { localStorage.setItem(STORE, encode()); } catch (e) {}
    try { history.replaceState(null, '', '#a=' + encode()); } catch (e) {}
  }
  function load() {
    var h = fromHash();
    if (h) return { answers: h, fromLink: true };
    try {
      var s = decode(localStorage.getItem(STORE));
      if (s) return { answers: s, fromLink: false };
    } catch (e) {}
    return null;
  }

  /* ---------- form ---------- */
  var displayNo = {};
  function buildForm() {
    var html = '';
    var qn = 0;
    AREAS.forEach(function (area) {
      var qs = [];
      QUESTIONS.forEach(function (q, i) { if (q.area === area.id) qs.push(i); });
      html += '<fieldset id="fs-' + area.id + '"><legend>' + esc(area.name) +
        ' <span class="count" data-area="' + area.id + '"></span></legend>';
      qs.forEach(function (i) {
        qn++;
        displayNo[i] = qn;
        var q = QUESTIONS[i];
        html += '<div class="q" role="radiogroup" aria-labelledby="qt-' + i + '">' +
          '<p class="q-text" id="qt-' + i + '"><span class="mono">' + pad(qn) + '</span>' + esc(q.text) + '</p><div class="opts">';
        q.opts.forEach(function (o, j) {
          html += '<label class="opt">' +
            '<input type="radio" name="q' + i + '" value="' + j + '"><span>' + esc(o[0]) + '</span></label>';
        });
        html += '</div></div>';
      });
      html += '</fieldset>';
    });
    setHTML(form, html);
  }

  function syncForm() {
    for (var i = 0; i < N; i++) {
      var inputs = form.querySelectorAll('input[name="q' + i + '"]');
      for (var j = 0; j < inputs.length; j++) {
        var on = answers[i] === j;
        inputs[j].checked = on;
        inputs[j].parentNode.classList.toggle('on', on);
      }
    }
    updateProgress();
  }

  function answeredCount() {
    return answers.filter(function (a) { return a !== null; }).length;
  }

  function updateProgress() {
    var n = answeredCount();
    progress.textContent = pad(n) + '/' + N;
    remaining.textContent = n === N ? 'all answered' : (N - n) + ' to go';
    AREAS.forEach(function (area) {
      var total = 0, done = 0;
      QUESTIONS.forEach(function (q, i) {
        if (q.area !== area.id) return;
        total++; if (answers[i] !== null) done++;
      });
      var el = form.querySelector('.count[data-area="' + area.id + '"]');
      if (el) el.textContent = done + '/' + total;
    });
  }

  /* ---------- scoring: all fixed rules ---------- */
  function score() {
    var areas = AREAS.map(function (area) {
      var pts = 0, max = 0;
      QUESTIONS.forEach(function (q, i) {
        if (q.area !== area.id) return;
        max += 3;
        pts += q.opts[answers[i]][1];
      });
      var ratio = pts / max;
      var level = ratio >= 0.67 ? 'ok' : (ratio >= 0.4 ? 'dev' : 'risk');
      return { area: area, pts: pts, max: max, ratio: ratio, level: level };
    });

    /* weakest first; stable sort keeps area order on ties */
    var ranked = areas.slice().sort(function (a, b) { return a.ratio - b.ratio; });

    /* only the single weakest at-risk area gets the rust stamp */
    var weakest = ranked[0].level === 'risk' ? ranked[0].area.id : null;

    /* moves: weakest areas first, one low-scoring question per area, then fill */
    var candidates = [];
    ranked.forEach(function (r, rank) {
      QUESTIONS.forEach(function (q, i) {
        if (q.area !== r.area.id) return;
        var s = q.opts[answers[i]][1];
        if (s <= 1) candidates.push({ rank: rank, s: s, i: i, area: r.area });
      });
    });
    candidates.sort(function (a, b) { return a.rank - b.rank || a.s - b.s || a.i - b.i; });

    var moves = [], usedAreas = {}, usedQ = {};
    candidates.forEach(function (c) {
      if (moves.length < 3 && !usedAreas[c.area.id]) {
        moves.push({ text: QUESTIONS[c.i].move, area: c.area, q: c.i });
        usedAreas[c.area.id] = true; usedQ[c.i] = true;
      }
    });
    candidates.forEach(function (c) {
      if (moves.length < 3 && !usedQ[c.i]) {
        moves.push({ text: QUESTIONS[c.i].move, area: c.area, q: c.i });
        usedQ[c.i] = true;
      }
    });
    /* strong nearly everywhere: stretch moves from the weakest areas */
    ranked.forEach(function (r) {
      if (moves.length < 3) moves.push({ text: r.area.stretch, area: r.area, q: null });
    });

    return { areas: areas, weakest: weakest, moves: moves };
  }

  function stampFor(r, weakest) {
    if (r.level === 'ok') return '<span class="stamp ok">strong</span>';
    if (r.level === 'dev') return '<span class="stamp">developing</span>';
    if (r.area.id === weakest) return '<span class="stamp stop">at risk</span>';
    return '<span class="stamp">at risk</span>';
  }

  function levelWord(l) { return l === 'ok' ? 'strong' : (l === 'dev' ? 'developing' : 'at risk'); }

  function words(n) {
    return ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'][n] || String(n);
  }

  var current = null;

  function render() {
    if (answeredCount() < N) {
      var left = N - answeredCount();
      setHTML(result, '<p class="empty">answer ' + (left === 1 ? 'the last question' : 'the remaining ' + words(left) + ' questions') +
        ' and your scorecard appears here.</p>');
      stampDate.textContent = '';
      current = null;
      return null;
    }
    var s = score();
    current = s;
    stampDate.textContent = today();
    var counts = { ok: 0, dev: 0, risk: 0 };
    s.areas.forEach(function (r) { counts[r.level]++; });

    var html = '<p class="summary"><span class="mono">' + counts.ok + ' strong · ' + counts.dev + ' developing · ' + counts.risk + ' at risk</span></p>';
    html += '<div class="cards">';
    s.areas.forEach(function (r) {
      html += '<article class="card area-card" data-level="' + r.level + '">' +
        '<div class="area-head"><h3>' + esc(r.area.name) + '</h3>' + stampFor(r, s.weakest) + '</div>' +
        '<div class="bar" aria-hidden="true"><i style="width:' + Math.round(r.ratio * 100) + '%"></i></div>' +
        '<span class="mono area-score">' + r.pts + '/' + r.max + '</span>' +
        '<p>' + esc(r.area.diag[r.level]) + '</p></article>';
    });
    html += '</div>';

    html += '<div class="moves"><h2>three next <em>moves</em></h2><ol>';
    s.moves.forEach(function (m) {
      var why = m.q === null ? m.area.name + ' · stretch' : m.area.name + ' · from question ' + pad(displayNo[m.q]);
      html += '<li><div class="prose">' + esc(m.text) + '<span class="why">' + esc(why) + '</span></div></li>';
    });
    html += '</ol></div>';

    html += '<div class="share"><p class="label">share with your team</p>' +
      '<div class="row"><button class="pill primary" type="button" id="copy-link">copy link</button>' +
      '<button class="pill" type="button" id="copy-text">copy as text</button>' +
      '<span class="mono share-status" id="share-status" role="status"></span></div>' +
      '<input id="fallback" type="text" readonly hidden aria-label="share link">' +
      '<p class="caption">the link carries your answers in the url itself. nothing is stored on a server.</p></div>';

    setHTML(result, html);
    return s;
  }

  function asText(s) {
    var lines = ['agentic gtm audit · ' + today(), ''];
    s.areas.forEach(function (r) {
      lines.push(r.area.name + ': ' + levelWord(r.level) + ' (' + r.pts + '/' + r.max + '). ' + r.area.diag[r.level]);
    });
    lines.push('', 'next moves:');
    s.moves.forEach(function (m, k) { lines.push((k + 1) + '. ' + m.text); });
    lines.push('', 'scorecard: ' + shareUrl());
    return lines.join('\n');
  }

  /* ---------- clipboard with fallbacks ---------- */
  function status(msg) {
    var el = document.getElementById('share-status');
    if (el) el.textContent = msg;
  }
  function legacyCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.top = '0';
    ta.style.left = '0';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    var ok = false;
    try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
    document.body.removeChild(ta);
    return ok;
  }
  function showFallback(text) {
    var fb = document.getElementById('fallback');
    if (!fb) return;
    fb.hidden = false;
    fb.value = text.split('\n').join('  ');
    fb.focus();
    fb.select();
    status('copy was blocked; select the text above and copy it');
  }
  function copy(text, okMsg) {
    var done = function () {
      status(okMsg);
      var fb = document.getElementById('fallback');
      if (fb) fb.hidden = true;
    };
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(done, function () {
        if (legacyCopy(text)) done(); else showFallback(text);
      });
    } else if (legacyCopy(text)) {
      done();
    } else {
      showFallback(text);
    }
  }

  /* ---------- wiring ---------- */
  form.addEventListener('change', function (e) {
    var t = e.target;
    if (!t || t.type !== 'radio') return;
    var i = parseInt(t.name.slice(1), 10);
    answers[i] = parseInt(t.value, 10);
    syncForm();
    save();
    render();
  });

  result.addEventListener('click', function (e) {
    var t = e.target;
    if (!t || !current) return;
    if (t.id === 'copy-link') copy(shareUrl(), 'link copied');
    if (t.id === 'copy-text') copy(asText(current), 'text copied');
  });

  document.getElementById('see').addEventListener('click', function () {
    if (answeredCount() < N) {
      var first = answers.indexOf(null);
      var el = form.querySelector('input[name="q' + first + '"]');
      if (el) {
        el.closest('.q').scrollIntoView({ block: 'center' });
        el.focus({ preventScroll: true });
      }
      return;
    }
    document.getElementById('scorecard').scrollIntoView({ block: 'start' });
  });

  document.getElementById('reset').addEventListener('click', function () {
    answers = new Array(N).fill(null);
    try { localStorage.removeItem(STORE); } catch (e) {}
    try { history.replaceState(null, '', location.pathname + location.search); } catch (e) {}
    syncForm();
    render();
    form.scrollIntoView({ block: 'start' });
  });

  window.addEventListener('hashchange', function () {
    var h = fromHash();
    if (h && h.join() !== answers.join()) {
      answers = h;
      syncForm();
      render();
    }
  });

  buildForm();
  var initial = load();
  if (initial) answers = initial.answers;
  syncForm();
  var rendered = render();
  if (initial && initial.fromLink && rendered) {
    try { localStorage.setItem(STORE, encode()); } catch (e) {}
    document.getElementById('scorecard').scrollIntoView({ block: 'start' });
  }
})();
