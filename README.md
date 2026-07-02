# Analyseur-Trading

Bot d'analyse de marché **serverless** déployé sur **Netlify Functions**. Il récupère les données OHLCV de la paire `BTCUSDT` depuis l'API publique de Binance, calcule des indicateurs techniques (RSI, EMA 50, EMA 200), en déduit un signal (`ACHAT`, `VENTE` ou `NEUTRE`) et envoie une alerte Telegram le cas échéant. L'exécution est planifiée **toutes les 15 minutes**.

## Architecture

```
netlify/
└── functions/
    ├── analyze.ts        # Fonction planifiée (orchestration + handler)
    └── lib/
        ├── config.ts     # Chargement/validation des variables d'env
        ├── binance.ts    # Récupération OHLCV via l'API Binance (axios)
        ├── indicators.ts # Calcul RSI(14), EMA(50), EMA(200)
        ├── decision.ts   # Algorithme decideSignal()
        ├── telegram.ts   # sendTelegramAlert()
        └── types.ts      # Types partagés (typage strict)
netlify.toml              # Configuration Netlify (functions + esbuild)
tsconfig.json             # TypeScript en mode strict
package.json              # Dépendances
```

Le code est **modulaire** : chaque responsabilité est isolée dans un module dédié, ce qui garantit un démarrage rapide (cold start) et facilite les tests.

## Algorithme de décision

La fonction `decideSignal()` applique les règles suivantes :

| Signal   | Condition                                             | Interprétation                        |
| -------- | ----------------------------------------------------- | ------------------------------------- |
| `ACHAT`  | `RSI < 30` **ET** `Prix > EMA 200`                    | Survente en tendance haussière        |
| `VENTE`  | `RSI > 70` **ET** `Prix < EMA 200`                    | Surachat en tendance baissière        |
| `NEUTRE` | Tous les autres cas                                   | Aucune action                         |

Une alerte Telegram n'est envoyée que pour les signaux `ACHAT` et `VENTE` (évite le spam).

## Prérequis

- Node.js ≥ 18
- Un compte Netlify
- Un bot Telegram (créé via [@BotFather](https://t.me/BotFather)) et l'ID du chat destinataire

## Installation

```bash
npm install
```

## Variables d'environnement

Copiez `.env.example` en `.env` (local) ou configurez-les dans Netlify
(**Site settings → Environment variables**) :

| Variable             | Requis | Description                                            |
| -------------------- | ------ | ------------------------------------------------------ |
| `TELEGRAM_BOT_TOKEN` | Oui\*  | Jeton du bot Telegram (via @BotFather)                 |
| `CHAT_ID`            | Oui\*  | Identifiant du chat/canal destinataire                 |
| `SYMBOL`             | Non    | Paire à analyser (défaut : `BTCUSDT`)                  |
| `INTERVAL`           | Non    | Intervalle des bougies (défaut : `15m`)                |

\* Si absents, l'analyse s'exécute mais aucune alerte n'est envoyée (log d'avertissement).

## Développement local

```bash
# Vérification du typage strict
npm run typecheck

# Exécution locale avec Netlify CLI
npm run dev
# puis appeler manuellement :
# curl http://localhost:8888/.netlify/functions/analyze
```

## Déploiement

```bash
npm run deploy
```

La planification (`*/15 * * * *`) est déclarée directement dans le code via le helper
`schedule` de `@netlify/functions`. Netlify enregistre automatiquement le cron au déploiement.

## Dépendances principales

- [`@netlify/functions`](https://www.npmjs.com/package/@netlify/functions) — types et helper `schedule`
- [`axios`](https://www.npmjs.com/package/axios) — requêtes HTTP (Binance & Telegram)
- [`technicalindicators`](https://www.npmjs.com/package/technicalindicators) — calcul RSI / EMA

## Avertissement

Ce projet est fourni à des fins éducatives. Il ne constitue pas un conseil financier.
Le trading comporte des risques ; utilisez-le à vos propres risques.
