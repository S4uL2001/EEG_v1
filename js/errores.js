(function (global) {
  'use strict';

  function errorAbsoluto(exacto, aprox) {
    return Math.abs(exacto - aprox);
  }

  /**
   * Si el valor exacto es cero, el error relativo no está definido.
   */
  function errorRelativoPorcentual(exacto, aprox) {
    if (exacto === 0) return null;
    return (Math.abs(exacto - aprox) / Math.abs(exacto)) * 100;
  }

  global.NeuroEEG = global.NeuroEEG || {};
  global.NeuroEEG.errores = { errorAbsoluto, errorRelativoPorcentual };
})(window);