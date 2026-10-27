/* Albuquerque Ads — runtime estático.
   Imita a API "dash" do dashboard do Claude, mas lê os dados de data/dados.js
   (gerado por scripts/build.py a partir dos CSVs em data/). */
(function () {
  const META = window.MX_META || {};
  const DIARIO = window.MX_DIARIO || [];
  const CONJUNTOS = window.MX_CONJUNTOS || [];

  const params = {periodo: 'last_30_days', conta: null, campanha: null, cj_status: null};
  const defaults = {...params};
  const draws = new Map();
  const onDatas = [];
  const calcs = new Map();
  let memo = new Map();
  let pronto = false;

  const num = (v) => (v === null || v === undefined || v === '' ? 0 : Number(v) || 0);
  const div = (a, b) => (b > 0 ? a / b : null);

  const noIntervalo = (r, s, e) => r.data >= s && r.data <= e;

  const contas = () => [...new Set(DIARIO.map((r) => r.conta).concat(CONJUNTOS.map((r) => r.conta)))];

  const builders = {
    diario() {
      const [s, e] = window.mx.faixa(params);
      return DIARIO.filter((r) => noIntervalo(r, s, e));
    },
    anterior() {
      const s = params.ant_inicio;
      const e = params.ant_fim;
      if (!s || !e) return [];
      return DIARIO.filter((r) => noIntervalo(r, s, e));
    },
    por_conta() {
      const [s, e] = window.mx.faixa(params);
      const by = new Map(contas().map((c) => [c, {conta: c, investimento: 0, impressoes: 0, cliques: 0, conversas: 0, leads_meta: 0, leads_site: 0, compras: 0, valor_compras: 0}]));
      for (const r of DIARIO) {
        if (!noIntervalo(r, s, e)) continue;
        const t = by.get(r.conta);
        for (const k of ['investimento', 'impressoes', 'cliques', 'conversas', 'leads_meta', 'leads_site', 'compras', 'valor_compras']) t[k] += num(r[k]);
      }
      return [...by.values()].map((t) => ({
        conta: t.conta,
        investimento: t.investimento || null,
        alcance: null,
        impressoes: t.impressoes || null,
        cpm: div(t.investimento * 1000, t.impressoes),
        ctr_link: div(t.cliques, t.impressoes),
        cpc_link: div(t.investimento, t.cliques),
        conversas: t.conversas || null,
        custo_conversa: div(t.investimento, t.conversas),
        leads_meta: t.leads_meta || null,
        compras: t.compras || null,
        roas: t.valor_compras > 0 ? t.valor_compras / t.investimento : 0,
      }));
    },
    conjuntos() {
      return CONJUNTOS;
    },
    campanhas() {
      const by = new Map();
      for (const r of CONJUNTOS) {
        const k = r.conta + '|' + r.campanha;
        if (!by.has(k)) by.set(k, {conta: r.conta, campanha: r.campanha, investimento: 0, impressoes: 0, cliques: 0, conversas: 0, leads_meta: 0, leads_site: 0, compras: 0, valor_compras: 0});
        const t = by.get(k);
        for (const c of ['investimento', 'impressoes', 'cliques', 'conversas', 'leads_meta', 'leads_site', 'compras', 'valor_compras']) t[c] += num(r[c]);
      }
      return [...by.values()].map((t) => {
        const o = {...t};
        for (const c of ['impressoes', 'cliques', 'conversas', 'leads_meta', 'leads_site', 'compras', 'valor_compras']) if (!o[c]) o[c] = null;
        return o;
      });
    },
  };

  const vazio = (status) => ({status, data: [], columns: [], meta: [], refreshing: false, message: ''});

  function data(id) {
    if (!pronto) return vazio('loading');
    if (memo.has(id)) return memo.get(id);
    let out;
    try {
      if (calcs.has(id)) {
        const def = calcs.get(id);
        const inputs = def.inputs.map((i) => data(i).data);
        out = {status: 'ok', data: def.fn(...inputs), columns: [], meta: [], refreshing: false};
      } else if (builders[id]) {
        const rows = builders[id]();
        out = {status: 'ok', data: rows, columns: rows.length ? Object.keys(rows[0]) : [], meta: [], refreshing: false};
      } else {
        out = vazio('missing');
      }
    } catch (e) {
      console.error('Falha em', id, e);
      out = {...vazio('error'), message: String(e)};
    }
    memo.set(id, out);
    return out;
  }

  let agendado = false;
  function render() {
    agendado = false;
    memo = new Map();
    for (const fn of onDatas) {
      try { fn(); } catch (e) { console.error(e); }
    }
    for (const [name, fn] of draws) {
      document.querySelectorAll('[data-draw="' + name + '"]').forEach((el) => {
        if (el.closest('[hidden]')) return;
        try { fn(el); } catch (e) { console.error('Desenho', name, e); }
      });
    }
  }
  function agendar() {
    if (agendado) return;
    agendado = true;
    requestAnimationFrame(render);
  }

  window.dash = {
    colors: ['#2a78d6', '#d0632b', '#2f9e6e', '#8a5cd6', '#c9a227', '#d0457a', '#3fa7b8', '#6b7a8f'],
    params: () => ({...params}),
    setParams(o) { Object.assign(params, o); agendar(); },
    resetParams() { for (const k of Object.keys(params)) delete params[k]; Object.assign(params, defaults); agendar(); },
    setLink() {},
    loader() {},
    refresh() { location.reload(); },
    calc(id, def) { calcs.set(id, def); },
    onData(fn) { onDatas.push(fn); try { fn(); } catch (e) { console.error(e); } },
    draw(name, fn) { draws.set(name, fn); },
    data,
  };

  window.addEventListener('DOMContentLoaded', () => { pronto = true; render(); });
  let t;
  window.addEventListener('resize', () => { clearTimeout(t); t = setTimeout(agendar, 150); });
})();
