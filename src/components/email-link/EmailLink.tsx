interface EmailLinkProps {
  email?: string;
  "data-testid"?: string;
}

export function EmailLink({ email, "data-testid": testId }: EmailLinkProps) {
  if (!email) {
    return <span data-testid={testId}>Email non disponible</span>;
  }

  return (
    <a
      className="fr-link fr-link--sm"
      href={`mailto:${email}`}
      data-testid={testId}
    >
      {email}
    </a>
  );
}
