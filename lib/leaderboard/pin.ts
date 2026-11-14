import "server-only";
import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";

const KEY_LENGTH = 32;

function derive(pin: string, salt: string, length = KEY_LENGTH): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(pin, salt, length, (error, key) => (error ? reject(error) : resolve(key)));
  });
}

/** A new random salt per call, so the same PIN never hashes the same twice. */
export async function hashPin(pin: string): Promise<{ pinHash: string; pinSalt: string }> {
  const pinSalt = randomBytes(16).toString("hex");
  const pinHash = (await derive(pin, pinSalt)).toString("hex");
  return { pinHash, pinSalt };
}

export async function checkPin(pin: string, record: { pinHash: string; pinSalt: string }): Promise<boolean> {
  const expected = Buffer.from(record.pinHash, "hex");
  if (expected.length === 0) return false;
  const actual = await derive(pin, record.pinSalt, expected.length);
  return timingSafeEqual(actual, expected);
}

/** Spends the same time as a real check, so an unknown name can't be told apart by timing. */
export async function burnPinCheck(pin: string): Promise<void> {
  await derive(pin, "0000000000000000");
}
