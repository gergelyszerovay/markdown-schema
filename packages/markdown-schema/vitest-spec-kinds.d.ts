import 'vitest';

/**
 * Spec metadata required by the node-block-architecture constitution (D42): a tag for the
 * spec kind, a slug that is unique within the library, and the phase descriptions.
 */
declare module 'vitest' {
  interface TaskMeta {
    /** The spec's slug, cited as `<package>:<lib>#<slug>`. */
    spec?: string;
    /** Scenario and edge case: the start state, as the arrange phase's description. */
    arrange?: string;
    /** Scenario and edge case: the one action, as the act phase's description. */
    act?: string;
    /** Scenario and edge case: the expected outcome, as the assert phase's description. */
    assert?: string;
  }
  interface TestTags {
    kind: 'scenario' | 'edge-case' | 'invariant';
  }
}
