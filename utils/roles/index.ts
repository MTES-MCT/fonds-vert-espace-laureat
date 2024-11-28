export function isAdmin({ userEmail }: { userEmail: string }): boolean {
  const adminEmails = process.env.ADMIN_EMAILS?.split(",") ?? [];

  return adminEmails.includes(userEmail);
}
