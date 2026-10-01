import argon2 from "argon2";
import { randomBytes } from "node:crypto";

const options = {
  type: argon2.argon2id,
  memoryCost: 19_456,
  timeCost: 2,
  parallelism: 1,
} as const;

let dummyHash: Promise<string> | undefined;

export function hashPassword(password: string) {
  return argon2.hash(password, options);
}

export async function verifyPassword(hash: string, password: string) {
  try {
    return await argon2.verify(hash, password);
  } catch {
    return false;
  }
}

export function verifyAgainstDummy(password: string) {
  dummyHash ??= hashPassword(randomBytes(32).toString("base64url"));
  return dummyHash.then((hash) => verifyPassword(hash, password));
}
