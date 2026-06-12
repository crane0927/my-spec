import { join } from "node:path";
import { ensureDir, writeTextFile } from "../core/fs.js";
import { defaultConfig, templateFiles } from "../templates/defaults.js";

export async function runInit(cwd: string): Promise<void> {
  const baseDir = join(cwd, ".myspec");

  await ensureDir(baseDir);
  await ensureDir(join(baseDir, "templates"));
  await ensureDir(join(baseDir, "rubrics"));
  await ensureDir(join(baseDir, "agents"));
  await ensureDir(join(baseDir, "changes"));
  await ensureDir(join(baseDir, "archive"));

  await writeTextFile(join(baseDir, "config.yaml"), defaultConfig);

  for (const [relativePath, content] of Object.entries(templateFiles)) {
    await writeTextFile(join(baseDir, relativePath), content);
  }
}
