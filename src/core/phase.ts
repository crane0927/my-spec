export function getReviewFallbackStep(document: string): string {
  if (document === "requirements.md") {
    return "返回 requirements 修订";
  }

  if (document === "design.md") {
    return "返回 design 修订";
  }

  if (document === "tasks.md") {
    return "返回 tasks 修订";
  }

  if (document === "test-case.md") {
    return "返回 test-case 修订";
  }

  return "返回 draft 修订";
}

export type FallbackPhase = "review" | "apply" | "verify";
export type FallbackReason = "document" | "execution" | "verification" | "evidence";

export function getFallbackAction(context: {
  phase: FallbackPhase;
  reason: FallbackReason;
}): string {
  if (context.phase === "review") {
    return "返回 draft 修订";
  }

  if (context.phase === "apply") {
    return "返回 tasks 或 design 修订";
  }

  if (context.phase === "verify" && context.reason === "execution") {
    return "返回 apply 修复";
  }

  if (context.phase === "verify" && context.reason === "evidence") {
    return "补充 evidence 后重新 verify";
  }

  return "返回上一阶段修订";
}
