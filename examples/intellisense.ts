import { deleteAtPath, getAtPath, hasAtPath, setAtPath } from "../src/index.js";
import { createApplicationConfig } from "./config-fixture.js";

// Open this file in VSCode. Hover each variable to inspect its inferred type.
// Use Ctrl+Space inside a path string to inspect the available suggestions.
// Suggestions cover two levels; deeper paths are validated and inferred when supplied.
const config = createApplicationConfig();

// Object and scalar results.
export const database = getAtPath(config, "db");
export const credentials = getAtPath(config, "db.primary.credentials");
export const port = getAtPath(config, "db.primary.port"); // number
export const password = getAtPath(config, "db.primary.credentials.passwd"); // string | undefined

// Nested arrays, missing elements, dictionaries, and nullable ancestors.
export const sku = getAtPath(config, "tenants.0.billing.invoices.0.items.1.sku"); // string | undefined
export const discount = getAtPath(config, "tenants.0.billing.invoices.0.items.1.discount", 0); // number
export const city = getAtPath(config, "tenants.1.profile.address.city", "Unknown"); // string
export const poolSize = getAtPath(config, "db.pools.api.max"); // number | undefined
export const replicaPassword = getAtPath(config, "db.replicas.1.credentials.passwd"); // string | undefined
export const queueHost = getAtPath(config, "integrations.queue.connection.host"); // string | undefined

// Tuples preserve their exact slot types; union-specific fields can be absent.
export const logLevel = getAtPath(config, "telemetry.logging.levels.2"); // "warn"
export const routeTimeout = getAtPath(config, "routes.1.timeoutMs"); // number
export const storageDirectory = getAtPath(config, "integrations.storage.directory"); // string | undefined
export const matrixCell = getAtPath(config, "telemetry.metrics.buckets.1.0"); // number | undefined
export const recursiveValue = getAtPath(config, "tree.next.next.next.next.value"); // number | undefined

// The same inference with slash and multi-character delimiters.
export const slashHost = getAtPath(config, "db/replicas/0/endpoint/host", undefined, "/");
export const customEmail = getAtPath(config, "tenants::0::profile::contact::email", undefined, "::");
export const legacyFlag = getAtPath(config, "legacy.settings//enabled", undefined, "/");

// Writes and deletions return booleans. Existing intermediate containers are required.
export const updated = setAtPath(config, "tenants.0.billing.invoices.0.items.0.quantity", 4);
export const updatedTupleChild = setAtPath(config, "routes.1.timeoutMs", 2500);
export const deletedOptional = deleteAtPath(config, "db.primary.credentials.passwd");
export const removedElement = deleteAtPath(config, "db.replicas.1");
export const runtimeCheck = hasAtPath(config, "any.path.from.configuration");

// Intentionally invalid calls below are compiled but never executed.
// Remove an @ts-expect-error temporarily to inspect VSCode's diagnostic.
function rejectedExamples() {
  // @ts-expect-error Misspelled path
  getAtPath(config, "db.primary.credential.passwd");
  // @ts-expect-error Readonly tuple position out of bounds
  getAtPath(config, "telemetry.logging.levels.4");
  // @ts-expect-error Wrong destination type
  setAtPath(config, "tenants.0.billing.invoices.0.items.0.quantity", "four");
  // @ts-expect-error Readonly leaf
  setAtPath(config, "build.commit", "replacement");
  // @ts-expect-error Cannot splice a fixed tuple
  deleteAtPath(config, "routes.0");
  // @ts-expect-error Required credentials cannot be deleted by the boolean mutator
  deleteAtPath(config, "db.primary.credentials.username");
  // @ts-expect-error A boolean deletion result is not an object to traverse
  deleteAtPath(deleteAtPath(config, "db.primary.credentials.passwd"), "encryption.masterKey");
}
void rejectedExamples;
