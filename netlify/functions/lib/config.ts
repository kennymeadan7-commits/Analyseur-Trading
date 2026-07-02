/**
 * Centralise la lecture et la validation de la configuration
 * issue des variables d'environnement.
 */

export interface AppConfig {
  readonly symbol: string;
  readonly interval: string;
  /** Nombre de bougies à récupérer (suffisant pour l'EMA 200). */
  readonly candleLimit: number;
  /** URL de base de l'API Binance (configurable pour test/géo-blocage). */
  readonly binanceBaseUrl: string;
  readonly telegram: {
    readonly botToken: string | undefined;
    readonly chatId: string | undefined;
  };
}

/**
 * Construit la configuration applicative.
 * Les valeurs optionnelles disposent de valeurs par défaut sûres ;
 * les secrets Telegram restent optionnels ici et sont validés au
 * moment de l'envoi de l'alerte.
 */
export function loadConfig(): AppConfig {
  const symbol = (process.env["SYMBOL"] ?? "BTCUSDT").toUpperCase();
  const interval = process.env["INTERVAL"] ?? "15m";
  // Défaut : API principale. Peut être remplacée par le miroir public
  // `https://data-api.binance.vision` si l'IP est géo-bloquée (HTTP 451).
  const binanceBaseUrl = (
    process.env["BINANCE_BASE_URL"] ?? "https://api.binance.com"
  ).replace(/\/+$/, "");

  return {
    symbol,
    interval,
    // 300 bougies : marge confortable au-dessus des 200 requises par l'EMA 200.
    candleLimit: 300,
    binanceBaseUrl,
    telegram: {
      botToken: process.env["TELEGRAM_BOT_TOKEN"],
      chatId: process.env["CHAT_ID"],
    },
  };
}
