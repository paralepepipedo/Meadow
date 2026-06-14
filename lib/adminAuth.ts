// Verificacion simple del token admin.
// El token es base64(usuario:password) generado en /api/admin/login
// y guardado en sessionStorage del navegador del admin.

export function isAdminRequest(req: Request): boolean {
  const auth = req.headers.get('authorization') || '';
  if (!auth.startsWith('Bearer ')) return false;
  const token = auth.slice(7);
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf8');
    const [user, ...rest] = decoded.split(':');
    const pass = rest.join(':');
    return (
      user === process.env.ADMIN_USERNAME &&
      pass === process.env.ADMIN_PASSWORD &&
      !!user &&
      !!pass
    );
  } catch {
    return false;
  }
}
