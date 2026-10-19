import { describe, it, expect } from "vitest";
import {
  generateRollNumber,
  generateReferralCode,
  generateInvoiceNumber,
  generateReceiptNumber,
  randomHex,
  randomAlphanumeric,
} from "./identifierGenerator.js";

describe("Identifier Generator Utilities", () => {
  describe("randomHex and randomAlphanumeric", () => {
    it("generates hexadecimal strings of specified byte length", () => {
      const hex2 = randomHex(2);
      expect(hex2).toHaveLength(4);
      expect(/^[0-9A-F]+$/.test(hex2)).toBe(true);

      const hex4 = randomHex(4);
      expect(hex4).toHaveLength(8);
      expect(/^[0-9A-F]+$/.test(hex4)).toBe(true);
    });

    it("generates alphanumeric strings of requested length", () => {
      const alpha4 = randomAlphanumeric(4);
      expect(alpha4).toHaveLength(4);
      expect(/^[0-9A-Z]+$/.test(alpha4)).toBe(true);

      const alpha8 = randomAlphanumeric(8);
      expect(alpha8).toHaveLength(8);
      expect(/^[0-9A-Z]+$/.test(alpha8)).toBe(true);
    });
  });

  describe("generateRollNumber", () => {
    it("formats roll numbers with year, clean branch code, zero-padded sequence, and entropy", () => {
      const roll = generateRollNumber(2026, "DHAKA-NORTH", 42);
      expect(roll).toMatch(/^2026-DHAKANORTH-0042-[0-9A-Z]{4}$/);
    });

    it("handles fallback branch code safely", () => {
      const roll = generateRollNumber(2026, "", 1);
      expect(roll).toMatch(/^2026-MAIN-0001-[0-9A-Z]{4}$/);
    });

    it("guarantees uniqueness across 1,000 rapid iterations", () => {
      const set = new Set<string>();
      const iterations = 1000;
      for (let i = 1; i <= iterations; i++) {
        const roll = generateRollNumber(2026, "DHK", i);
        set.add(roll);
      }
      expect(set.size).toBe(iterations);
    });
  });

  describe("generateReferralCode", () => {
    it("formats referral codes with prefix REF, year, branch, and sequence", () => {
      const code = generateReferralCode(2026, "CTG", 15);
      expect(code).toMatch(/^REF-2026-CTG-0015-[0-9A-Z]{4}$/);
    });
  });

  describe("generateInvoiceNumber", () => {
    it("formats invoice numbers with INV-YYYY prefix and counters", () => {
      const inv = generateInvoiceNumber(2026);
      expect(inv).toMatch(/^INV-2026-\d{9}-[0-9A-Z]{4}$/);
    });

    it("generates 1,000 unique invoice numbers without collision", () => {
      const set = new Set<string>();
      const iterations = 1000;
      for (let i = 0; i < iterations; i++) {
        set.add(generateInvoiceNumber(2026));
      }
      expect(set.size).toBe(iterations);
    });
  });

  describe("generateReceiptNumber", () => {
    it("formats receipt numbers with RCPT-YYYY prefix", () => {
      const rcpt = generateReceiptNumber(2026);
      expect(rcpt).toMatch(/^RCPT-2026-\d{9}-[0-9A-Z]{4}$/);
    });

    it("generates 1,000 unique receipt numbers without collision", () => {
      const set = new Set<string>();
      const iterations = 1000;
      for (let i = 0; i < iterations; i++) {
        set.add(generateReceiptNumber(2026));
      }
      expect(set.size).toBe(iterations);
    });
  });
});
