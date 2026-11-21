import assert from "node:assert/strict";
import test, { describe } from "node:test";
import { evaluateStaleStatus, formatRelativeTime } from "../scripts/sync-good-first-issues.js";

describe("Good First Issues & Matchmaker Sync Suite", () => {
  test("formatRelativeTime formats historical timestamps into human strings", () => {
    const nowIso = new Date().toISOString();
    assert.strictEqual(formatRelativeTime(nowIso), "just now");

    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
    assert.strictEqual(formatRelativeTime(twoDaysAgo), "2d ago");

    const twoMonthsAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString();
    assert.strictEqual(formatRelativeTime(twoMonthsAgo), "2mo ago");
  });

  test("evaluateStaleStatus flags repos inactive for more than 180 days", () => {
    const recent = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString();
    const recentEval = evaluateStaleStatus(recent);
    assert.strictEqual(recentEval.isStale, false);
    assert.strictEqual(recentEval.daysInactive, 10);

    const old = new Date(Date.now() - 200 * 24 * 60 * 60 * 1000).toISOString();
    const oldEval = evaluateStaleStatus(old);
    assert.strictEqual(oldEval.isStale, true);
    assert.ok(oldEval.daysInactive >= 200);
    assert.ok(oldEval.reason?.includes("inactive"));
  });
});
