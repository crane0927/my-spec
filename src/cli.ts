#!/usr/bin/env node

import { cac } from "cac";
import { runApply } from "./commands/apply.js";
import { runClarify } from "./commands/clarify.js";
import { runDraft } from "./commands/draft.js";
import { runInit } from "./commands/init.js";
import { runList } from "./commands/list.js";
import { runPropose } from "./commands/propose.js";
import { runReport } from "./commands/report.js";
import { runReview } from "./commands/review.js";
import { runStatus } from "./commands/status.js";
import { runVerify } from "./commands/verify.js";
import { formatUserError } from "./core/errors.js";
import { formatApplySummary, formatReportSummary, formatReviewSummary } from "./core/output.js";

const cli = cac("myspec");

function withCliErrorHandling<TArgs extends unknown[]>(
  action: (...args: TArgs) => Promise<void>,
): (...args: TArgs) => Promise<void> {
  return async (...args: TArgs) => {
    try {
      await action(...args);
    } catch (error) {
      // 统一把内部异常转成终端可读文案，避免直接抛出堆栈给最终用户。
      console.error(formatUserError(error));
      process.exitCode = 1;
    }
  };
}

cli.command("init", "Initialize myspec in current project").action(
  withCliErrorHandling(async () => {
    await runInit(process.cwd());
  }),
);

cli
  .command("propose <change>", "Create a new change")
  .option("--mode <mode>", "Workflow mode", { default: "standard" })
  .action(withCliErrorHandling(async (change, options) => {
    await runPropose(process.cwd(), change, options.mode as "standard" | "lite");
  }));

cli
  .command("clarify <change>", "Create clarification document")
  .option("--skip", "Skip clarification and create placeholder")
  .action(withCliErrorHandling(async (change, options) => {
    await runClarify(process.cwd(), change, Boolean(options.skip));
  }));

cli.command("draft <change>", "Generate change artifacts").action(
  withCliErrorHandling(async (change) => {
    await runDraft(process.cwd(), change);
  }),
);

cli.command("apply <change>", "Prepare apply context").action(
  withCliErrorHandling(async (change) => {
    const summary = await runApply(process.cwd(), change);
    console.log(formatApplySummary(summary));
  }),
);

cli.command("review <change>", "Review change artifacts").action(
  withCliErrorHandling(async (change) => {
    const summary = await runReview(process.cwd(), change);
    console.log(formatReviewSummary(summary));
  }),
);

cli.command("verify <change>", "Run change verification").action(
  withCliErrorHandling(async (change) => {
    const result = await runVerify(process.cwd(), change);
    console.log(`verify: ${result.verification.status}`);
  }),
);

cli.command("report <change>", "Generate change report").action(
  withCliErrorHandling(async (change) => {
    const result = await runReport(process.cwd(), change);
    console.log(formatReportSummary({ change, status: result.status }));
  }),
);

cli.command("status <change>", "Show current change status").action(
  withCliErrorHandling(async (change) => {
    console.log(await runStatus(process.cwd(), change));
  }),
);

cli.command("list", "List all changes").action(
  withCliErrorHandling(async () => {
    console.log(await runList(process.cwd()));
  }),
);

cli.help();
cli.version("0.1.0");
cli.parse();
