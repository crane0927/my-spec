import { access } from "node:fs/promises";
import { getChangeFilePath } from "../core/change.js";
import { readTextFile } from "../core/fs.js";
import { metaSchema } from "../schemas/meta.js";

const requiredArtifacts = ["clarification.md", "requirements.md", "design.md", "tasks.md"];

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

export async function runStatus(cwd: string, changeName: string): Promise<string> {
  const metaPath = getChangeFilePath(cwd, changeName, "meta.json");
  const rawMeta = await readTextFile(metaPath);
  const meta = metaSchema.parse(JSON.parse(rawMeta));

  const missing: string[] = [];

  for (const artifact of requiredArtifacts) {
    if (!(await fileExists(getChangeFilePath(cwd, changeName, artifact)))) {
      missing.push(artifact);
    }
  }

  const nextStep = missing.includes("clarification.md")
    ? `myspec clarify ${changeName}`
    : missing.length > 0
      ? `myspec draft ${changeName}`
      : `myspec review ${changeName}`;

  return `status: ${meta.status}
missing: ${missing.join(", ") || "none"}
next: ${nextStep}`;
}
