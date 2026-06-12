import { join } from "node:path";
import { writeTextFile } from "../core/fs.js";

const draftArtifacts: Record<string, string> = {
  "requirements.md": "# Requirements\n",
  "design.md": "# Design\n",
  "tasks.md": "# Tasks\n",
  "test-case.md": "# Test Cases\n",
  "test-case.json": "{\n  \"cases\": []\n}\n",
  "traceability.json": "{\n  \"requirements\": [],\n  \"summary\": {},\n  \"gaps\": []\n}\n",
};

export async function runDraft(cwd: string, changeName: string): Promise<void> {
  const baseDir = join(cwd, ".myspec", "changes", changeName);

  for (const [fileName, content] of Object.entries(draftArtifacts)) {
    await writeTextFile(join(baseDir, fileName), content);
  }
}
