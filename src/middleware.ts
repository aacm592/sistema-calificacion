import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

export async function middleware(request: NextRequest) {
  // Obtenemos la cookie del token
  const token = request.cookies.get('admin_token')?.value;

  // Si no hay token, redirigimos al login
  if (!token) {
    return NextResponse.redirect(new URL('/admin', request.url));
  }

  try {
    // Verificamos el token usando la misma clave secreta
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    await jwtVerify(token, secret);
    
    // Si es válido, permitimos el paso
    return NextResponse.next();
  } catch (error) {
    // Si el token expiró o fue alterado, lo borramos y redirigimos
    const response = NextResponse.redirect(new URL('/admin', request.url));
    response.cookies.delete('admin_token');
    return response;
  }
}

// Configuración para indicar en qué rutas se debe ejecutar este middleware
export const config = {
  matcher: [
    // Protege todas las rutas hijas de /admin, por ejemplo: /admin/dashboard
    '/admin/:path*'
  ],
};