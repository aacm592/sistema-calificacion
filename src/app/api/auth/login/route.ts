import { SignJWT } from 'jose';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { password } = await request.json();
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (password === adminPassword) {
      // Codificamos la clave secreta
      const secret = new TextEncoder().encode(process.env.JWT_SECRET);
      
      // Creamos el JWT
      const token = await new SignJWT({ role: 'admin' })
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime('8h') // El token expira en 8 horas
        .sign(secret);

      // Preparamos la respuesta y seteamos la cookie HTTP-Only
      const response = NextResponse.json({ success: true });
      response.cookies.set('admin_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 8, // 8 horas en segundos
        path: '/',
      });

      return response;
    }

    return NextResponse.json(
      { success: false, message: 'Contraseña incorrecta' }, 
      { status: 401 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' }, 
      { status: 500 }
    );
  }
}