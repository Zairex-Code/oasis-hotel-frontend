/**
 * @file middleware.ts
 * @description Edge-runtime security interceptor for Next.js.
 * Operates before a request is completed, verifying the existence of the JWT HTTP Cookie.
 * Enforces Role-Based Access Control (RBAC) bounding rules at the router level.
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    // 1. Extract the secure HTTP-Only/Standard cookie injected by AuthContext during login
    const token = request.cookies.get('token')?.value;
    
    const isLoginPage = request.nextUrl.pathname.startsWith('/login');
    const isAdminPage = request.nextUrl.pathname.startsWith('/admin');

    // 2. AUTHORIZATION RULE: Block unauthenticated traffic from entering private dashboard routes
    if (isAdminPage && !token) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    // 3. UX OPTIMIZATION RULE: Prevent authenticated users from accessing the login screen
    if (isLoginPage && token) {
        return NextResponse.redirect(new URL('/admin/hotels', request.url));
    }

    // 4. Fallback: Proceed normally
    return NextResponse.next();
}

/**
 * Route Matcher Configuration
 * Defines which path topologies should trigger this edge-runtime middleware.
 */
export const config = {
    matcher: ['/admin/:path*', '/login'],
};