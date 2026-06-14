import "dotenv/config";
import { generateKeyPair, exportJWK, createLocalJWKSet, SignJWT, type JWTVerifyGetKey } from "jose";

export async function makeTestAuth(): Promise<{
  testJwks: JWTVerifyGetKey;
  createTestJWT: (userId: string) => Promise<string>;
}> {
  const { privateKey, publicKey } = await generateKeyPair("RS256");
  const testJwks = createLocalJWKSet({ keys: [await exportJWK(publicKey)] });
  const issuer = process.env.BETTER_AUTH_URL ?? "http://localhost:3001";

  async function createTestJWT(userId: string): Promise<string> {
    return new SignJWT({ sub: userId })
      .setProtectedHeader({ alg: "RS256" })
      .setIssuer(issuer)
      .setAudience(issuer)
      .setExpirationTime("1h")
      .sign(privateKey);
  }

  return { testJwks, createTestJWT };
}
