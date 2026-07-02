/**
 * Runner de test local : exécute le flux d'analyse complet
 * (Binance -> indicateurs -> décision) hors de Netlify.
 *
 * Usage :
 *   npm run test:local
 *
 * Configuration : ce script charge automatiquement un fichier `.env`
 * (voir `.env.example`). Aucune variable à saisir en ligne de commande.
 *
 * Astuce géo-blocage : si l'API principale renvoie HTTP 451, définissez
 * dans votre `.env` :
 *   BINANCE_BASE_URL=https://data-api.binance.vision
 */
import "dotenv/config";
import { runAnalysis } from "../netlify/functions/analyze.js";

async function main(): Promise<void> {
  console.log("=== Test local de l'analyseur ===");
  console.log(`BINANCE_BASE_URL = ${process.env["BINANCE_BASE_URL"] ?? "(défaut: api.binance.com)"}`);

  try {
    const result = await runAnalysis();
    console.log("\n=== Résultat ===");
    console.log(JSON.stringify(result, null, 2));
    process.exit(0);
  } catch (error: unknown) {
    console.error(
      "\n=== Échec ===\n",
      error instanceof Error ? error.stack ?? error.message : String(error),
    );
    process.exit(1);
  }
}

void main();
