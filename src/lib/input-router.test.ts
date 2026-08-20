import { describe, expect, it } from "vitest";

import { buildSystemPrompt, detectInputType, isOutputMode } from "@/lib/input-router";

describe("detectInputType", () => {
  it("returns text for empty or plain content", () => {
    expect(detectInputType("")).toBe("text");
    expect(detectInputType("Tighten the left lug nut first.")).toBe("text");
  });

  it("detects pdf markers and extensions", () => {
    expect(detectInputType("%PDF-1.7")).toBe("pdf");
    expect(detectInputType("see manual.pdf")).toBe("pdf");
    expect(detectInputType("[[input:pdf]]\nUploaded file")).toBe("pdf");
  });

  it("detects media and urls", () => {
    expect(detectInputType("https://example.com/clip.mp4")).toBe("video");
    expect(detectInputType("voicemail.m4a")).toBe("audio");
    expect(detectInputType("data:image/png;base64,abc")).toBe("image");
    expect(detectInputType("https://example.com/policy")).toBe("url");
    expect(detectInputType("<!doctype html><html></html>")).toBe("url");
  });
});

describe("isOutputMode", () => {
  it("accepts the six product modes", () => {
    expect(isOutputMode("tl_dr")).toBe(true);
    expect(isOutputMode("flashcards")).toBe(true);
    expect(isOutputMode("decision_tree")).toBe(false);
  });
});

describe("buildSystemPrompt", () => {
  it("includes the mode contract and audience", () => {
    const prompt = buildSystemPrompt("tl_dr", "text");
    expect(prompt).toContain("MODE: tl_dr");
    expect(prompt).toContain("INPUT TYPE: text");
    expect(prompt).toContain("no longer confuzzled");
  });

  it("tells image mode to read pixels without inventing labels", () => {
    const prompt = buildSystemPrompt("step_by_step", "image");
    expect(prompt).toContain("photograph");
    expect(prompt).toContain("Do not fabricate");
  });
});
