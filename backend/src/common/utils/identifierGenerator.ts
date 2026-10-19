import crypto from "crypto";

let invoiceCounter = 0;
let receiptCounter = 0;

/**
 * Generates secure random hexadecimal string of specified byte length.
 */
export function randomHex(bytes: number = 2): string {
  return crypto.randomBytes(bytes).toString("hex").toUpperCase();
}

/**
 * Generates cryptographically secure alphanumeric characters.
 */
export function randomAlphanumeric(length: number = 4): string {
  const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let result = "";
  const randomBytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    result += chars[randomBytes[i] % chars.length];
  }
  return result;
}

/**
 * Generates a collision-resistant student roll number.
 * Format: YYYY-BRANCH-0001-A1B2
 */
export function generateRollNumber(
  year: number = new Date().getFullYear(),
  branchCode: string = "MAIN",
  sequenceNumber: number = 1
): string {
  const cleanCode = (branchCode || "MAIN").trim().toUpperCase().replace(/[^A-Z0-9]/g, "") || "BR";
  const seq = Math.max(1, sequenceNumber).toString().padStart(4, "0");
  const entropy = randomAlphanumeric(4);
  return `${year}-${cleanCode}-${seq}-${entropy}`;
}

/**
 * Generates a collision-resistant student referral code.
 * Format: REF-YYYY-BRANCH-0001-A1B2
 */
export function generateReferralCode(
  year: number = new Date().getFullYear(),
  branchCode: string = "MAIN",
  sequenceNumber: number = 1
): string {
  const cleanCode = (branchCode || "MAIN").trim().toUpperCase().replace(/[^A-Z0-9]/g, "") || "BR";
  const seq = Math.max(1, sequenceNumber).toString().padStart(4, "0");
  const entropy = randomAlphanumeric(4);
  return `REF-${year}-${cleanCode}-${seq}-${entropy}`;
}

/**
 * Generates a collision-resistant invoice identifier.
 * Format: INV-YYYY-XXXXX-YYYY
 */
export function generateInvoiceNumber(year: number = new Date().getFullYear()): string {
  invoiceCounter = (invoiceCounter + 1) % 100000;
  const timeSlice = Date.now().toString().slice(-4);
  const seq = invoiceCounter.toString().padStart(5, "0");
  const entropy = randomAlphanumeric(4);
  return `INV-${year}-${timeSlice}${seq}-${entropy}`;
}

/**
 * Generates a collision-resistant receipt identifier.
 * Format: RCPT-YYYY-XXXXX-YYYY
 */
export function generateReceiptNumber(year: number = new Date().getFullYear()): string {
  receiptCounter = (receiptCounter + 1) % 100000;
  const timeSlice = Date.now().toString().slice(-4);
  const seq = receiptCounter.toString().padStart(5, "0");
  const entropy = randomAlphanumeric(4);
  return `RCPT-${year}-${timeSlice}${seq}-${entropy}`;
}

