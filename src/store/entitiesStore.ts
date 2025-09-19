import { useMemo } from "react";
import { useSyncExternalStore } from "react";
import type { HassEntities, HassEntity } from "home-assistant-js-websocket";

export type EntitiesState = Record<string, HassEntity>;
type Listener = () => void;

let state: EntitiesState = {};
const listeners = new Set<Listener>();

function emit() {
  for (const listener of listeners) {
    listener();
  }
}

export function setEntities(entities: HassEntities) {
  state = { ...entities };
  emit();
}

export function updateEntity(entityId: string, entity: HassEntity) {
  state = { ...state, [entityId]: entity };
  emit();
}

export function removeEntity(entityId: string) {
  if (!(entityId in state)) {
    return;
  }
  const next = { ...state };
  delete next[entityId];
  state = next;
  emit();
}

export function applyOptimisticEntities(updates: Partial<EntitiesState>) {
  const previous = new Map<string, HassEntity | undefined>();
  for (const [entityId, entity] of Object.entries(updates)) {
    previous.set(entityId, state[entityId]);
    if (!entity) {
      continue;
    }
  }

  let next = { ...state };
  for (const [entityId, entity] of Object.entries(updates)) {
    if (entity === undefined) {
      delete next[entityId];
    } else {
      next[entityId] = entity;
    }
  }

  state = next;
  emit();

  return () => {
    let mutated = false;
    next = { ...state };
    for (const [entityId, prior] of previous.entries()) {
      const optimistic = updates[entityId];
      if (optimistic !== undefined && state[entityId] !== optimistic) {
        continue;
      }
      mutated = true;
      if (prior === undefined) {
        delete next[entityId];
      } else {
        next[entityId] = prior;
      }
    }

    if (mutated) {
      state = next;
      emit();
    }
  };
}

export function getEntitiesSnapshot(): EntitiesState {
  return state;
}

export function subscribeEntitiesStore(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useEntities<T = EntitiesState>(selector?: (entities: EntitiesState) => T): T {
  const snapshot = useSyncExternalStore(subscribeEntitiesStore, getEntitiesSnapshot, getEntitiesSnapshot);
  return useMemo(() => (selector ? selector(snapshot) : (snapshot as unknown as T)), [snapshot, selector]);
}

export function useEntity(entityId: string): HassEntity | undefined {
  return useSyncExternalStore(
    subscribeEntitiesStore,
    () => getEntitiesSnapshot()[entityId],
    () => getEntitiesSnapshot()[entityId],
  );
}

export function useEntitiesSelector<T>(selector: (entities: EntitiesState) => T): T {
  return useEntities(selector);
}

export function resetEntitiesStore() {
  state = {};
  emit();
}
