(function (global) {
  'use strict';

  /**
   * Regla del Trapecio compuesta.
   * Pvals: array de P(f_i) en los n+1 nodos equidistantes.
   * h: tamaño de paso.
   */
  function trapecio(Pvals, h) {
    const n = Pvals.length - 1;
    let suma = Pvals[0] + Pvals[n];
    for (let i = 1; i < n; i++) suma += 2 * Pvals[i];
    return (h / 2) * suma;
  }

  global.NeuroEEG = global.NeuroEEG || {};
  global.NeuroEEG.trapecio = trapecio;
})(window);