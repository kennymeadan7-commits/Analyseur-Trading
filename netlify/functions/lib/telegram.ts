/**
 * Envoi d'alertes via l'API Bot Telegram.
 * Docs : https://core.telegram.org/bots/api#sendmessage
 */
import axios from "axios";
import type { AnalysisResult, Signal } from "./types.js";

/** Émoji associé à chaque type de signal pour lisibilité dans Telegram. */
const SIGNAL_EMOJI: Record<Signal, string> = {
  ACHAT: "🟢",
  VENTE: "🔴",
  NEUTRE: "⚪️",
};

/**
 * Construit le message Markdown envoyé à Telegram.
 */
function buildMessage(result: AnalysisResult): string {
  const { symbol, interval, indicators, signal, timestamp } = result;
  const emoji = SIGNAL_EMOJI[signal];

  return [
    `${emoji} *Signal ${signal}* — \`${symbol}\` (${interval})`,
    "",
    `• Prix : \`${indicators.lastPrice}\``,
    `• RSI(14) : \`${indicators.rsi.toFixed(2)}\``,
    `• EMA(50) : \`${indicators.ema50.toFixed(2)}\``,
    `• EMA(200) : \`${indicators.ema200.toFixed(2)}\``,
    "",
    `_${timestamp}_`,
  ].join("\n");
}

/**
 * Envoie une alerte Telegram décrivant le résultat de l'analyse.
 *
 * Nécessite les variables d'environnement `TELEGRAM_BOT_TOKEN` et `CHAT_ID`.
 * Si elles sont absentes, l'envoi est ignoré (log d'avertissement) plutôt
 * que de faire échouer toute l'exécution.
 *
 * @returns `true` si le message a été envoyé, `false` sinon.
 */
export async function sendTelegramAlert(result: AnalysisResult): Promise<boolean> {
  const botToken = process.env["TELEGRAM_BOT_TOKEN"];
  const chatId = process.env["CHAT_ID"];

  if (!botToken || !chatId) {
    console.warn(
      "[telegram] TELEGRAM_BOT_TOKEN ou CHAT_ID manquant : alerte non envoyée.",
    );
    return false;
  }

  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

  try {
    console.log(`[telegram] Envoi de l'alerte "${result.signal}" au chat ${chatId}...`);

    await axios.post(
      url,
      {
        chat_id: chatId,
        text: buildMessage(result),
        parse_mode: "Markdown",
        disable_web_page_preview: true,
      },
      { timeout: 8_000, headers: { "Content-Type": "application/json" } },
    );

    console.log("[telegram] Alerte envoyée avec succès.");
    return true;
  } catch (error: unknown) {
    // On ne propage pas l'erreur : l'échec d'une notification ne doit pas
    // compromettre l'exécution de la fonction planifiée.
    if (axios.isAxiosError(error)) {
      const status = error.response?.status ?? "N/A";
      const payload = JSON.stringify(error.response?.data ?? {});
      console.error(`[telegram] Échec de l'envoi (HTTP ${status}) : ${payload}`);
    } else {
      console.error(
        `[telegram] Erreur inattendue : ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
    return false;
  }
}
