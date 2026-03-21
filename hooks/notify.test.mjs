/**
 * notify.test.mjs — Unit tests for notify.mjs
 *
 * Run: node --test hooks/notify.test.mjs
 *      npm test
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { getArg, parseHookData, extractHookFields, buildNotification, EMOJI } from "./notify.mjs";

// ── getArg ────────────────────────────────────────────────────────────────────
describe("getArg", () => {
  it("returns value for present flag", () => {
    assert.equal(getArg(["--title", "Hello"], "--title"), "Hello");
  });

  it("returns value when other flags precede it", () => {
    assert.equal(getArg(["--message", "hi", "--title", "World"], "--title"), "World");
  });

  it("returns null for absent flag", () => {
    assert.equal(getArg(["--message", "hi"], "--title"), null);
  });

  it("returns null when flag is the last argument (no value follows)", () => {
    assert.equal(getArg(["--title"], "--title"), null);
  });

  it("returns null for empty argv", () => {
    assert.equal(getArg([], "--title"), null);
  });
});

// ── parseHookData ─────────────────────────────────────────────────────────────
describe("parseHookData", () => {
  it("parses a valid JSON object", () => {
    assert.deepEqual(parseHookData('{"stop_reason":"end_turn"}'), { stop_reason: "end_turn" });
  });

  it("returns empty object for empty string", () => {
    assert.deepEqual(parseHookData(""), {});
  });

  it("returns empty object for whitespace-only string", () => {
    assert.deepEqual(parseHookData("   "), {});
  });

  it("returns empty object for invalid JSON", () => {
    assert.deepEqual(parseHookData("not-json"), {});
  });

  it("returns empty object for JSON array", () => {
    assert.deepEqual(parseHookData("[1,2,3]"), {});
  });

  it("returns empty object for JSON null", () => {
    assert.deepEqual(parseHookData("null"), {});
  });

  it("returns empty object for JSON string primitive", () => {
    assert.deepEqual(parseHookData('"hello"'), {});
  });

  it("returns empty object for JSON number", () => {
    assert.deepEqual(parseHookData("42"), {});
  });
});

// ── extractHookFields ─────────────────────────────────────────────────────────
describe("extractHookFields", () => {
  it("extracts valid string fields", () => {
    assert.deepEqual(
      extractHookFields({ stop_reason: "end_turn", session_id: "abc12345" }),
      { stopReason: "end_turn", sessionId: "abc12345" }
    );
  });

  it("truncates session_id to 8 characters", () => {
    const { sessionId } = extractHookFields({ session_id: "abcdefghijklmnop" });
    assert.equal(sessionId, "abcdefgh");
  });

  it("falls back to 'completed' for missing stop_reason", () => {
    const { stopReason } = extractHookFields({});
    assert.equal(stopReason, "completed");
  });

  it("falls back to 'completed' for non-string stop_reason (number)", () => {
    const { stopReason } = extractHookFields({ stop_reason: 42 });
    assert.equal(stopReason, "completed");
  });

  it("falls back to 'completed' for non-string stop_reason (object)", () => {
    const { stopReason } = extractHookFields({ stop_reason: {} });
    assert.equal(stopReason, "completed");
  });

  it("falls back to 'completed' for non-string stop_reason (array)", () => {
    const { stopReason } = extractHookFields({ stop_reason: ["end_turn"] });
    assert.equal(stopReason, "completed");
  });

  it("falls back to 'unknown' for missing session_id", () => {
    const { sessionId } = extractHookFields({});
    assert.equal(sessionId, "unknown");
  });

  it("falls back to 'unknown' for null session_id", () => {
    const { sessionId } = extractHookFields({ session_id: null });
    assert.equal(sessionId, "unknown");
  });

  it("falls back to 'unknown' for empty string session_id", () => {
    const { sessionId } = extractHookFields({ session_id: "" });
    assert.equal(sessionId, "unknown");
  });

  it("falls back to 'unknown' for non-string session_id (number)", () => {
    const { sessionId } = extractHookFields({ session_id: 12345678 });
    assert.equal(sessionId, "unknown");
  });
});

// ── buildNotification ─────────────────────────────────────────────────────────
describe("buildNotification", () => {
  it("uses --title and --message CLI args when provided", () => {
    const { title, message } = buildNotification(
      ["--title", "My Title", "--message", "My Message"],
      "end_turn",
      "abc12345"
    );
    assert.equal(title, "My Title");
    assert.equal(message, "My Message");
  });

  it("defaults title to 'Claude Code'", () => {
    const { title } = buildNotification([], "end_turn", "abc12345");
    assert.equal(title, "Claude Code");
  });

  it("generates default message containing stop_reason", () => {
    const { message } = buildNotification([], "end_turn", "abc12345");
    assert.ok(message.includes("end_turn"), "message should contain stop_reason");
  });

  it("generates default message containing sessionId", () => {
    const { message } = buildNotification([], "end_turn", "abc12345");
    assert.ok(message.includes("abc12345"), "message should contain sessionId");
  });

  it("includes the end_turn emoji in default message", () => {
    const { message } = buildNotification([], "end_turn", "abc12345");
    assert.ok(message.includes(EMOJI.end_turn));
  });

  it("includes the error emoji for error stop_reason", () => {
    const { message } = buildNotification([], "error", "abc12345");
    assert.ok(message.includes(EMOJI.error));
  });

  it("includes the stop_sequence emoji for stop_sequence stop_reason", () => {
    const { message } = buildNotification([], "stop_sequence", "abc12345");
    assert.ok(message.includes(EMOJI.stop_sequence));
  });

  it("uses end_turn emoji as fallback for unknown stop_reason", () => {
    const { message } = buildNotification([], "unknown_reason", "abc12345");
    assert.ok(message.includes(EMOJI.end_turn), "should fall back to end_turn emoji");
  });

  it("CLI --title overrides default", () => {
    const { title } = buildNotification(["--title", "Custom"], "end_turn", "abc12345");
    assert.equal(title, "Custom");
  });

  it("CLI --message overrides default", () => {
    const { message } = buildNotification(["--message", "Custom msg"], "end_turn", "abc12345");
    assert.equal(message, "Custom msg");
  });
});

// ── EMOJI constant ────────────────────────────────────────────────────────────
describe("EMOJI constant", () => {
  it("has exactly the expected keys", () => {
    assert.deepEqual(Object.keys(EMOJI).sort(), ["end_turn", "error", "stop_sequence"]);
  });

  it("all values are non-empty strings", () => {
    for (const [key, val] of Object.entries(EMOJI)) {
      assert.equal(typeof val, "string", `EMOJI.${key} should be a string`);
      assert.ok(val.length > 0, `EMOJI.${key} should not be empty`);
    }
  });
});
