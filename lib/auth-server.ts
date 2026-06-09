import { createRemoteJWKSet, jwtVerify } from "jose";

// Google's public JWK Set for securetoken (Firebase Auth)
const JWKS = createRemoteJWKSet(
  new URL("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com")
);

export interface FirebaseTokenPayload {
  uid: string;
  email?: string;
  phone_number?: string;
  name?: string;
  [key: string]: unknown;
}

/**
 * Extracts and verifies the Firebase Auth ID Token from the Request Authorization header.
 * Runs entirely server-side using standard Web Crypto via the 'jose' package.
 */
export async function verifyToken(req: Request): Promise<FirebaseTokenPayload | null> {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return null;
    }
    const token = authHeader.substring(7).trim();
    if (!token) {
      return null;
    }

    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    if (!projectId) {
      console.error("[Auth Error] NEXT_PUBLIC_FIREBASE_PROJECT_ID is not configured.");
      return null;
    }

    const { payload } = await jwtVerify(token, JWKS, {
      issuer: `https://securetoken.google.com/${projectId}`,
      audience: projectId,
    });

    if (!payload.sub) {
      return null;
    }

    return {
      uid: payload.sub,
      email: payload.email as string,
      phone_number: payload.phone_number as string,
      name: payload.name as string,
      ...payload,
    };
  } catch (error) {
    console.error("[Auth Error] Token verification failed:", error);
    return null;
  }
}

/**
 * Checks if a verified UID matches the configured admin UID
 */
export function isAdminUser(uid: string | undefined): boolean {
  if (!uid) return false;
  const adminUid = process.env.NEXT_PUBLIC_ADMIN_UID;
  return !!adminUid && uid === adminUid;
}
