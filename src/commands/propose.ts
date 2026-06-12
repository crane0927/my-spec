import { join } from "node:path";
import { ensureDir, writeTextFile } from "../core/fs.js";

export async function runPropose(
  cwd: string,
  changeName: string,
  mode: "standard" | "lite",
): Promise<void> {
  const changeDir = join(cwd, ".myspec", "changes", changeName);
  await ensureDir(changeDir);

  const meta = {
    change: changeName,
    mode,
    status: "proposed",
    riskLevel: mode === "standard" ? "high" : "low",
    createdAt: new Date().toISOString(),
  };

  await writeTextFile(join(changeDir, "meta.json"), JSON.stringify(meta, null, 2));
  await writeTextFile(
    join(changeDir, "proposal.md"),
    `# Proposal

## Recommended Workflow Mode

- mode: ${mode}
`,
  );
}
