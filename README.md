## Vert impact

### Introduction

Ce projet repose sur 4 services externes :

- [ProConnect](https://partenaires.proconnect.gouv.fr/docs/fournisseur-service/table_matieres) : identité des utilisateurs et authentification
- [Démarche Numérique](https://doc.demarche.numerique.gouv.fr/api-graphql) : dossiers de subvention et d'évaluation
- [API Fonds Vert](https://api-fonds-vert.datahub.din.developpement-durable.gouv.fr/docs) : données financières et consolidation des indicateurs
- [Grist](https://grist.numerique.gouv.fr/) : mapping entre les champs des différentes APIs

Les données projet, financières et d'identité restent hébergées sur ces services. La base PostgreSQL du projet conserve les métriques d'impact et leurs révisions, les pages figées des exports de corrections et leur état d'admission partagé.

### Prérequis

- Node.js 24
- npm 11.16.0
- Docker Desktop avec le moteur Docker démarré, ou une base PostgreSQL accessible via `DATABASE_URL`.

### Première installation

```bash
npm ci
cp .env.example .env
npm run db:up
npm run db:setup
```

Note : `db:setup` applique les migrations Drizzle.

Dans la configuration de votre service ProConnect, déclarer les URL de retour.
Par exemple, avec `NEXT_PUBLIC_BASE_URL=https://example.org` dans `.env` :

- connexion : `https://example.org/api/auth/proconnect/login-callback` ;
- déconnexion : `https://example.org/api/auth/proconnect/logout-callback`.

### Développement

Lancez le serveur de développement :

```bash
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000) avec votre navigateur pour voir le résultat.

### Tests

En activant le mode `testProxy` de Next, les appels API côté serveur peuvent être interceptés par MSW. Lancez le serveur de développement en activant ce proxy :

```bash
npm run dev:test
```

Cette commande est optionnelle. Elle permet notamment d'exécuter plus rapidement les tests par la suite.

Lancez les tests avec Playwright :

```bash
npm run test
```

`npm run test` prépare la base de test, lance les migrations, puis exécute Playwright. Playwright réutilise un serveur éventuellement déjà disponible sur le port 4000, sinon il lance `npm run dev:test` avant. Le serveur de test utilise `.next-test` pour ne pas perturber un `npm run dev` déjà lancé sur le port 3000.

Lancez un test spécifique :

```bash
npm run test -- tests/dossier.spec.ts
```

### Déploiement Scalingo

Le projet fournit un buildpack Node.js pour Scalingo.

Note : un script `postdeploy` applique les migrations Drizzle après déploiement.

### Guide

#### Mode par défaut

Vert impact est accessible via :

- [/projets](http://localhost:3000/projets)

Après connexion via ProConnect, l’application retrouve les dossiers à partir du
SIRET et de l’adresse email. Les droits de lecture et de correction sont vérifiés
auprès de Démarche Numérique : porteur, instructeur autorisé ou administrateur,
pour un dossier de personne morale.

Les corrections locales prennent effet immédiatement et priment sur les valeurs
importées de Fonds Vert.

Il est possible d'accéder directement à un dossier :

- [/projets/1234567](http://localhost:3000/projets/1234567)

Cette URL d'accès direct peut être utilisée, par exemple, dans les communications par email. Elle est également utile pour les administrateurs de la plateforme.

#### Mode administrateur

Si votre compte a un rôle administrateur, vous pouvez visualiser les dossiers des lauréats. Vous pouvez également accéder à tous les dossiers associés à un numéro de SIRET :

- [/projets?siret=1234567891011](http://localhost:3000/projets?siret=1234567891011)

#### Mode démo

La démonstration utilise des données synthétiques, exclues des exports réels.
Elle est accessible sans token ni compte ProConnect :

- [/projets/demo](http://localhost:3000/projets/demo)

### API des corrections Fonds Vert

`GET /api/v1/corrections` exporte les dernières corrections locales par champ
et dossier, hors imports seuls et démonstration. L’accès nécessite une clé machine
et une adresse IP autorisée.

[Documentation OpenAPI](openapi/corrections.json)
