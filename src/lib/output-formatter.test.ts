import { describe, expect, it } from "vitest";

import { formatOutput, formattedOutputToPlainText, isStepList, isTextOutput, isThinOutput } from "@/lib/output-formatter";

describe("formatOutput", () => {
  it("parses flashcards JSON and rejects invalid payloads", () => {
    const cards = formatOutput(
      JSON.stringify([
        { front: "Hot wire", back: "Usually black in US residential" },
        { front: "Neutral", back: "Usually white" },
      ]),
      "flashcards",
    );
    expect(cards).toEqual([
      { front: "Hot wire", back: "Usually black in US residential" },
      { front: "Neutral", back: "Usually white" },
    ]);
    expect(formatOutput("not json", "flashcards")).toEqual([]);
  });

  it("keeps visual mode as mermaid code", () => {
    expect(formatOutput("graph TD; A-->B;", "visual")).toEqual({
      type: "mermaid",
      code: "graph TD; A-->B;",
    });
  });

  it("parses numbered and JSON steps", () => {
    const numbered = formatOutput("1. Cut power\n2. Test the circuit", "step_by_step");
    expect(isStepList(numbered)).toBe(true);
    expect(numbered).toEqual([
      { step: 1, text: "Cut power" },
      { step: 2, text: "Test the circuit" },
    ]);

    const fromJson = formatOutput(
      JSON.stringify({
        steps: [{ title: "Cut power", detail: "Breaker off, then verify with a tester." }],
      }),
      "step_by_step",
    );
    expect(fromJson).toEqual([
      { step: 1, text: "Cut power — Breaker off, then verify with a tester." },
    ]);
  });

  it("joins Feynman JSON into text", () => {
    const result = formatOutput(
      JSON.stringify({ analogy: "Like a recipe card.", explanation: "Do the steps in order." }),
      "feynman",
    );
    expect(isTextOutput(result)).toBe(true);
    if (isTextOutput(result)) {
      expect(result.content).toContain("Like a recipe card.");
      expect(result.content).toContain("Do the steps in order.");
    }
  });

  it("parses socratic JSON items", () => {
    const result = formatOutput(
      JSON.stringify({
        items: [
          { question: "What did the letter actually ask you to do?", answer: "Look for a verb." },
          { question: "What happens if you wait?", hint: "Deadlines." },
          { question: "Who can verify this?", a: "The issuer." },
        ],
      }),
      "socratic",
    );
    expect(result).toHaveLength(3);
  });

  it("returns a text wrapper for TL;DR", () => {
    expect(formatOutput("Turn the gas off first.", "tl_dr")).toEqual({
      type: "text",
      content: "Turn the gas off first.",
    });
  });
});

describe("formattedOutputToPlainText", () => {
  it("flattens steps for copying", () => {
    const text = formattedOutputToPlainText(
      [
        { step: 1, text: "Unplug it" },
        { step: 2, text: "Wait ten seconds" },
      ],
      "step_by_step",
    );
    expect(text).toBe("1. Unplug it\n2. Wait ten seconds");
  });
});

describe("isThinOutput", () => {
  it("flags empty structured replies", () => {
    expect(isThinOutput([], "flashcards")).toBe(true);
    expect(isThinOutput([], "step_by_step")).toBe(true);
    expect(isThinOutput({ type: "text", content: "Hi" }, "tl_dr")).toBe(true);
    expect(isThinOutput({ type: "mermaid", code: "flowchart LR; A-->B" }, "visual")).toBe(true);
    expect(isThinOutput({ type: "mermaid", code: "graph TD; A-->B" }, "visual")).toBe(false);
    expect(isThinOutput([{ step: 1, text: "Unplug it" }], "step_by_step")).toBe(false);
  });
});
