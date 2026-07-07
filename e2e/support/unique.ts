/**
 * Collision-free identifiers for E2E runs.
 *
 * The lifecycle specs drive the real deployed example apps, which create real
 * MonetizeKit customers. Every run (local, nightly, or a re-run of a cancelled
 * job) must use names that can never collide with existing demo data or with a
 * parallel run — otherwise a flake in one run can wedge another. A per-process
 * run id plus a monotonic counter guarantees that.
 */
const RUN_ID = process.env.E2E_RUN_ID?.trim() || Math.random().toString(36).slice(2, 10);

export function makeUnique(prefix: string): (label: string) => string {
  let counter = 0;
  return (label: string) => {
    counter += 1;
    const normalized = label.replace(/[^a-zA-Z0-9_-]/g, "-").toLowerCase();
    return `${prefix}-${normalized}-${RUN_ID}-${counter}`;
  };
}
