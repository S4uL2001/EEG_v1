(function (global) {
  'use strict';

  /**
   * Regla de Simpson 1/3 compuesta. Requiere n par.
   */
  function simpson13(Pvals, h) {
    const n = Pvals.length - 1;
    if (n % 2 !== 0) {
      throw new Error('Simpson 1/3 requiere n par.');
    }
    let suma = Pvals[0] + Pvals[n];
    for (let i = 1; i < n; i++) {
      suma += (i % 2 === 1 ? 4 : 2) * Pvals[i];
    }
    return (h / 3) * suma;
  }

  global.NeuroEEG = global.NeuroEEG || {};
  global.NeuroEEG.simpson13 = simpson13;
})(window);