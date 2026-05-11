import jwt from "jsonwebtoken";

export interface UserJwtPayload {
  userId: string;
  isProfileComplete: boolean;
  email?: string | null;
  phoneNumber?: string;
  firstName?: string | null;
  lastName?: string | null;
  companyName?: string | null;
  panCard?: string | null;
}

function readUserJwtPayload(decoded: object): UserJwtPayload | null {
  const o = decoded as Record<string, unknown>;
  const userId = o.userId;
  if (typeof userId !== "string") return null;
  const isProfileComplete = o.isProfileComplete;
  if (typeof isProfileComplete !== "boolean") return null;

  const payload: UserJwtPayload = {
    userId,
    isProfileComplete,
  };
  if ("email" in o && (typeof o.email === "string" || o.email === null)) {
    payload.email = o.email as string | null;
  }
  if (typeof o.phoneNumber === "string") payload.phoneNumber = o.phoneNumber;
  if (typeof o.firstName === "string" || o.firstName === null) {
    payload.firstName = o.firstName as string | null;
  }
  if (typeof o.lastName === "string" || o.lastName === null) {
    payload.lastName = o.lastName as string | null;
  }
  if (typeof o.companyName === "string" || o.companyName === null) {
    payload.companyName = o.companyName as string | null;
  }
  if (typeof o.panCard === "string" || o.panCard === null) {
    payload.panCard = o.panCard as string | null;
  }
  return payload;
}

export function generateToken(payload: UserJwtPayload): string {
  return jwt.sign(payload, process.env.JWT_SECRET as string, { expiresIn: "8h" });
}

export function verifyToken(token: string): UserJwtPayload | null {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
    if (typeof decoded !== "object" || decoded === null) return null;
    return readUserJwtPayload(decoded);
  } catch {
    return null;
  }
}
