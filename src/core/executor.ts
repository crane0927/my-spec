import { exec } from "node:child_process";

export function runCommand(
  command: string,
  cwd: string,
): Promise<{
  exitCode: number;
  stdout: string;
  stderr: string;
}> {
  return new Promise((resolve) => {
    exec(command, { cwd }, (error, stdout, stderr) => {
      resolve({
        exitCode: error && "code" in error && typeof error.code === "number" ? error.code : 0,
        stdout,
        stderr,
      });
    });
  });
}
