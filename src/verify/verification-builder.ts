import type { CoverageSummary } from "../schemas/traceability.js";
import { getFallbackAction } from "../core/phase.js";
import type { EvidenceItem } from "../schemas/evidence.js";

export function buildVerification(
  changeName: string,
  checks: Array<{ required: boolean; passed: boolean }>,
  options: {
    coverageSummary?: CoverageSummary;
    evidenceItems?: EvidenceItem[];
  } = {},
) {
  const hasRequiredFailure = checks.some((item) => item.required && !item.passed);
  const evidenceItems = options.evidenceItems ?? [];
  const hasCommandEvidence = evidenceItems.some((item) => item.type === "command");
  const hasRiskAcceptance = evidenceItems.some((item) => item.type === "risk-acceptance");
  const hasEvidenceFailure = !hasCommandEvidence;

  let nextStep: string | undefined;
  if (hasRequiredFailure) {
    nextStep = getFallbackAction({ phase: "verify", reason: "execution" });
  } else if (hasEvidenceFailure) {
    nextStep = getFallbackAction({ phase: "verify", reason: "evidence" });
  }

  const issues = [];
  if (hasRequiredFailure) {
    issues.push({
      level: 3 as const,
      category: "check-failure",
      title: "Required check failed",
      suggestion: "修复失败的必需命令后重新执行 verify。",
    });
  }
  if (hasEvidenceFailure) {
    issues.push({
      level: 3 as const,
      category: "evidence",
      title: "Missing command evidence",
      suggestion: "补充命令执行 evidence 后重新执行 verify。",
    });
  }
  if (hasRiskAcceptance) {
    issues.push({
      level: 1 as const,
      category: "risk-acceptance",
      title: "Accepted risks recorded",
      suggestion: "在报告中明确记录已接受风险及后续处理计划。",
    });
  }

  const status = hasRequiredFailure || hasEvidenceFailure ? "failed" : "passed";

  return {
    change: changeName,
    status,
    gates: {
      testExecution: hasRequiredFailure ? "failed" : "passed",
      codeQuality: hasRequiredFailure ? "failed" : "passed",
      evidence: hasEvidenceFailure ? "failed" : "passed",
    },
    issues,
    nextStep,
    coverageSummary: options.coverageSummary,
  };
}
