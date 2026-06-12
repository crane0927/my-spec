import YAML from "yaml";
import { configSchema, type MyspecConfig } from "../schemas/config.js";
import { readTextFile } from "./fs.js";

export async function loadConfig(path: string): Promise<MyspecConfig> {
  const raw = await readTextFile(path);
  return configSchema.parse(YAML.parse(raw));
}
