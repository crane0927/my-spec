import { loadApplyContext } from "../apply/context.js";
import { assertCanApply } from "../apply/gate.js";
import { updateChangeStatus } from "../apply/status-updater.js";

export async function runApply(root: string, changeName: string) {
  await assertCanApply(root, changeName);
  const context = await loadApplyContext(root, changeName);
  await updateChangeStatus(root, changeName, "applying");

  return {
    change: changeName,
    status: "applying",
    context,
  };
}
