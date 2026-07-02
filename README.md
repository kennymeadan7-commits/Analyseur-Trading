# Analyseur-Trading

Site d'analyse de marché **serverless** déployé sur **Netlify**. Il expose une page web qui interroge, à la demande, une fonction Netlify. Celle-ci récupère les données OHLCV depuis l'API publique de Binance, calcule des indicateurs techniques (RSI, EMA 50, EMA 200) et en déduit un signal (`ACHAT`, `VENTE` ou `NEUTRE`).

## Architecture

```
public/
└── index.html            # Interface web (page d'analyse)
netlify/
└── functions/
    ├── analyze.ts         # Endpoint HTTP (orchestration + handler)
    └── lib/
        ├── config.ts      # Chargement/validation des variables d'env
        ├── binance.ts     # Récupération OHLCV via l'API Binance (axios)
        ├── indicators.ts  # Calcul RSI(14), EMA(50), EMA(200)
        ├── decision.ts    # Algorithme decideSignal()
        └── types.ts       # Types partagés (typage strict)
scripts/
└── test-local.ts         # Runner de test local (flux complet)
netlify.toml              # Config Netlify (site statique + fonctions + redirect)
tsconfig.json             # TypeScript en mode strict
package.json              # Dépendances
```

Le code est **modulaire** : chaque responsabilité est isolée dans un module dédié, ce qui garantit un démarrage rapide (cold start).

## Fonctionnement

1. La page `public/index.html` appelle l'endpoint `/api/analyze` (redirigé vers la fonction Netlify).
2. On peut choisir la paire et l'intervalle ; ils sont transmis en query string, ex :
   `/api/analyze?symbol=ETHUSDT&interval=1h`.
3. La fonction renvoie un JSON contenant le prix, le RSI, les EMA et le signal.

## Algorithme de décision

La fonction `decideSignal()` applique les règles suivantes :

| Signal   | Condition                          | Interprétation                 |
| -------- | ---------------------------------- | ------------------------------ |
| `ACHAT`  | `RSI < 30` **ET** `Prix > EMA 200` | Survente en tendance haussière |
| `VENTE`  | `RSI > 70` **ET** `Prix < EMA 200` | Surachat en tendance baissière |
| `NEUTRE` | Tous les autres cas                | Aucun signal                   |

## Prérequis

- Node.js ≥ 18
- Un compte Netlify (pour le déploiement)

## Installation

```bash
npm install
```

## Variables d'environnement (optionnelles)

Copiez `.env.example` en `.env` (local) ou configurez-les dans Netlify
(**Site settings → Environment variables**) :

| Variable           | Requis | Défaut                     | Description                                |
| ------------------ | ------ | -------------------------- | ------------------------------------------ |
| `SYMBOL`           | Non    | `BTCUSDT`                  | Paire analysée par défaut                  |
| `INTERVAL`         | Non    | `15m`                      | Intervalle des bougies par défaut          |
| `BINANCE_BASE_URL` | Non    | `https://api.binance.com`  | URL de base de l'API (voir géo-blocage)    |

## Développement local

Le runner local charge automatiquement un fichier `.env` (via `dotenv`).
**Aucune variable à saisir en ligne de commande** — méthode recommandée,
notamment sous Windows.

```bash
# 1. Créer votre fichier de config local
#    (Windows: copy .env.example .env  |  macOS/Linux: cp .env.example .env)
cp .env.example .env

# 2. Vérifier le typage strict
npm run typecheck

# 3. Exécuter le flux d'analyse en console (Binance -> indicateurs -> décision)
npm run test:local

# 4. Lancer le site complet en local (page + fonction) via Netlify CLI
npm run dev
# puis ouvrez http://localhost:8888
```

### Géo-blocage Binance (HTTP 451)

L'API principale `api.binance.com` est bloquée dans certaines régions/datacenters
(elle renvoie alors `HTTP 451`). Le projet supporte la variable `BINANCE_BASE_URL` :
définissez-la dans votre `.env` vers le miroir public de données, qui expose
exactement le même endpoint `/api/v3/klines` :

```dotenv
BINANCE_BASE_URL=https://data-api.binance.vision
```

En production, définissez la même variable dans Netlify si les serveurs de votre
région sont concernés.

> Note Windows (cmd) : la syntaxe Linux `VAR=valeur commande` **ne fonctionne pas**
> sous `cmd.exe`. Préférez le fichier `.env`, ou définissez la variable sur une
> ligne séparée : `set BINANCE_BASE_URL=https://data-api.binance.vision`.

## Déploiement

```bash
npm run deploy
```

Ou connectez le dépôt à Netlify (**Add new site → Import from Git**) : la config
`netlify.toml` publie le contenu de `public/` et déploie automatiquement la fonction.

## Dépendances principales

- [`@netlify/functions`](https://www.npmjs.com/package/@netlify/functions) — types du handler HTTP
- [`axios`](https://www.npmjs.com/package/axios) — requêtes HTTP vers Binance
- [`technicalindicators`](https://www.npmjs.com/package/technicalindicators) — calcul RSI / EMA

## Avertissement

Ce projet est fourni à des fins éducatives. Il ne constitue pas un conseil financier.
Le trading comporte des risques ; utilisez-le à vos propres risques.
