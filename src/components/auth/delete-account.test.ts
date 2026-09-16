import { describe, expect, test } from "bun:test";
import { runAccountDeletion, type AccountDeletionClient } from "@/components/auth/delete-account";

function fakeClient(overrides: { rpcError?: string; signOutError?: Error } = {}) {
  const calls: string[] = [];
  const client: AccountDeletionClient = {
    rpc: (fn) => {
      calls.push(`rpc:${fn}`);
      return Promise.resolve({ error: overrides.rpcError ? { message: overrides.rpcError } : null });
    },
    auth: {
      signOut: (options) => {
        calls.push(`signOut:${options?.scope ?? "global"}`);
        return overrides.signOutError ? Promise.reject(overrides.signOutError) : Promise.resolve({});
      },
    },
  };
  return { client, calls };
}

describe("runAccountDeletion", () => {
  test("deletes the server account, then clears local state, then signs out locally", async () => {
    const { client, calls } = fakeClient();
    const order: string[] = [];
    await runAccountDeletion(client, () => order.push("clearLocal"));
    expect(calls).toEqual(["rpc:delete_own_account", "signOut:local"]);
    expect(order).toEqual(["clearLocal"]);
  });

  test("keeps the browser session and ratings when the server deletion fails", async () => {
    const { client, calls } = fakeClient({ rpcError: "permission denied" });
    let cleared = false;
    await expect(runAccountDeletion(client, () => { cleared = true; })).rejects.toThrow(
      "Deleting your account failed: permission denied",
    );
    expect(cleared).toBe(false);
    expect(calls).toEqual(["rpc:delete_own_account"]);
  });
});
