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
import { formatApplySummary, formatReportSummary, formatReviewSummary } from "./core/output.js";

const cli = cac("myspec");

cli.command("init", "Initialize myspec in current project").action(async () => {
  await runInit(process.cwd());
});

cli
  .command("propose <change>", "Create a new change")
  .option("--mode <mode>", "Workflow mode", { default: "standard" })
  .action(async (change, options) => {
    await runPropose(process.cwd(), change, options.mode as "standard" | "lite");
  });

cli
  .command("clarify <change>", "Create clarification document")
  .option("--skip", "Skip clarification and create placeholder")
  .action(async (change, options) => {
    await runClarify(process.cwd(), change, Boolean(options.skip));
  });

cli.command("draft <change>", "Generate change artifacts").action(async (change) => {
  await runDraft(process.cwd(), change);
});

cli.command("apply <change>", "Prepare apply context").action(async (change) => {
  const summary = await runApply(process.cwd(), change);
  console.log(formatApplySummary(summary));
});

cli.command("review <change>", "Review change artifacts").action(async (change) => {
  const summary = await runReview(process.cwd(), change);
  console.log(formatReviewSummary(summary));
});

cli.command("verify <change>", "Run change verification").action(async (change) => {
  const result = await runVerify(process.cwd(), change);
  console.log(`verify: ${result.verification.status}`);
});

cli.command("report <change>", "Generate change report").action(async (change) => {
  const result = await runReport(process.cwd(), change);
  console.log(formatReportSummary({ change, status: result.status }));
});

cli.command("status <change>", "Show current change status").action(async (change) => {
  console.log(await runStatus(process.cwd(), change));
});

cli.command("list", "List all changes").action(async () => {
  console.log(await runList(process.cwd()));
});

cli.help();
cli.version("0.1.0");
cli.parse();
