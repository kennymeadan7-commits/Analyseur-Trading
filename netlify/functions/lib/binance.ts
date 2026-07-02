/**
 * Récupération des données OHLCV depuis l'API publique de Binance.
 * Endpoint utilisé : GET /api/v3/klines (aucune authentification requise).
 * Docs : https://developers.binance.com/docs/binance-spot-api-docs
 */
import axios, { AxiosError } from "axios";
import type { Candle } from "./types.js";

const BINANCE_BASE_URL = "https://api.binance.com";
const KLINES_ENDPOINT = "/api/v3/klines";

/**
 * Format brut d'une bougie renvoyée par Binance : un tableau positionnel.
 * [ openTime, open, high, low, close, volume, closeTime, ... ]
 */
type RawKline = [
  number, // 0 open time
  string, // 1 open
  string, // 2 high
  string, // 3 low
  string, // 4 close
  string, // 5 volume
  number, // 6 close time
  ...unknown[],
];

/**
 * Parse une valeur numérique et lève une erreur explicite si invalide.
 */
function toFiniteNumber(value: unknown, field: string): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) {
    throw new Error(`Valeur numérique invalide pour le champ "${field}": ${String(value)}`);
  }
  return n;
}

/**
 * Transforme une bougie brute Binance en Candle typée et normalisée.
 */
function normalizeKline(raw: RawKline): Candle {
  return {
    openTime: toFiniteNumber(raw[0], "openTime"),
    open: toFiniteNumber(raw[1], "open"),
    high: toFiniteNumber(raw[2], "high"),
    low: toFiniteNumber(raw[3], "low"),
    close: toFiniteNumber(raw[4], "close"),
    volume: toFiniteNumber(raw[5], "volume"),
    closeTime: toFiniteNumber(raw[6], "closeTime"),
  };
}

/**
 * Récupère les bougies OHLCV pour un symbole/intervalle donnés.
 *
 * @param symbol   Paire à analyser (ex. "BTCUSDT").
 * @param interval Intervalle des bougies (ex. "15m", "1h", "1d").
 * @param limit    Nombre de bougies (max 1000 côté Binance).
 * @returns Liste ordonnée (ancienne -> récente) de bougies normalisées.
 */
export async function fetchOHLCV(
  symbol: string,
  interval: string,
  limit: number,
): Promise<Candle[]> {
  try {
    console.log(`[binance] Requête klines symbol=${symbol} interval=${interval} limit=${limit}`);

    const { data } = await axios.get<RawKline[]>(`${BINANCE_BASE_URL}${KLINES_ENDPOINT}`, {
      params: { symbol, interval, limit },
      // Délai court : indispensable en environnement serverless.
      timeout: 8_000,
      headers: { Accept: "application/json" },
    });

    if (!Array.isArray(data) || data.length === 0) {
      throw new Error("Réponse Binance vide ou dans un format inattendu.");
    }

    const candles = data.map(normalizeKline);
    console.log(`[binance] ${candles.length} bougies récupérées avec succès.`);
    return candles;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      const axErr = error as AxiosError;
      const status = axErr.response?.status ?? "N/A";
      throw new Error(
        `Échec de la récupération des données Binance (HTTP ${status}) : ${axErr.message}`,
      );
    }
    throw new Error(
      `Erreur inattendue lors de la récupération des données Binance : ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
}
