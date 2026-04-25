import assert from "node:assert/strict";
import test from "node:test";

(globalThis as any).createError = (input: { statusCode: number; message: string }) => {
  const error = new Error(input.message) as Error & { statusCode: number };
  error.statusCode = input.statusCode;
  return error;
};

const { validateFilename } = await import("../server/utils/filename-validator.ts");

test("allows spaces and trims filename", () => {
  assert.equal(validateFilename(" My First Post.md "), "My First Post");
});

test("rejects path separators", () => {
  assert.throws(() => validateFilename("../bad"), /文件名|filename|只/);
  assert.throws(() => validateFilename("bad/name"), /文件名|filename|只/);
});
