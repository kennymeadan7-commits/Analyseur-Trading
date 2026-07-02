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
| `BINANCE_BASE_URL`   | Non    | URL de base de l'API (défaut : `https://api.binance.com`) |

\* Si absents, l'analyse s'exécute mais aucune alerte n'est envoyée (log d'avertissement).

## Développement local

Le runner local charge automatiquement un fichier `.env` (via `dotenv`).
**Aucune variable à saisir en ligne de commande** — c'est la méthode
recommandée, notamment sous Windows.

```bash
# 1. Créer votre fichier de config local
#    (Windows: copy .env.example .env  |  macOS/Linux: cp .env.example .env)
cp .env.example .env

# 2. Vérifier le typage strict
npm run typecheck

# 3. Exécuter le flux complet (Binance -> indicateurs -> décision -> Telegram)
npm run test:local

# (optionnel) Exécution via Netlify CLI, puis appel manuel :
npm run dev
# curl http://localhost:8888/.netlify/functions/analyze
```

### Géo-blocage Binance (HTTP 451)

L'API principale `api.binance.com` est bloquée dans certaines régions/datacenters
(elle renvoie alors `HTTP 451`). Le projet supporte la variable `BINANCE_BASE_URL` :
il suffit de la définir dans votre `.env` vers le miroir public de données, qui
expose exactement le même endpoint `/api/v3/klines` :

```dotenv
BINANCE_BASE_URL=https://data-api.binance.vision
```

En production, définissez la même variable dans Netlify si les serveurs de votre
région sont concernés.

> Note Windows (cmd) : si vous préférez ne pas utiliser de `.env`, définissez la
> variable sur une ligne séparée avant la commande — la syntaxe Linux
> `VAR=valeur commande` **ne fonctionne pas** sous `cmd.exe` :
>
> ```bat
> set BINANCE_BASE_URL=https://data-api.binance.vision
> npm run test:local
> ```

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
