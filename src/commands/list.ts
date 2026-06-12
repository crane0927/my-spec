import { readdir } from "node:fs/promises";
import { getChangesDir, getChangeFilePath } from "../core/change.js";
import { readTextFile } from "../core/fs.js";
import { metaSchema } from "../schemas/meta.js";

export async function runList(cwd: string): Promise<string> {
  const entries = await readdir(getChangesDir(cwd), { withFileTypes: true });
  const lines: string[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }

    const rawMeta = await readTextFile(getChangeFilePath(cwd, entry.name, "meta.json"));
    const meta = metaSchema.parse(JSON.parse(rawMeta));
    lines.push(`${meta.change}\t${meta.mode}\t${meta.status}`);
  }

  return lines.join("\n");
}
