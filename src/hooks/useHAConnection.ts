import { useEffect, useMemo, useRef } from "react";
import { useSyncExternalStore } from "react";
import {
  subscribeHAStatus,
  getStatusSnapshot,
  getCredentials,
  setHACredentials,
  getHAClient,
  disconnectHA,
  type HACredentials,
} from "../ha/manager";

export function useHAConnection() {
  const status = useSyncExternalStore(subscribeHAStatus, getStatusSnapshot, getStatusSnapshot);
  const credentialsRef = useRef<HACredentials | null>(getCredentials());

  useEffect(() => {
    credentialsRef.current = getCredentials();
  }, [status.phase, status.lastUpdateTs, status.attempts]);

  const actions = useMemo(
    () => ({
      setCredentials: (creds: HACredentials) => setHACredentials(creds),
      clearCredentials: () => setHACredentials(null),
      disconnect: () => disconnectHA(),
      reconnect: () => {
        disconnectHA();
        const client = getHAClient();
        if (client) {
          void client.start();
        }
      },
    }),
    [],
  );

  return {
    status,
    credentials: credentialsRef.current,
    isConnected: status.phase === "connected",
    isReconnecting: status.phase === "reconnecting",
    actions,
  };
}
