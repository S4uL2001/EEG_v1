# Energía EEG en banda alfa · Integración numérica

Aplicación web académica que compara la **regla del Trapecio**, **Simpson 1/3** y **Simpson 3/8** para calcular la energía integrada de la densidad espectral de potencia (PSD) de una señal EEG en la banda alfa.

## Objetivo

Cuantificar la energía en banda alfa mediante integración numérica de la PSD, comparando precisión y convergencia de tres métodos, y ofrecer una herramienta interactiva para explorar el efecto de parámetros y tamaños de paso.

## Problemática

La inspección visual de un EEG no cuantifica de forma objetiva la energía en una banda. Se propone modelar el pico alfa como una gaussiana sobre una línea base:

$$P(f) = P_0 + A\,e^{-\frac{(f-\mu)^2}{2\sigma^2}}$$

y calcular

$$E_\alpha = \int_a^b P(f)\,df$$

con $a=8$ Hz, $b=13$ Hz (banda alfa).

## Solución analítica

$$E_\alpha^{\text{exacta}} = P_0(b-a) + \frac{A\sigma\sqrt{2\pi}}{2}\left[\operatorname{erf}\!\left(\frac{b-\mu}{\sigma\sqrt{2}}\right) - \operatorname{erf}\!\left(\frac{a-\mu}{\sigma\sqrt{2}}\right)\right]$$

La aplicación calcula una **referencia numérica de alta precisión** (Trapecio con $N=200\,000$) y adicionalmente muestra el valor analítico con $\operatorname{erf}$ como verificación pedagógica.

## Métodos numéricos

- **Trapecio compuesta** (orden 2).
- **Simpson 1/3 compuesta** (orden 4, requiere $n$ par).
- **Simpson 3/8 compuesta** (orden 4, requiere $n$ múltiplo de 3).

La comparación se realiza sobre la secuencia $n, 2n, 4n, 8n, 16n$ (tope 384).

## Parámetros hipotéticos

Los escenarios precargados (reposo, tarea cognitiva, somnolencia) son **hipotéticos**, plausibles para simulación docente. **No son datos clínicos.**

## Tecnologías

- HTML5, CSS3, JavaScript (vanilla, sin dependencias de build).
- [Chart.js](https://www.chartjs.org/) para gráficos.
- [MathJax](https://www.mathjax.org/) para notación matemática.
- GitHub Pages para publicación.

## Estructura del repositorio
