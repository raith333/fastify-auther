import jwt from "jsonwebtoken";

type Claims = {
  sub: string;
  jti: string;
  type: "access" | "refresh";
};

export function verifyJwt(
  token: string,
  secret: string,
  issuer: string,
  audience: string
): Claims {
  return jwt.verify(token, secret, { issuer, audience }) as Claims;
}
