import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    // 1. Extract the authentication token from incoming request cookies
    const token = request.cookies.get('token')?.value;
    
    // 2. Determine current routing matching scopes
    const isLoginPage = request.nextUrl.pathname.startsWith('/login');
    const isAdminPage = request.nextUrl.pathname.startsWith('/admin');

    // 3. Authorization Rule: Block unauthenticated users from entering dashboard views
    if (isAdminPage && !token) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    // 4. Optimization Rule: Prevent authenticated users from returning to the login form
    if (isLoginPage && token) {
        return NextResponse.redirect(new URL('/admin/hotels', request.url));
    }

    // 5. Proceed normally if no routing constraints are violated
    return NextResponse.next();
}

// Define the route patterns that will execute this middleware layer
export const config = {
    matcher: ['/admin/:path*', '/login'],
};