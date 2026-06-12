import { getChangeFilePath } from "../core/change.js";
import { readTextFile, writeJsonFile } from "../core/fs.js";
import { metaSchema } from "../schemas/meta.js";

export async function updateChangeStatus(
  root: string,
  changeName: string,
  status: "applying" | "implemented" | "verifying" | "verified" | "reported",
) {
  const path = getChangeFilePath(root, changeName, "meta.json");
  const meta = metaSchema.parse(JSON.parse(await readTextFile(path)));
  await writeJsonFile(path, { ...meta, status });
}
