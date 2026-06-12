import { join } from "node:path";
import { readChangeFile } from "../core/change.js";
import { writeTextFile } from "../core/fs.js";
import { metaSchema } from "../schemas/meta.js";

const emptyTraceability = `{
  "requirements": [],
  "summary": {
    "totalRequirements": 0,
    "fullyCovered": 0,
    "partiallyCovered": 0,
    "uncovered": 0
  },
  "gaps": []
}
`;

const draftArtifactsByMode = {
  standard: {
    "requirements.md": "# Requirements\n",
    "design.md": "# Design\n",
    "tasks.md": "# Tasks\n",
    "test-case.md": "# Test Cases\n",
    "test-case.json": "{\n  \"cases\": []\n}\n",
    "traceability.json": emptyTraceability,
  },
  lite: {
    "requirements.md": "# Requirements\n",
    "tasks.md": "# Tasks\n",
    "test-case.md": "# Test Cases\n",
    "test-case.json": "{\n  \"cases\": []\n}\n",
    "traceability.json": emptyTraceability,
  },
};

export async function runDraft(cwd: string, changeName: string): Promise<void> {
  const baseDir = join(cwd, ".myspec", "changes", changeName);
  const meta = metaSchema.parse(JSON.parse(await readChangeFile(cwd, changeName, "meta.json")));
  const draftArtifacts = draftArtifactsByMode[meta.mode];

  for (const [fileName, content] of Object.entries(draftArtifacts)) {
    await writeTextFile(join(baseDir, fileName), content);
  }
}
