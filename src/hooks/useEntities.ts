import type { EntitiesState } from "../store/entitiesStore";
import { useEntities as useEntitiesStoreHook, useEntitiesSelector, useEntity } from "../store/entitiesStore";

export { useEntity } from "../store/entitiesStore";

export function useEntities<T = EntitiesState>(selector?: (entities: EntitiesState) => T): T {
  return useEntitiesStoreHook(selector);
}

export function useEntitiesByDomain(domain: string) {
  return useEntitiesSelector((entities) =>
    Object.fromEntries(
      Object.entries(entities).filter(([entityId]) => entityId.startsWith(`${domain}.`)),
    ),
  );
}
