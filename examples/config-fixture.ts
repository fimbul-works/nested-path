/** A realistic application configuration for integration and editor checks. */
export interface ApplicationConfig {
  app: {
    name: string;
    version: string;
    deployment: { environment: "development" | "production"; region: "eu-north" | "us-east" };
  };
  db: {
    primary: { host: string; port: number; credentials: { username: string; passwd?: string } };
    replicas: Array<{ endpoint: { host: string; port: number }; tags: string[]; credentials?: { passwd?: string } }>;
    pools: Record<string, { min: number; max: number; health?: { timeoutMs: number } }>;
  };
  encryption: {
    masterKey?: string;
    rotation: { enabled: boolean; history: Array<{ id: string; retiredAt: string | null }> };
  };
  tenants: Array<{
    id: string;
    profile: { contact: { email: string }; address?: { street: string; city: string } | null };
    billing: {
      currency: "EUR" | "USD";
      invoices: Array<{ id: string; items: Array<{ sku: string; quantity: number; discount?: number }> }>;
    };
    flags: Record<string, boolean>;
    secrets?: { apiKey?: string };
  }>;
  integrations: {
    webhook: { url: string; auth?: { token?: string } };
    queue: { connection: { host: string; tls: boolean } } | null;
    storage: { kind: "local"; directory: string } | { kind: "remote"; url: string; token?: string };
  };
  telemetry: {
    logging: {
      levels: readonly ["debug", "info", "warn", "error"];
      targets: Array<{ name: string; enabled: boolean }>;
    };
    metrics: { labels: Record<string, string>; buckets: number[][] };
  };
  routes: readonly [string, { timeoutMs: number; retry?: { attempts: number } }];
  build: { readonly commit: string; readonly tags: readonly string[] };
  features: { beta?: { enabled: boolean; audience: string[] } };
  "legacy.settings": { "": { enabled: boolean } };
  tree: ConfigNode;
}

/** Recursive input; finite paths remain usable without expanding the whole tree. */
export interface ConfigNode {
  value: number;
  next?: ConfigNode;
}

/** Return a fresh fixture so tests and playground edits do not share mutations. */
export function createApplicationConfig(): ApplicationConfig {
  return {
    app: { name: "nested-path-demo", version: "2.0.0", deployment: { environment: "development", region: "eu-north" } },
    db: {
      primary: {
        host: "primary.example.test",
        port: 5432,
        credentials: { username: "demo", passwd: "example-password" },
      },
      replicas: [
        {
          endpoint: { host: "replica-1.example.test", port: 5432 },
          tags: ["read", "eu"],
          credentials: { passwd: "replica-password" },
        },
        { endpoint: { host: "replica-2.example.test", port: 5433 }, tags: ["analytics"] },
      ],
      pools: { api: { min: 2, max: 10, health: { timeoutMs: 500 } }, workers: { min: 1, max: 4 } },
    },
    encryption: {
      masterKey: "example-master-key",
      rotation: { enabled: true, history: [{ id: "key-1", retiredAt: null }] },
    },
    tenants: [
      {
        id: "tenant-1",
        profile: { contact: { email: "demo@example.test" }, address: { street: "Example Street", city: "Helsinki" } },
        billing: {
          currency: "EUR",
          invoices: [
            {
              id: "invoice-1",
              items: [
                { sku: "plan-pro", quantity: 2, discount: 0.1 },
                { sku: "storage", quantity: 5 },
              ],
            },
          ],
        },
        flags: { beta: true },
        secrets: { apiKey: "example-api-key" },
      },
      {
        id: "tenant-2",
        profile: { contact: { email: "second@example.test" }, address: null },
        billing: { currency: "USD", invoices: [] },
        flags: {},
      },
    ],
    integrations: {
      webhook: { url: "https://example.test/hook", auth: { token: "example-webhook-token" } },
      queue: null,
      storage: { kind: "remote", url: "https://storage.example.test", token: "example-storage-token" },
    },
    telemetry: {
      logging: { levels: ["debug", "info", "warn", "error"], targets: [{ name: "stdout", enabled: true }] },
      metrics: {
        labels: { service: "api" },
        buckets: [
          [1, 5, 10],
          [50, 100],
        ],
      },
    },
    routes: ["/health", { timeoutMs: 1000, retry: { attempts: 3 } }],
    build: { commit: "example-commit", tags: ["demo", "typed"] },
    features: {},
    "legacy.settings": { "": { enabled: true } },
    tree: { value: 1, next: { value: 2, next: { value: 3 } } },
  };
}
