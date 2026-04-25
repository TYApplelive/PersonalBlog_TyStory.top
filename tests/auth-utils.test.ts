import assert from "node:assert/strict";
import test from "node:test";

const { normalizeUsername } = await import("../server/utils/auth.ts");

test("normalizes username by trim + lowercase", () => {
  assert.equal(normalizeUsername(" Admin "), "admin");
  assert.equal(normalizeUsername("User_01"), "user_01");
});

test("empty input normalized to empty string", () => {
  assert.equal(normalizeUsername("   "), "");
});
