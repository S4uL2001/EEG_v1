(function () {
  'use strict';

  const M  = window.NeuroEEG.modelo;
  const AN = window.NeuroEEG.analitica;
  const TR = window.NeuroEEG.trapecio;
  const S13 = window.NeuroEEG.simpson13;
  const S38 = window.NeuroEEG.simpson38;
  const ER = window.NeuroEEG.errores;
  const G  = window.NeuroEEG.graficas;

  const els = {
    escenario: document.getElementById('escenario'),
    P0:     document.getElementById('P0'),
    A:      document.getElementById('A'),
    mu:     document.getElementById('mu'),
    sigma:  document.getElementById('sigma'),
    a:      document.getElementById('a'),
    b:      document.getElementById('b'),
    n:      document.getElementById('n'),
    btn:    document.getElementById('btnCalcular'),
    error:  document.getElementById('errorConfig'),
    tabla:  document.querySelector('#tabla tbody'),
    resumen: document.getElementById('resumen'),
    leyenda: document.getElementById('leyendaExacta'),
    interp: document.getElementById('interpretacionTexto')
  };

  /* ------- Utilidades de formato ------- */
  function fmt(x, digits = 4) {
    if (x === null || !Number.isFinite(x)) return 'no definido';
    if (x === 0) return '0';
    const abs = Math.abs(x);
    if (abs < 1e-3 || abs >= 1e5) return x.toExponential(digits);
    return x.toFixed(digits);
  }
  function fmtErr(x) {
    if (x === null || !Number.isFinite(x)) return '—';
    return x.toExponential(3);
  }

  /* ------- Carga de escenarios ------- */
  function cargarEscenario(key) {
    if (key === 'custom') return;
    const esc = M.ESCENARIOS[key];
    if (!esc) return;
    els.P0.value = esc.P0;
    els.A.value = esc.A;
    els.mu.value = esc.mu;
    els.sigma.value = esc.sigma;
  }

  /* ------- Validación ------- */
  function leerConfig() {
    const P0    = parseFloat(els.P0.value);
    const A     = parseFloat(els.A.value);
    const mu    = parseFloat(els.mu.value);
    const sigma = parseFloat(els.sigma.value);
    const a     = parseFloat(els.a.value);
    const b     = parseFloat(els.b.value);
    const n     = parseInt(els.n.value, 10);

    const errs = [];
    if (!Number.isFinite(P0) || P0 < 0) errs.push('P₀ debe ser ≥ 0.');
    if (!Number.isFinite(A) || A < 0)   errs.push('A debe ser ≥ 0.');
    if (!Number.isFinite(mu))           errs.push('μ debe ser numérico.');
    if (!Number.isFinite(sigma) || sigma <= 0) errs.push('σ debe ser > 0.');
    if (!Number.isFinite(a) || !Number.isFinite(b) || a >= b)
      errs.push('Debe cumplirse a < b.');
    if (!Number.isInteger(n) || n < 6 || n % 6 !== 0)
      errs.push('n debe ser entero, ≥ 6 y múltiplo de 6.');
    if (n > 384) errs.push('n no debe superar 384 en la comparación principal.');

    if (errs.length) throw new Error(errs.join(' '));
    return { P0, A, mu, sigma, a, b, n };
  }

  /* ------- Cálculo de referencia de alta precisión ------- */
  function referenciaNumerica(a, b, params) {
    const N = 200000;
    const { Pvals, h } = M.generarNodos(a, b, N, params);
    return TR(Pvals, h);
  }

  /* ------- Cálculo de un n ------- */
  function evaluarEnN(a, b, n, params, exacta) {
    const { Pvals, h } = M.generarNodos(a, b, n, params);
    const t   = TR(Pvals, h);
    const s13 = S13(Pvals, h);
    const s38 = S38(Pvals, h);
    return {
      n, h,
      t, s13, s38,
      eaT:  ER.errorAbsoluto(exacta, t),
      ea13: ER.errorAbsoluto(exacta, s13),
      ea38: ER.errorAbsoluto(exacta, s38),
      erT:  ER.errorRelativoPorcentual(exacta, t),
      er13: ER.errorRelativoPorcentual(exacta, s13),
      er38: ER.errorRelativoPorcentual(exacta, s38)
    };
  }

  /* ------- Llenado de tabla ------- */
  function llenarTabla(resultados, exacta) {
    els.tabla.innerHTML = '';
    for (const r of resultados) {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${r.n}</td>
        <td>${r.h.toFixed(4)}</td>
        <td>${fmt(r.t)}</td>
        <td>${fmt(r.s13)}</td>
        <td>${fmt(r.s38)}</td>
        <td>${fmtErr(r.eaT)}</td>
        <td>${fmtErr(r.ea13)}</td>
        <td>${fmtErr(r.ea38)}</td>
        <td>${r.erT  === null ? 'no definido' : r.erT.toFixed(4) + ' %'}</td>
        <td>${r.er13 === null ? 'no definido' : r.er13.toFixed(4) + ' %'}</td>
        <td>${r.er38 === null ? 'no definido' : r.er38.toFixed(4) + ' %'}</td>
      `;
      els.tabla.appendChild(tr);
    }
  }

  /* ------- Tarjetas resumen ------- */
  function llenarResumen(resultados, exacta, exactaErf, escenarioNombre) {
    const last = resultados[resultados.length - 1];
    let bestName = 'Trapecio', bestVal = last.eaT;
    if (last.ea13 < bestVal) { bestName = 'Simpson 1/3'; bestVal = last.ea13; }
    if (last.ea38 < bestVal) { bestName = 'Simpson 3/8'; bestVal = last.ea38; }
    const difErf = Math.abs(exacta - exactaErf);

    els.resumen.innerHTML = `
      <div class="mini">
        <div class="label">Escenario</div>
        <div class="value">${escenarioNombre}</div>
        <div class="sub">Parámetros declarados como hipotéticos.</div>
      </div>
      <div class="mini">
        <div class="label">Eα de referencia</div>
        <div class="value">${exacta.toFixed(4)}</div>
        <div class="sub">µV² · referencia numérica de alta precisión (N=200 000).</div>
      </div>
      <div class="mini">
        <div class="label">Mejor método en n = ${last.n}</div>
        <div class="value">${bestName}</div>
        <div class="sub">Error absoluto: ${fmtErr(bestVal)} µV².</div>
      </div>
      <div class="mini">
        <div class="label">Analítica con erf</div>
        <div class="value">${exactaErf.toFixed(4)}</div>
        <div class="sub">µV² · diferencia con la referencia: ${difErf.toExponential(2)} µV².</div>
      </div>
    `;
    els.leyenda.textContent =
      `Valor de referencia Eα = ${exacta.toFixed(6)} µV². Los errores absolutos y relativos se calculan contra este valor.`;
  }

  /* ------- Interpretación dinámica ------- */
  function generarInterpretacion(resultados, exacta, escenarioNombre, a, b) {
    const last = resultados[resultados.length - 1];
    let bestName = 'Trapecio', bestVal = last.eaT;
    if (last.ea13 < bestVal) { bestName = 'Simpson 1/3'; bestVal = last.ea13; }
    if (last.ea38 < bestVal) { bestName = 'Simpson 3/8'; bestVal = last.ea38; }

    const slopeT  = document.getElementById('slopeT').textContent;
    const slope13 = document.getElementById('slope13').textContent;
    const slope38 = document.getElementById('slope38').textContent;

    const interpFisio = {
      'Reposo, ojos cerrados':
        'En reposo con ojos cerrados se espera una <strong>alta energía alfa</strong>, coherente con la sincronización cortical típica de este estado.',
      'Tarea cognitiva':
        'Durante una tarea cognitiva se espera una <strong>desincronización alfa</strong>, es decir, una menor energía integrada en la banda.',
      'Somnolencia':
        'En la transición al sueño el pico alfa suele <strong>ensancharse y desplazarse</strong> hacia frecuencias menores, lo que modifica la energía integrada.'
    }[escenarioNombre] || 'Los parámetros fueron personalizados por el usuario.';

    const html = `
      <p>Para la banda <strong>[${a}, ${b}] Hz</strong> y el escenario
      <strong>${escenarioNombre}</strong>, la energía integrada de referencia es
      <strong>Eα ≈ ${exacta.toFixed(4)} µV²</strong>.</p>

      <p>${interpFisio}</p>

      <p>Con <strong>n = ${last.n}</strong> (h = ${last.h.toFixed(4)} Hz),
      el método más preciso fue <strong>${bestName}</strong>, con un error absoluto de
      <strong>${fmtErr(bestVal)} µV²</strong>.</p>

      <p>Las pendientes ajustadas en el gráfico log-log son
      <strong>Trapecio ≈ ${slopeT}</strong>, <strong>Simpson 1/3 ≈ ${slope13}</strong> y
      <strong>Simpson 3/8 ≈ ${slope38}</strong>. Se esperaba −2 para Trapecio y −4
      para ambos Simpson. Las discrepancias pueden deberse al número limitado de
      puntos en la secuencia de convergencia y a que, para pasos muy pequeños,
      el error de la referencia numérica comienza a dominar.</p>

      <p><strong>Conclusión metodológica.</strong> Ambos métodos de Simpson
      convergen más rápido que el Trapecio, lo que se traduce en una mejor
      relación precisión/costo. Para aplicaciones reales de cuantificación de
      energía alfa en EEG, se recomienda Simpson 1/3 con <em>n</em> moderado
      (por ejemplo, <em>n</em> ≥ 24), dado que su error ya es despreciable frente
      a la incertidumbre propia de la estimación espectral.</p>

      <p class="hint"><strong>Limitaciones del modelo.</strong> El modelo gaussiano
      es una idealización pedagógica del pico alfa y no captura asimetrías,
      múltiples subpicos ni cambios temporales de la señal. Los parámetros son
      hipotéticos y no constituyen evidencia clínica. Para uso científico debe
      reemplazarse $P(f)$ por la PSD estimada mediante Welch sobre datos EEG
      reales y declarar el método de estimación espectral empleado.</p>
    `;
    els.interp.innerHTML = html;
  }

  /* ------- Cálculo principal ------- */
  function calcular() {
    els.error.textContent = '';
    try {
      const cfg = leerConfig();
      const { a, b, n } = cfg;

      // Referencia de alta precisión (independiente de erf)
      const exacta = referenciaNumerica(a, b, cfg);
      // Analítica con erf (solo verificación pedagógica)
      const exactaErf = AN.energiaAnalitica(a, b, cfg.P0, cfg.A, cfg.mu, cfg.sigma);

      // Secuencia de convergencia: n, 2n, 4n, 8n, 16n (tope 384)
      const ns = [];
      let cur = n;
      for (let i = 0; i < 5; i++) {
        if (cur > 384) break;
        ns.push(cur);
        cur *= 2;
      }

      const resultados = ns.map(ni => evaluarEnN(a, b, ni, cfg, exacta));

      // Escenario (nombre)
      const key = els.escenario.value;
      const escNombre = key === 'custom'
        ? 'Personalizado'
        : (M.ESCENARIOS[key] ? M.ESCENARIOS[key].nombre : 'Personalizado');

      // Render
      llenarResumen(resultados, exacta, exactaErf, escNombre);
      llenarTabla(resultados, exacta);

      // Gráficos
      G.dibujarPSD(document.getElementById('grafPSD').getContext('2d'), a, b, cfg, M.PSD);
      G.dibujarConvergencia(document.getElementById('grafConv').getContext('2d'), resultados);
      G.dibujarLogError(document.getElementById('grafLog').getContext('2d'), resultados);

      // Interpretación
      generarInterpretacion(resultados, exacta, escNombre, a, b);

    } catch (err) {
      els.error.textContent = err.message;
    }
  }

  /* ------- Eventos ------- */
  els.escenario.addEventListener('change', () => {
    const key = els.escenario.value;
    if (key === 'custom') return;
    cargarEscenario(key);
    calcular();
  });

  els.btn.addEventListener('click', calcular);

  // Ejecución inicial al cargar la página
  window.addEventListener('load', calcular);
})();