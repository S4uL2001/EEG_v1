(function (global) {
  'use strict';

  /**
   * Aproximación de Abramowitz & Stegun 7.1.26 para erf.
   * Error absoluto máximo ≈ 1.5e-7.
   */
  function erf(x) {
    const sign = x < 0 ? -1 : 1;
    const ax = Math.abs(x);
    const a1 =  0.254829592;
    const a2 = -0.284496736;
    const a3 =  1.421413741;
    const a4 = -1.453152027;
    const a5 =  1.061405429;
    const p  =  0.3275911;
    const t = 1 / (1 + p * ax);
    const y = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-ax * ax);
    return sign * y;
  }

  /**
   * Solución analítica:
   *   E = P0*(b-a) + (A*sigma*sqrt(2*pi)/2) * [erf(zb) - erf(za)]
   * con za = (a-mu)/(sigma*sqrt(2)), zb = (b-mu)/(sigma*sqrt(2)).
   */
  function energiaAnalitica(a, b, P0, A, mu, sigma) {
    const base = P0 * (b - a);
    const sq2 = Math.SQRT2;
    const za = (a - mu) / (sigma * sq2);
    const zb = (b - mu) / (sigma * sq2);
    const coef = (A * sigma * Math.sqrt(2 * Math.PI)) / 2;
    return base + coef * (erf(zb) - erf(za));
  }

  global.NeuroEEG = global.NeuroEEG || {};
  global.NeuroEEG.analitica = { erf, energiaAnalitica };
})(window);