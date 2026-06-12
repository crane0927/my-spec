import type { CoverageSummary } from "../schemas/traceability.js";
import { getFallbackAction } from "../core/phase.js";
import type { EvidenceItem } from "../schemas/evidence.js";

export function buildVerification(
  changeName: string,
  checks: Array<{ required: boolean; passed: boolean }>,
  options: {
    coverageSummary?: CoverageSummary;
    evidenceItems?: EvidenceItem[];
    traceabilityGaps?: string[];
  } = {},
) {
  const hasRequiredFailure = checks.some((item) => item.required && !item.passed);
  const evidenceItems = options.evidenceItems ?? [];
  const traceabilityGaps = options.traceabilityGaps ?? [];
  const hasCommandEvidence = evidenceItems.some((item) => item.type === "command");
  const hasRiskAcceptance = evidenceItems.some((item) => item.type === "risk-acceptance");
  const hasEvidenceFailure = !hasCommandEvidence;
  const hasTraceabilityFailure = traceabilityGaps.length > 0;

  let nextStep: string | undefined;
  if (hasRequiredFailure) {
    nextStep = getFallbackAction({ phase: "verify", reason: "execution" });
  } else if (hasTraceabilityFailure) {
    nextStep = getFallbackAction({ phase: "apply", reason: "verification" });
  } else if (hasEvidenceFailure) {
    nextStep = getFallbackAction({ phase: "verify", reason: "evidence" });
  }

  const issues = [];
  if (hasRequiredFailure) {
    issues.push({
      level: 3 as const,
      category: "check-failure",
      source: "checks" as const,
      title: "Required check failed",
      suggestion: "修复失败的必需命令后重新执行 verify。",
      recommendedAction: "fix-now" as const,
    });
  }
  if (hasTraceabilityFailure) {
    issues.push({
      level: 3 as const,
      category: "traceability-gap",
      source: "traceability" as const,
      title: "Traceability gaps remain",
      suggestion: `补充追踪覆盖后重新执行 verify：${traceabilityGaps.join("; ")}`,
      recommendedAction: "fix-now" as const,
    });
  }
  if (hasEvidenceFailure) {
    issues.push({
      level: 3 as const,
      category: "evidence",
      source: "evidence" as const,
      title: "Missing command evidence",
      suggestion: "补充命令执行 evidence 后重新执行 verify。",
      recommendedAction: "fix-now" as const,
    });
  }
  if (hasRiskAcceptance) {
    issues.push({
      level: 1 as const,
      category: "risk-acceptance",
      source: "evidence" as const,
      title: "Accepted risks recorded",
      suggestion: "在报告中明确记录已接受风险及后续处理计划。",
      recommendedAction: "document-risk" as const,
    });
  }

  const status = hasRequiredFailure || hasTraceabilityFailure || hasEvidenceFailure ? "failed" : "passed";

  return {
    change: changeName,
    status,
    gates: {
      testExecution: hasRequiredFailure ? "failed" : "passed",
      codeQuality: hasRequiredFailure ? "failed" : "passed",
      traceability: hasTraceabilityFailure ? "failed" : "passed",
      evidence: hasEvidenceFailure ? "failed" : "passed",
    },
    issues,
    nextStep,
    coverageSummary: options.coverageSummary,
  };
}
