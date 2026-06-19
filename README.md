## Vert impact

### Introduction

Ce projet repose sur 4 services externes :

- [ProConnect](https://partenaires.proconnect.gouv.fr/docs/fournisseur-service/table_matieres) : identité des utilisateurs et authentification
- [Démarche Numérique](https://doc.demarche.numerique.gouv.fr/api-graphql) : dossiers de subvention et d'évaluation
- [API Fonds Vert](https://api-fonds-vert.datahub.din.developpement-durable.gouv.fr/docs) : données financières et consolidation des indicateurs
- [Grist](https://grist.numerique.gouv.fr/) : mapping entre les champs des différentes APIs

Les données projet, financières et d'identité restent hébergées sur ces services. La base PostgreSQL du projet sert uniquement à stocker les métriques d'impact consolidées par dossier.

### Prérequis

Installez :

- Node.js 24, comme indiqué dans `package.json`, `.nvmrc` et `.node-version`.
- Bun 1.3.10 ou plus récent.
- Docker Desktop avec le moteur Docker démarré, ou une base PostgreSQL accessible via `DATABASE_URL`.

### Première installation

```bash
bun install
cp .env.example .env
bun run db:up
bun run db:setup
```

`db:setup` attend que PostgreSQL réponde, puis applique les migrations Drizzle. Sans `DATABASE_URL` dans l'environnement, l'URL de développement standard est :

```env
DATABASE_URL=postgres://vert_impact:vert_impact@localhost:5432/vert_impact
```

La base de test standard est `vert_impact_test` avec le même rôle `vert_impact`.

Complétez ensuite les variables externes dans `.env` selon les services que vous voulez appeler réellement. La page de démonstration et les tests n'ont pas besoin de vrais identifiants ProConnect, Démarches Simplifiées, Fonds Vert ou Grist. Le fichier `.env.test` publié contient les valeurs factices nécessaires aux tests.

### Développement

Lancez le serveur de développement :

```bash
bun run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000) avec votre navigateur pour voir le résultat.

### Tests

En activant le mode `testProxy` de Next, les appels API côté serveur peuvent être interceptés par MSW. Lancez le serveur de développement en activant ce proxy :

```bash
bun run dev:test
```

Cette commande est optionnelle. Elle permet notamment d'exécuter plus rapidement les tests par la suite.

Lancez les tests avec Playwright :

```bash
bun run test
```

`bun run test` prépare la base de test, lance les migrations, puis exécute Playwright. Playwright réutilise un serveur éventuellement déjà disponible sur le port 4000, sinon il lance `bun run dev:test` avant. Le serveur de test utilise `.next-test` pour ne pas perturber un `bun run dev` déjà lancé sur le port 3000.

Lancez un test spécifique :

```bash
bun run test tests/dossier.spec.ts
```

### Déploiement Scalingo

Le projet est prêt pour le buildpack Node.js Scalingo. Le runtime Node est fixé dans `package.json` via `engines.node`.

Le fichier `Procfile` définit deux processus :

```Procfile
web: npm run start -- -p $PORT
postdeploy: npm run db:migrate:deploy
```

`web` lance Next.js sur le port injecté par Scalingo. `postdeploy` applique les migrations Drizzle après un déploiement réussi, dans le conteneur de la nouvelle version, avant le changement de trafic.

Le hook Scalingo utilise `db:migrate:deploy`, un script Node basé sur `drizzle-orm/postgres-js/migrator`. Il ne dépend pas de `drizzle-kit`, car Scalingo peut retirer les `devDependencies` après le build.

Ajouter l'addon PostgreSQL Scalingo suffit pour exposer `DATABASE_URL` à l'application. Scalingo crée aussi `SCALINGO_POSTGRESQL_URL`, dont `DATABASE_URL` est l'alias PostgreSQL standard.

### Guide

#### Mode par défaut

Vert impact est accessible via :

- [/projets](http://localhost:3000/projets)

L'utilisateur se connecte via ProConnect. Nous récupérons tous les dossiers associés à son numéro de SIRET via l'API Fonds Vert. Nous n'affichons que les dossiers rattachés à l'adresse email de l'utilisateur connecté. Seuls les utilisateurs connectés avec une adresse email vérifiée par ProConnect peuvent accéder à Vert impact.

Il est possible d'accéder directement à un dossier :

- [/projets/1234567](http://localhost:3000/projets/1234567)

Cette URL d'accès direct peut être utilisée, par exemple, dans les communications par email. Elle est également utile pour les administrateurs de la plateforme.

#### Mode administrateur

Si votre compte a un rôle administrateur, vous pouvez visualiser les dossiers des lauréats. Vous pouvez également accéder à tous les dossiers associés à un numéro de SIRET :

- [/projets?siret=1234567891011](http://localhost:3000/projets?siret=1234567891011)

#### Mode démo

Une page de démonstration, ne nécessitant ni token ni compte ProConnect, est disponible :

- [/projets/demo](http://localhost:3000/projets/demo)
