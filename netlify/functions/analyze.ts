/**
 * Fonction Netlify planifiée : bot d'analyse de marché.
 *
 * Flux d'exécution :
 *   1. Charge la configuration (symbole, intervalle, secrets Telegram).
 *   2. Récupère les bougies OHLCV depuis Binance.
 *   3. Calcule les indicateurs (RSI, EMA 50, EMA 200).
 *   4. Décide d'un signal (ACHAT / VENTE / NEUTRE).
 *   5. Notifie via Telegram si le signal est exploitable.
 *
 * Planification : toutes les 15 minutes (cron `*​/15 * * * *`).
 */
import { schedule } from "@netlify/functions";
import type { Handler, HandlerResponse } from "@netlify/functions";
import { loadConfig } from "./lib/config.js";
import { fetchOHLCV } from "./lib/binance.js";
import { computeIndicators } from "./lib/indicators.js";
import { decideSignal } from "./lib/decision.js";
import { sendTelegramAlert } from "./lib/telegram.js";
import type { AnalysisResult } from "./lib/types.js";

/** Cron : exécution toutes les 15 minutes. */
const CRON_SCHEDULE = "*/15 * * * *";

/**
 * Logique métier isolée du wrapper `schedule` pour rester testable
 * et légère en environnement serverless.
 */
export async function runAnalysis(): Promise<AnalysisResult> {
  const config = loadConfig();

  const candles = await fetchOHLCV(
    config.symbol,
    config.interval,
    config.candleLimit,
    config.binanceBaseUrl,
  );
  const indicators = computeIndicators(candles);
  const signal = decideSignal(indicators);

  const result: AnalysisResult = {
    symbol: config.symbol,
    interval: config.interval,
    indicators,
    signal,
    timestamp: new Date().toISOString(),
  };

  // On ne notifie que pour les signaux exploitables afin d'éviter le spam.
  if (signal === "ACHAT" || signal === "VENTE") {
    await sendTelegramAlert(result);
  } else {
    console.log("[analyze] Signal NEUTRE : aucune alerte envoyée.");
  }

  return result;
}

/**
 * Handler brut. Encapsule toute la logique dans un try/catch afin de
 * garantir une réponse HTTP propre, quel que soit le résultat.
 */
const analyzeHandler: Handler = async (): Promise<HandlerResponse> => {
  const startedAt = Date.now();
  console.log("[analyze] Démarrage de l'analyse planifiée.");

  try {
    const result = await runAnalysis();
    const durationMs = Date.now() - startedAt;
    console.log(`[analyze] Analyse terminée en ${durationMs} ms — signal=${result.signal}.`);

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ok: true, ...result }),
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[analyze] Échec de l'analyse : ${message}`);

    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ok: false, error: message }),
    };
  }
};

/** Export attendu par Netlify : handler planifié via cron. */
export const handler = schedule(CRON_SCHEDULE, analyzeHandler);
