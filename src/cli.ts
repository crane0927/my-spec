import { cac } from "cac";
import { runClarify } from "./commands/clarify.js";
import { runDraft } from "./commands/draft.js";
import { runInit } from "./commands/init.js";
import { runPropose } from "./commands/propose.js";

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

cli.help();
cli.version("0.1.0");
cli.parse();
