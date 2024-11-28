## Fonds vert

### Installation

```bash
npm i
```

Copiez le fichier `.env.example` en `.env` et renseignez les variables d'environnement.

### Développement

Lancez le serveur de développement :

```bash
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000) avec votre navigateur pour voir le résultat.

### Guide

#### Mode par défaut

L'espace lauréat est accessible via :

- [/espace-laureat](http://localhost:3000/espace-laureat)

L'utilisateur se connecte via ProConnect. Nous récupérons tous les dossiers associés à son numéro de SIRET via l'API
Fonds Vert. Nous n'affichons que les dossiers rattachés à l'adresse email de l'utilisateur connecté. Seuls les
utilisateurs connectés avec une adresse email vérifiée par ProConnect peuvent accéder à l'espace lauréat.

Il est possible d'accéder directement à un ou plusieurs dossiers :

- [/espace-laureat?dossier=1234567&dossier=567890](http://localhost:3000/espace-laureat?dossier=1234567&dossier=567890)

Cette URL d'accès direct peut être utilisée, par exemple, dans les communications par email. Elle est également utile
pour les administrateurs de la plateforme.

#### Mode administrateur

Si votre compte a un rôle administrateur, vous pouvez visualiser les dossiers des lauréats. Vous pouvez également
accéder à tous les dossiers associés à un numéro de SIRET :

- [/espace-laureat?siret=1234567891011](http://localhost:3000/espace-laureat?siret=1234567891011)

#### Mode démo

Une page de démonstration, ne nécessitant ni token ni compte ProConnect, est disponible :

- [/espace-laureat/demo](http://localhost:3000/espace-laureat/demo)
