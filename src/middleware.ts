import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('admin_token')?.value;
  const { pathname } = request.nextUrl;

  // 1. Permitir acceso libre a la página de login
  if (pathname === '/admin') {
    // Si ya existe un token válido y visita el login, lo redirigimos al dashboard
    if (token) {
      try {
        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        await jwtVerify(token, secret);
        return NextResponse.redirect(new URL('/admin/dashboard', request.url));
      } catch (error) {
        // Token inválido (expirado), simplemente se queda en el login
      }
    }
    return NextResponse.next();
  }

  // 2. Proteger las rutas internas de administración (ej. /admin/dashboard)
  if (!token) {
    return NextResponse.redirect(new URL('/admin', request.url));
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    await jwtVerify(token, secret);
    return NextResponse.next();
  } catch (error) {
    // Token alterado o caducado al intentar acceder a rutas protegidas
    const response = NextResponse.redirect(new URL('/admin', request.url));
    response.cookies.delete('admin_token');
    return response;
  }
}

export const config = {
  matcher: [
    '/admin/:path*'
  ],
};