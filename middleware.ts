import { NextResponse, type NextRequest } from 'next/server'

// PREVIEW MODE: auth checks bypassed so UI can be browsed without Supabase
// TODO: restore full middleware after Supabase is configured
export async function middleware(request: NextRequest) {
  return NextResponse.next({ request })
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
