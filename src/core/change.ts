import { join } from "node:path";

export const MYSPEC_DIR = ".myspec";
export const CHANGES_DIR = "changes";

export function getMyspecDir(root: string): string {
  return join(root, MYSPEC_DIR);
}

export function getChangesDir(root: string): string {
  return join(getMyspecDir(root), CHANGES_DIR);
}

export function getChangeDir(root: string, changeName: string): string {
  return join(getChangesDir(root), changeName);
}

export function getChangeFilePath(root: string, changeName: string, fileName: string): string {
  return join(getChangeDir(root, changeName), fileName);
}
