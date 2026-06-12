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

  it("produces structured coverage summary counts", () => {
    const result = checkTraceability({
      requirements: [
        { id: "REQ-001", tasks: ["TASK-001"], tests: ["TC-001"] },
        { id: "REQ-002", tasks: [], tests: [] },
        { id: "REQ-003", tasks: ["TASK-003"], tests: [] },
      ],
    });

    expect(result.summary.fullyCovered).toBe(1);
    expect(result.summary.partiallyCovered).toBe(1);
    expect(result.summary.uncovered).toBe(1);
  });
});
