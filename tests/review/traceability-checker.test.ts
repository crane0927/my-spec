import { describe, expect, it } from "vitest";
import { checkTraceability } from "../../src/review/traceability-checker.js";

describe("checkTraceability", () => {
  it("flags requirements without linked tasks or tests", () => {
    const result = checkTraceability({
      requirements: [{ id: "REQ-001", tasks: [], tests: [] }],
    });

    expect(result.issues).toHaveLength(2);
    expect(result.gaps).toContain("REQ-001 missing TASK link");
  });
});
