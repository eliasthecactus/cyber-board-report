import { describe, expect, it } from "vitest";
import { parseRoute } from "./navigation";

describe("parseRoute", () => {
  it.each([
    ["", { name: "dashboard" }],
    ["#/", { name: "dashboard" }],
    ["#/profile", { name: "profile" }],
    ["#/editor/report_1", { name: "editor", id: "report_1" }],
    ["#/slides/a%20b", { name: "slides", id: "a b" }],
    ["#/editor", { name: "not-found" }],
    ["#/profile/extra", { name: "not-found" }],
    ["#/unknown", { name: "not-found" }],
  ])("parses %s", (hash, expected) => {
    expect(parseRoute(hash)).toEqual(expected);
  });
});
