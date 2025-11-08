import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { verifyToken } from "@/lib/jwt"

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Protect API routes except auth endpoints
  if (pathname.startsWith("/api") && !pathname.startsWith("/api/auth")) {
    const token = request.cookies.get("auth_token")?.value
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    try {
      await verifyToken(token)
    } catch {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const resp = NextResponse.next()
    // Set security headers below
    resp.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
    resp.headers.set("X-Frame-Options", "DENY")
    resp.headers.set("X-Content-Type-Options", "nosniff")
    resp.headers.set("X-XSS-Protection", "1; mode=block")
    resp.headers.set(
      "Content-Security-Policy",
      "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self'",
    )
    resp.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")
    resp.headers.set(
      "Permissions-Policy",
      "camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()",
    )
    resp.headers.set("Access-Control-Allow-Origin", "*")
    resp.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
    resp.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-CSRF-Token")
    return resp
  }

  const response = NextResponse.next()

  // Security Headers
  response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
  response.headers.set("X-Frame-Options", "DENY")
  response.headers.set("X-Content-Type-Options", "nosniff")
  response.headers.set("X-XSS-Protection", "1; mode=block")
  response.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self'",
  )
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()",
  )

  // CORS Headers
  response.headers.set("Access-Control-Allow-Origin", "*")
  response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
  response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-CSRF-Token")

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
}
