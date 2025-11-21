import Link from "next/link";

export default function Home() {
  return (
    <div className="fr-container my-8 pt-2 pb-12">
      <div className="max-w-2xl">
        <h1>Accélérer la transition écologique dans les territoires</h1>
        <p className="fr-text--lead">
          Porté par le Ministère de la Transition écologique et de la Cohésion
          des territoires, le Fonds d'accélération de la transition écologique
          dans les territoires, aussi appelé « Fonds vert », aide les
          collectivités à renforcer leur performance environnementale, adapter
          leur territoire au changement climatique et améliorer leur cadre de
          vie.{" "}
          <a target="_blank" href="https://www.ecologie.gouv.fr/fonds-vert">
            En&nbsp;savoir&nbsp;plus
          </a>
        </p>
        <p>
          Vous êtes porteur d'un projet lauréat du Fonds vert ? Accédez à votre{" "}
          <Link href="/espace-laureat">espace lauréat</Link>.
        </p>
      </div>
    </div>
  );
}
