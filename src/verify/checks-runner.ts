import { getMyspecDir } from "../core/change.js";
import { loadConfig } from "../core/config.js";
import { runCommand } from "../core/executor.js";

export async function runChecks(root: string) {
  const config = await loadConfig(`${getMyspecDir(root)}/config.yaml`);
  const results = [];

  for (const command of config.checks.commands) {
    const execution = await runCommand(command.command, root);
    results.push({
      id: command.id,
      command: command.command,
      required: command.required,
      exitCode: execution.exitCode,
      stdout: execution.stdout,
      stderr: execution.stderr,
      passed: execution.exitCode === 0,
    });
  }

  return results;
}
