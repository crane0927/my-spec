import { cac } from "cac";
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

cli.help();
cli.version("0.1.0");
cli.parse();
