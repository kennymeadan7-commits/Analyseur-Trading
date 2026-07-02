/**
 * Algorithme de décision : traduit les indicateurs techniques en signal.
 */
import type { Indicators, Signal } from "./types.js";

/** Seuil de survente du RSI. */
const RSI_OVERSOLD = 30;
/** Seuil de surachat du RSI. */
const RSI_OVERBOUGHT = 70;

/**
 * Décide d'un signal de trading à partir des indicateurs.
 *
 * Règles :
 *  - ACHAT  : RSI < 30 ET Prix > EMA 200 (survente en tendance haussière).
 *  - VENTE  : RSI > 70 ET Prix < EMA 200 (surachat en tendance baissière).
 *  - NEUTRE : tout autre cas.
 *
 * @param indicators Dernières valeurs des indicateurs.
 * @returns Le signal correspondant.
 */
export function decideSignal(indicators: Indicators): Signal {
  const { rsi, ema200, lastPrice } = indicators;

  const isUptrend = lastPrice > ema200;
  const isDowntrend = lastPrice < ema200;

  let signal: Signal = "NEUTRE";

  if (rsi < RSI_OVERSOLD && isUptrend) {
    signal = "ACHAT";
  } else if (rsi > RSI_OVERBOUGHT && isDowntrend) {
    signal = "VENTE";
  }

  console.log(
    `[decision] signal=${signal} (RSI=${rsi.toFixed(2)}, ` +
      `prix=${lastPrice}, EMA200=${ema200.toFixed(2)})`,
  );

  return signal;
}
