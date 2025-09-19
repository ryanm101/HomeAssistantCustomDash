import { createHAClient, type HAClient, type HAConnectionStatus } from "./client";
import { setEntities, resetEntitiesStore } from "../store/entitiesStore";

export interface HACredentials {
  baseUrl: string;
  token: string;
}

type StatusListener = (status: HAConnectionStatus) => void;

const STORAGE_KEY = "rpidash.haCredentials";

let credentials: HACredentials | null = loadCredentials();
let client: HAClient | null = null;
let unsubscribeStatus: (() => void) | null = null;
let unsubscribeEntities: (() => void) | null = null;
let statusSnapshot: HAConnectionStatus = {
  phase: credentials ? "connecting" : "idle",
  attempts: 0,
  latencyMs: null,
};

const listeners = new Set<StatusListener>();

export function getCredentials() {
  return credentials;
}

export function setHACredentials(next: HACredentials | null) {
  credentials = next;
  persistCredentials(next);
  restartClient();
}

export function getHAClient(): HAClient | null {
  if (!credentials) {
    return null;
  }
  if (!client) {
    client = createHAClient({
      baseUrl: credentials.baseUrl,
      token: credentials.token,
      logger: (message, payload) => {
        if (import.meta.env.DEV) {
          console.debug(`[ha] ${message}`, payload);
        }
      },
    });

    unsubscribeStatus = client.subscribeStatus((status) => {
      statusSnapshot = status;
      notify(status);
    });

    unsubscribeEntities = client.subscribeEntities((entities) => {
      setEntities(entities);
    });

    void client.start();
  }

  return client;
}

export function subscribeHAStatus(listener: StatusListener) {
  listeners.add(listener);
  listener(statusSnapshot);
  if (credentials) {
    getHAClient();
  }
  return () => {
    listeners.delete(listener);
  };
}

export function getStatusSnapshot() {
  return statusSnapshot;
}

export function disconnectHA() {
  if (client) {
    client.stop();
  }
  teardownClient();
  statusSnapshot = { phase: "disconnected", attempts: 0, latencyMs: null };
  notify(statusSnapshot);
}

function notify(status: HAConnectionStatus) {
  for (const listener of listeners) {
    listener(status);
  }
}

function restartClient() {
  teardownClient();
  resetEntitiesStore();
  if (credentials) {
    getHAClient();
  } else {
    statusSnapshot = { phase: "idle", attempts: 0, latencyMs: null };
    notify(statusSnapshot);
  }
}

function teardownClient() {
  if (unsubscribeStatus) {
    unsubscribeStatus();
    unsubscribeStatus = null;
  }
  if (unsubscribeEntities) {
    void unsubscribeEntities();
    unsubscribeEntities = null;
  }
  if (client) {
    client = null;
  }
}

function persistCredentials(value: HACredentials | null) {
  if (typeof window === "undefined") {
    return;
  }
  if (!value) {
    window.localStorage.removeItem(STORAGE_KEY);
    return;
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
}

function loadCredentials(): HACredentials | null {
  if (typeof window === "undefined") {
    return null;
  }
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as HACredentials;
    if (parsed?.baseUrl && parsed?.token) {
      return parsed;
    }
  } catch (error) {
    console.warn("Failed to parse HA credentials", error);
    window.localStorage.removeItem(STORAGE_KEY);
  }
  return null;
}
