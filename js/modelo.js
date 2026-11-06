(function (global) {
  'use strict';

  const ESCENARIOS = {
    reposo: { nombre: 'Reposo, ojos cerrados', P0: 2, A: 10, mu: 10.0, sigma: 1.5 },
    tarea:  { nombre: 'Tarea cognitiva',       P0: 2, A: 3,  mu: 10.0, sigma: 1.5 },
    sueno:  { nombre: 'Somnolencia',           P0: 2, A: 5,  mu: 9.5,  sigma: 2.0 }
  };

  /**
   * Densidad espectral de potencia modelada como gaussiana sobre línea base.
   */
  function PSD(f, P0, A, mu, sigma) {
    const d = f - mu;
    return P0 + A * Math.exp(-(d * d) / (2 * sigma * sigma));
  }

  /**
   * Genera nodos equidistantes y valores de P(f) en [a, b].
   */
  function generarNodos(a, b, n, params) {
    const { P0, A, mu, sigma } = params;
    const h = (b - a) / n;
    const fnodes = new Array(n + 1);
    const Pvals = new Array(n + 1);
    for (let i = 0; i <= n; i++) {
      const f = a + i * h;
      fnodes[i] = f;
      Pvals[i] = PSD(f, P0, A, mu, sigma);
    }
    return { fnodes, Pvals, h };
  }

  global.NeuroEEG = global.NeuroEEG || {};
  global.NeuroEEG.modelo = { ESCENARIOS, PSD, generarNodos };
})(window);