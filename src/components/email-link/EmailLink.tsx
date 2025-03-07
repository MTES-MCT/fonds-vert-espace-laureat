export function EmailLink({ email }: { email?: string }) {
  if (!email) {
    return <span>Email non disponible</span>;
  }

  return (
    <a className="fr-link fr-link--sm" href={`mailto:${email}`}>
      {email}
    </a>
  );
}
