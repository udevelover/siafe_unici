import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  // Necesario para permitir que Supabase valide tokens del hash (#access_token)
  await supabase.auth.getSession();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Rutas públicas que no requieren autenticación
  const publicRoutes = [
    "/",
    "/login",
    "/reset-password",   // ⬅⬅ NECESARIO PARA RECOVERY
    "/api",
    "/_next"
  ];

  const path = req.nextUrl.pathname;

  // Verificar si la ruta es pública
  const isPublicRoute = publicRoutes.some(
    (route) => path === route || path.startsWith(route)
  );

  // Verificar si es un archivo estático
  const isStaticFile = path.includes(".");

  // Si no hay sesión y la ruta no es pública → redirigir a login
  if (!session && !isPublicRoute && !isStaticFile) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = "/";
    return NextResponse.redirect(redirectUrl);
  }

  // Si hay sesión y se intenta entrar al login o home → redirigir a dashboard
  if (session && path === "/") {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = "/dashboard";
    return NextResponse.redirect(redirectUrl);
  }

  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
