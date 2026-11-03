import { describe, expect, expectTypeOf, it } from "vitest";
import { createApplicationConfig, type ApplicationConfig } from "../examples/config-fixture.js";
import { clearPathSeparators, deleteAtPath, getAtPath, hasAtPath, setAtPath } from "./index.js";

describe("realistic application configuration", () => {
  it("infers deeply nested arrays, dictionaries, tuples, and nullable branches", () => {
    const config = createApplicationConfig();
    expectTypeOf(getAtPath(config, "db")).toEqualTypeOf<ApplicationConfig["db"]>();
    expectTypeOf(getAtPath(config, "db.primary.port")).toEqualTypeOf<number>();
    expectTypeOf(getAtPath(config, "db.primary.credentials.passwd")).toEqualTypeOf<string | undefined>();
    expectTypeOf(getAtPath(config, "tenants.0.billing.invoices.0.items.1.sku")).toEqualTypeOf<string | undefined>();
    expectTypeOf(getAtPath(config, "db.pools.api.max")).toEqualTypeOf<number | undefined>();
    expectTypeOf(getAtPath(config, "telemetry.logging.levels.2")).toEqualTypeOf<"warn">();
    expectTypeOf(getAtPath(config, "integrations.storage.directory")).toEqualTypeOf<string | undefined>();
    expectTypeOf(getAtPath(config, "tree.next.next.next.next.value")).toEqualTypeOf<number | undefined>();
    expect(getAtPath(config, "tenants.0.billing.invoices.0.items.1.sku")).toBe("storage");
    expect(getAtPath(config, "db.pools.missing.max", 0)).toBe(0);
    expect(getAtPath(config, "tenants.1.profile.address.city", "Unknown")).toBe("Unknown");
    expect(getAtPath(config, "integrations.queue.connection.host", "offline")).toBe("offline");
    expect(getAtPath(config, "tree.next.next.value")).toBe(3);
  });

  it("combines reads, writes, optional deletes and array removal without changing siblings", () => {
    const config = createApplicationConfig();
    const primary = config.db.primary;
    const originalFirstItem = config.tenants[0]!.billing.invoices[0]!.items[0];
    expect(setAtPath(config, "tenants.0.billing.invoices.0.items.1.quantity", 8)).toBe(true);
    expect(getAtPath(config, "tenants.0.billing.invoices.0.items.1.quantity")).toBe(8);
    expect(config.tenants[0]!.billing.invoices[0]!.items[0]).toBe(originalFirstItem);
    expect(deleteAtPath(config, "db.primary.credentials.passwd")).toBe(true);
    expect(hasAtPath(config, "db.primary.credentials.passwd")).toBe(false);
    expect(deleteAtPath(config, "encryption.masterKey")).toBe(true);
    expect(getAtPath(config, "encryption.masterKey")).toBeUndefined();
    expect(deleteAtPath(config, "db.replicas.0")).toBe(true);
    expect(getAtPath(config, "db.replicas.0.endpoint.host")).toBe("replica-2.example.test");
    expect(config.db.primary).toBe(primary);
    expect(config.db.primary.credentials.username).toBe("demo");
    expect(setAtPath(config, "routes.1.timeoutMs", 2000)).toBe(true);
    expect(getAtPath(config, "routes.1.timeoutMs")).toBe(2000);
  });

  it("preserves inference with slash and multi-character delimiters across cache resets", () => {
    const config = createApplicationConfig();
    expectTypeOf(getAtPath(config, "db/replicas/0/endpoint/host", undefined, "/")).toEqualTypeOf<string | undefined>();
    expectTypeOf(getAtPath(config, "tenants::0::profile::contact::email", undefined, "::")).toEqualTypeOf<
      string | undefined
    >();
    expect(setAtPath(config, "db/primary/port", 6432, "/")).toBe(true);
    clearPathSeparators();
    expect(getAtPath(config, "db::primary::port", undefined, "::")).toBe(6432);
    expect(deleteAtPath(config, "integrations::webhook::auth::token", "::")).toBe(true);
    expect(hasAtPath(config, "integrations/webhook/auth/token", "/")).toBe(false);
    expect(getAtPath(config, "legacy.settings//enabled", undefined, "/")).toBe(true);
    expect(setAtPath(config, "legacy.settings//enabled", false, "/")).toBe(true);
    expect(getAtPath(config, "legacy.settings//enabled", undefined, "/")).toBe(false);
  });

  it("fails on missing ancestors and absent optional values without inventing containers", () => {
    const config = createApplicationConfig();
    const before = structuredClone(config);
    expect(setAtPath(config, "features.beta.enabled", true)).toBe(false);
    expect(setAtPath(config, "tenants.99.profile.contact.email", "missing@example.test")).toBe(false);
    expect(deleteAtPath(config, "db.replicas.1.credentials.passwd")).toBe(false);
    expect(deleteAtPath(config, "tenants.99.secrets.apiKey")).toBe(false);
    expect(config).toEqual(before);
  });
});
