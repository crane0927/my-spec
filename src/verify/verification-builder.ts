import { getFallbackAction } from "../core/phase.js";

export function buildVerification(
  changeName: string,
  checks: Array<{ required: boolean; passed: boolean }>,
) {
  const hasRequiredFailure = checks.some((item) => item.required && !item.passed);
  const nextStep = hasRequiredFailure
    ? getFallbackAction({ phase: "verify", reason: "execution" })
    : undefined;

  return {
    change: changeName,
    status: hasRequiredFailure ? "failed" : "passed",
    gates: {
      testExecution: hasRequiredFailure ? "failed" : "passed",
      codeQuality: hasRequiredFailure ? "failed" : "passed",
    },
    issues: hasRequiredFailure
      ? [
          {
            level: 3 as const,
            category: "check-failure",
            title: "Required check failed",
            suggestion: "修复失败的必需命令后重新执行 verify。",
          },
        ]
      : [],
    nextStep,
  };
}
