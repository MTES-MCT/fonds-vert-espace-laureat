import Link from "next/link";

interface ErrorProps {
  title: string;
  description: string;
}

export default function Error({ title, description }: ErrorProps) {
  return (
    <div className={`fr-grid-row fr-grid-row--gutters fr-grid-row--middle`}>
      <div className="fr-py-0 fr-col-12 fr-col-md-6">
        <h1>{title}</h1>
        <p className="fr-text--lead fr-mb-3w">{description}</p>
        <p className="fr-text--sm fr-mb-5w">
          Si vous avez tapé l'adresse web dans le navigateur, vérifiez qu'elle
          est correcte. La page n'est peut-être plus disponible.
          <br />
          Dans ce cas, pour continuer votre visite vous pouvez consulter notre
          page d'accueil, ou effectuer une recherche avec notre moteur de
          recherche en haut de page.
          <br />
          Sinon contactez-nous pour que l'on puisse vous rediriger vers la bonne
          information.
        </p>
        <ul className="fr-btns-group fr-btns-group--inline-md">
          <li>
            <Link className="fr-btn" href="/">
              Page d'accueil
            </Link>
          </li>
          <li>
            <a
              className="fr-btn fr-btn--secondary"
              href="[� MODIFIER - lien vers un formulaire de contact]"
            >
              Contactez-nous
            </a>
          </li>
        </ul>
      </div>
      <div className="fr-col-12 fr-col-md-3 fr-col-offset-md-1 fr-px-6w fr-px-md-0 fr-py-0">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="fr-responsive-img fr-artwork"
          aria-hidden="true"
          width="160"
          height="200"
          viewBox="0 0 160 200"
        >
          <use
            className="fr-artwork-motif"
            href="/artwork/ovoid.svg#artwork-motif"
          ></use>
          <use
            className="fr-artwork-background"
            href="/artwork/ovoid.svg#artwork-background"
          ></use>
          <g transform="translate(40, 60)">
            <use
              className="fr-artwork-decorative"
              href="/artwork/technical-error.svg#artwork-decorative"
            ></use>
            <use
              className="fr-artwork-minor"
              href="/artwork/technical-error.svg#artwork-minor"
            ></use>
            <use
              className="fr-artwork-major"
              href="/artwork/technical-error.svg#artwork-major"
            ></use>
          </g>
        </svg>
      </div>
    </div>
  );
}
