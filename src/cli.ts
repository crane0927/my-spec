import { cac } from "cac";
import { runInit } from "./commands/init.js";

const cli = cac("myspec");

cli.command("init", "Initialize myspec in current project").action(async () => {
  await runInit(process.cwd());
});

cli.help();
cli.version("0.1.0");
cli.parse();
