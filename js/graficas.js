(function (global) {
  'use strict';

  let chartPSD = null;
  let chartConv = null;
  let chartLog = null;

  /**
   * Ajuste lineal y = m*x + b por mínimos cuadrados.
   * Descarta puntos con y nulo o no finito.
   */
  function linreg(xs, ys) {
    const pts = xs.map((x, i) => ({ x, y: ys[i] }))
      .filter(p => isFinite(p.x) && isFinite(p.y));
    const n = pts.length;
    if (n < 2) return { m: NaN, b: NaN, ok: false };
    let sx = 0, sy = 0, sxx = 0, sxy = 0;
    for (const p of pts) {
      sx += p.x; sy += p.y;
      sxx += p.x * p.x; sxy += p.x * p.y;
    }
    const den = n * sxx - sx * sx;
    if (Math.abs(den) < 1e-30) return { m: NaN, b: NaN, ok: false };
    const m = (n * sxy - sx * sy) / den;
    const b = (sy - m * sx) / n;
    return { m, b, ok: true };
  }

  /**
   * Gráfico de PSD con banda [a, b] sombreada.
   */
  function dibujarPSD(ctx, a, b, params, PSDfunc) {
    const { mu, sigma } = params;
    const fmin = Math.min(a - 2, mu - 4 * sigma);
    const fmax = Math.max(b + 2, mu + 4 * sigma);
    const N = 300;

    const xs = [];
    const ys = [];
    for (let i = 0; i <= N; i++) {
      const f = fmin + (i * (fmax - fmin)) / N;
      xs.push(f);
      ys.push(PSDfunc(f, params.P0, params.A, params.mu, params.sigma));
    }

    const bandPts = [];
    for (let i = 0; i <= N; i++) {
      const f = fmin + (i * (fmax - fmin)) / N;
      if (f >= a && f <= b) {
        bandPts.push({ x: f, y: PSDfunc(f, params.P0, params.A, params.mu, params.sigma) });
      }
    }

    if (chartPSD) chartPSD.destroy();
    chartPSD = new Chart(ctx, {
      type: 'line',
      data: {
        datasets: [
          {
            label: `Banda [${a}, ${b}] Hz`,
            data: bandPts,
            borderColor: 'rgba(220, 38, 38, 0)',
            backgroundColor: 'rgba(220, 38, 38, 0.18)',
            fill: 'origin',
            pointRadius: 0,
            borderWidth: 0,
            tension: 0.2
          },
          {
            label: 'P(f) [µV²/Hz]',
            data: xs.map((x, i) => ({ x, y: ys[i] })),
            borderColor: '#2563eb',
            backgroundColor: 'rgba(37, 99, 235, 0.05)',
            borderWidth: 2,
            pointRadius: 0,
            fill: false,
            tension: 0.2
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            type: 'linear',
            title: { display: true, text: 'Frecuencia (Hz)' }
          },
          y: {
            title: { display: true, text: 'P(f) [µV²/Hz]' },
            beginAtZero: true
          }
        },
        plugins: {
          legend: { position: 'top' },
          tooltip: { mode: 'index', intersect: false }
        }
      }
    });
  }

  /**
   * Convergencia: energía vs n (escala logarítmica en x).
   */
  function dibujarConvergencia(ctx, resultados) {
    if (chartConv) chartConv.destroy();
    const ns = resultados.map(r => r.n);

    chartConv = new Chart(ctx, {
      type: 'line',
      data: {
        labels: ns.map(String),
        datasets: [
          {
            label: 'Trapecio',
            data: resultados.map(r => r.t),
            borderColor: '#2563eb',
            backgroundColor: '#2563eb',
            borderWidth: 2,
            pointRadius: 5,
            tension: 0.15
          },
          {
            label: 'Simpson 1/3',
            data: resultados.map(r => r.s13),
            borderColor: '#059669',
            backgroundColor: '#059669',
            borderWidth: 2,
            pointRadius: 5,
            tension: 0.15
          },
          {
            label: 'Simpson 3/8',
            data: resultados.map(r => r.s38),
            borderColor: '#dc2626',
            backgroundColor: '#dc2626',
            borderWidth: 2,
            pointRadius: 5,
            tension: 0.15
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            type: 'category',
            title: { display: true, text: 'n (número de subintervalos)' }
          },
          y: {
            title: { display: true, text: 'Eα aproximada [µV²]' }
          }
        },
        plugins: { legend: { position: 'top' } }
      }
    });
  }

  /**
   * Gráfico log-log de error absoluto vs h, con ajustes lineales y
   * actualización de los elementos del DOM con las pendientes.
   */
  function dibujarLogError(ctx, resultados) {
    const xs = resultados.map(r => Math.log10(r.h));
    const yT  = resultados.map(r => r.eaT  > 0 ? Math.log10(r.eaT)  : null);
    const y13 = resultados.map(r => r.ea13 > 0 ? Math.log10(r.ea13) : null);
    const y38 = resultados.map(r => r.ea38 > 0 ? Math.log10(r.ea38) : null);

    const rT  = linreg(xs, yT);
    const r13 = linreg(xs, y13);
    const r38 = linreg(xs, y38);

    const set = (id, v) => {
      const el = document.getElementById(id);
      if (el) el.textContent = Number.isFinite(v) ? v.toFixed(3) : '—';
    };
    set('slopeT', rT.m);
    set('slope13', r13.m);
    set('slope38', r38.m);

    // Líneas de ajuste dentro del rango observado
    const xMin = Math.min(...xs.filter(x => isFinite(x)));
    const xMax = Math.max(...xs.filter(x => isFinite(x)));
    const line = (reg, color) => ({
      label: `Ajuste (pendiente ${reg.m.toFixed(2)})`,
      data: [{ x: xMin, y: reg.m * xMin + reg.b }, { x: xMax, y: reg.m * xMax + reg.b }],
      borderColor: color,
      backgroundColor: color,
      borderWidth: 1.5,
      borderDash: [6, 6],
      pointRadius: 0,
      fill: false,
      tension: 0
    });

    const scatter = (label, y, color) => ({
      label,
      data: xs.map((x, i) => ({ x, y: y[i] })),
      borderColor: color,
      backgroundColor: color,
      showLine: false,
      pointRadius: 5,
      pointHoverRadius: 7
    });

    if (chartLog) chartLog.destroy();
    chartLog = new Chart(ctx, {
      type: 'scatter',
      data: {
        datasets: [
          scatter('Trapecio', yT, '#2563eb'),
          scatter('Simpson 1/3', y13, '#059669'),
          scatter('Simpson 3/8', y38, '#dc2626'),
          line(rT, '#2563eb'),
          line(r13, '#059669'),
          line(r38, '#dc2626')
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            type: 'linear',
            title: { display: true, text: 'log₁₀(h)' }
          },
          y: {
            title: { display: true, text: 'log₁₀(Ea)' }
          }
        },
        plugins: { legend: { position: 'top' } }
      }
    });
  }

  global.NeuroEEG = global.NeuroEEG || {};
  global.NeuroEEG.graficas = { dibujarPSD, dibujarConvergencia, dibujarLogError, linreg };
})(window);