/**
 * Calcul des indicateurs techniques via la bibliothèque `technicalindicators`.
 * Indicateurs : RSI(14), EMA(50), EMA(200).
 */
import { RSI, EMA } from "technicalindicators";
import type { Candle, Indicators } from "./types.js";

const RSI_PERIOD = 14;
const EMA_FAST_PERIOD = 50;
const EMA_SLOW_PERIOD = 200;

/**
 * Retourne la dernière valeur d'une série ou lève une erreur si vide.
 * `technicalindicators` renvoie moins de valeurs que d'entrées
 * (période de warm-up) : on veut toujours la valeur la plus récente.
 */
function lastOf(series: number[], name: string): number {
  const value = series.at(-1);
  if (value === undefined || !Number.isFinite(value)) {
    throw new Error(
      `Impossible de calculer l'indicateur "${name}" : données insuffisantes.`,
    );
  }
  return value;
}

/**
 * Calcule RSI(14), EMA(50) et EMA(200) à partir des bougies fournies.
 *
 * @param candles Bougies ordonnées (ancienne -> récente).
 * @returns Les dernières valeurs de chaque indicateur + le dernier prix.
 * @throws Si le nombre de bougies est insuffisant pour l'EMA 200.
 */
export function computeIndicators(candles: Candle[]): Indicators {
  if (candles.length < EMA_SLOW_PERIOD) {
    throw new Error(
      `Données insuffisantes : ${candles.length} bougies reçues, ` +
        `${EMA_SLOW_PERIOD} requises pour l'EMA ${EMA_SLOW_PERIOD}.`,
    );
  }

  const closes: number[] = candles.map((c) => c.close);

  const rsiSeries = RSI.calculate({ period: RSI_PERIOD, values: closes });
  const ema50Series = EMA.calculate({ period: EMA_FAST_PERIOD, values: closes });
  const ema200Series = EMA.calculate({ period: EMA_SLOW_PERIOD, values: closes });

  const lastClose = closes.at(-1);
  if (lastClose === undefined) {
    throw new Error("Aucun prix de clôture disponible.");
  }

  const indicators: Indicators = {
    rsi: lastOf(rsiSeries, "RSI"),
    ema50: lastOf(ema50Series, "EMA50"),
    ema200: lastOf(ema200Series, "EMA200"),
    lastPrice: lastClose,
  };

  console.log(
    `[indicators] prix=${indicators.lastPrice} RSI=${indicators.rsi.toFixed(2)} ` +
      `EMA50=${indicators.ema50.toFixed(2)} EMA200=${indicators.ema200.toFixed(2)}`,
  );

  return indicators;
}
