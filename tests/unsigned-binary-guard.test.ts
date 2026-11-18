import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { evaluateBinaryTrustPolicy } from "../scripts/binary-trust-policy.js";

test("Phase 6 (SEC-06): Unsigned native OS binaries are denied Verified/Featured status", () => {
  const unsignedAttempt = evaluateBinaryTrustPolicy({
    name: "LeanFPS",
    category: "OS & Hardware Utilities",
    description: "Open-source Windows performance utility distributing unsigned .exe binaries.",
    nativeBinary: true,
    codeSigned: false,
    featured: true,
    statusTags: ["Verified"],
  });

  assert.equal(unsignedAttempt.isNativeBinary, true);
  assert.equal(unsignedAttempt.isSigned, false);
  assert.equal(unsignedAttempt.allowedVerifiedBadge, false);
  assert.equal(unsignedAttempt.warningLabel, "[UNVERIFIED BINARY - UNSIGNED]");
  assert.ok(unsignedAttempt.errors.length > 0);
});

test("Phase 6 (SEC-06): Code-signed native binaries pass trust policy cleanly", () => {
  const signedTool = evaluateBinaryTrustPolicy({
    name: "SignedSysTool",
    category: "OS & Hardware Utilities",
    description: "Authenticode-signed Windows utility.",
    nativeBinary: true,
    codeSigned: true,
    featured: true,
  });

  assert.equal(signedTool.isNativeBinary, true);
  assert.equal(signedTool.isSigned, true);
  assert.equal(signedTool.allowedVerifiedBadge, true);
  assert.equal(signedTool.errors.length, 0);
});

test("Phase 6 (SEC-06): LeanFPS entry in shelf/cli-tools.json carries explicit unsigned binary warning", () => {
  const cliTools = JSON.parse(
    readFileSync(join(process.cwd(), "shelf", "cli-tools.json"), "utf8"),
  ) as Array<Record<string, unknown>>;
  const leanfps = cliTools.find((item) => item.name === "LeanFPS");
  assert.ok(leanfps, "LeanFPS entry should exist in shelf/cli-tools.json");
  assert.equal(leanfps.featured, false);
  assert.equal(leanfps.codeSigned, false);
  assert.equal(leanfps.securityWarning, "[UNVERIFIED BINARY - UNSIGNED]");
});
