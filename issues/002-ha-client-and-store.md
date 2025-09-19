# Task 2: HA Client, Store, and Hooks

Implement robust HA connection lifecycle, normalized entity store, and selector-based hooks.

## Deliverables
- `src/ha/client.ts`: connect, reconnect (exp-backoff + jitter), ping, subscribe
- `src/ha/services.ts`: callService wrapper with timeout/retry + optimistic updates
- `src/store/entitiesStore.ts`: normalized dictionary + useSyncExternalStore adapter
- Hooks: `src/hooks/{useHAConnection,useEntities,useEntity,useServiceCall}.ts`
- Unit tests: backoff, ping, selectors, optimistic rollback

