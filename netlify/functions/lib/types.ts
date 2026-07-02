/**
 * Types partagés pour le bot d'analyse de marché.
 */

/** Signal de trading produit par l'algorithme de décision. */
export type Signal = "ACHAT" | "VENTE" | "NEUTRE";

/**
 * Bougie OHLCV normalisée à partir de la réponse brute de Binance.
 * Les timestamps sont en millisecondes (epoch).
 */
export interface Candle {
  readonly openTime: number;
  readonly open: number;
  readonly high: number;
  readonly low: number;
  readonly close: number;
  readonly volume: number;
  readonly closeTime: number;
}

/** Résultat des indicateurs techniques calculés sur la série de clôtures. */
export interface Indicators {
  readonly rsi: number;
  readonly ema50: number;
  readonly ema200: number;
  readonly lastPrice: number;
}

/** Résultat complet d'une analyse, prêt à être journalisé ou notifié. */
export interface AnalysisResult {
  readonly symbol: string;
  readonly interval: string;
  readonly indicators: Indicators;
  readonly signal: Signal;
  readonly timestamp: string;
}
