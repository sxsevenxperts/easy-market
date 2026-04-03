import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_ROUTES = ['/login', '/signup', '/forgot-password'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Ignorar arquivos estáticos e rotas de API internas
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/icons') ||
    pathname.startsWith('/manifest') ||
    pathname.endsWith('.png') ||
    pathname.endsWith('.svg') ||
    pathname.endsWith('.ico')
  ) {
    return NextResponse.next();
  }

  // Rotas públicas — sempre liberadas
  if (PUBLIC_ROUTES.includes(pathname)) {
    return NextResponse.next();
  }

  // TODO: Ativar proteção de rotas quando o backend retornar um cookie 'session'.
  // Atualmente o login usa apenas localStorage, que não é acessível no middleware SSR.
  // Passo 1: Ao fazer login, setar um cookie httpOnly 'session' no servidor.
  // Passo 2: Descomentar o bloco abaixo.
  //
  // const sessionCookie = request.cookies.get('session');
  // if (!sessionCookie?.value) {
  //   const loginUrl = new URL('/login', request.url);
  //   loginUrl.searchParams.set('redirect', pathname);
  //   return NextResponse.redirect(loginUrl);
  // }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Aplicar em todas as rotas exceto:
     * - _next/static (arquivos estáticos)
     * - _next/image (otimização de imagens)
     * - favicon
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
