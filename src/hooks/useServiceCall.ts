import { useCallback } from "react";
import { getHAClient } from "../ha/manager";
import { callService, type ServiceCallDescriptor, type ServiceCallOptions } from "../ha/services";

export function useServiceCall() {
  return useCallback(
    async (descriptor: ServiceCallDescriptor, options?: ServiceCallOptions) => {
      const client = getHAClient();
      if (!client) {
        throw new Error("HA client is not configured. Set Home Assistant credentials first.");
      }
      return await callService(client, descriptor, options);
    },
    [],
  );
}
