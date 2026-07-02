/**
 * Fonction Netlify HTTP : endpoint d'analyse de marché.
 *
 * Appelée par le front-end (ou directement), elle :
 *   1. Charge la configuration (symbole, intervalle).
 *   2. Récupère les bougies OHLCV depuis Binance.
 *   3. Calcule les indicateurs (RSI, EMA 50, EMA 200).
 *   4. Décide d'un signal (ACHAT / VENTE / NEUTRE).
 *   5. Renvoie le résultat en JSON.
 *
 * Le symbole et l'intervalle peuvent être surchargés via la query string,
 * ex : /.netlify/functions/analyze?symbol=ETHUSDT&interval=1h
 */
import type { Handler, HandlerEvent, HandlerResponse } from "@netlify/functions";
import { loadConfig } from "./lib/config.js";
import { fetchOHLCV } from "./lib/binance.js";
import { computeIndicators } from "./lib/indicators.js";
import { decideSignal } from "./lib/decision.js";
import type { AnalysisResult } from "./lib/types.js";

/** En-têtes communs : JSON + CORS ouvert (API de lecture publique). */
const JSON_HEADERS: Record<string, string> = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Cache-Control": "no-store",
};

/**
 * Logique métier isolée, réutilisable (front-end, test local, etc.).
 *
 * @param overrides Surcharges optionnelles (symbole, intervalle).
 */
export async function runAnalysis(overrides?: {
  symbol?: string | undefined;
  interval?: string | undefined;
}): Promise<AnalysisResult> {
  const config = loadConfig();
  const symbol = (overrides?.symbol ?? config.symbol).toUpperCase();
  const interval = overrides?.interval ?? config.interval;

  const candles = await fetchOHLCV(symbol, interval, config.candleLimit, config.binanceBaseUrl);
  const indicators = computeIndicators(candles);
  const signal = decideSignal(indicators);

  return {
    symbol,
    interval,
    indicators,
    signal,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Handler HTTP. Encapsule toute la logique dans un try/catch afin de
 * garantir une réponse propre, quel que soit le résultat.
 */
export const handler: Handler = async (event: HandlerEvent): Promise<HandlerResponse> => {
  const startedAt = Date.now();

  // Pré-vol CORS.
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: JSON_HEADERS, body: "" };
  }

  console.log("[analyze] Démarrage de l'analyse.");

  try {
    const symbol = event.queryStringParameters?.["symbol"] ?? undefined;
    const interval = event.queryStringParameters?.["interval"] ?? undefined;

    const result = await runAnalysis({ symbol, interval });
    const durationMs = Date.now() - startedAt;
    console.log(`[analyze] Analyse terminée en ${durationMs} ms — signal=${result.signal}.`);

    return {
      statusCode: 200,
      headers: JSON_HEADERS,
      body: JSON.stringify({ ok: true, ...result }),
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[analyze] Échec de l'analyse : ${message}`);

    return {
      statusCode: 500,
      headers: JSON_HEADERS,
      body: JSON.stringify({ ok: false, error: message }),
    };
  }
};
