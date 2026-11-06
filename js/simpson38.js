(function (global) {
  'use strict';

  /**
   * Regla de Simpson 3/8 compuesta. Requiere n múltiplo de 3.
   */
  function simpson38(Pvals, h) {
    const n = Pvals.length - 1;
    if (n % 3 !== 0) {
      throw new Error('Simpson 3/8 requiere n múltiplo de 3.');
    }
    let suma = Pvals[0] + Pvals[n];
    for (let i = 1; i < n; i++) {
      if (i % 3 === 0) suma += 2 * Pvals[i];
      else suma += 3 * Pvals[i];
    }
    return (3 * h / 8) * suma;
  }

  global.NeuroEEG = global.NeuroEEG || {};
  global.NeuroEEG.simpson38 = simpson38;
})(window);