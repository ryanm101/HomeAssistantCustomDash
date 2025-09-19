import type { Connection, HassEntities, UnsubscribeFunc } from "home-assistant-js-websocket";
import { createConnection, createLongLivedTokenAuth, subscribeEntities } from "home-assistant-js-websocket";

export type HAConnectionPhase =
  | "idle"
  | "connecting"
  | "connected"
  | "reconnecting"
  | "disconnected";

export interface HAConnectionStatus {
  phase: HAConnectionPhase;
  attempts: number;
  latencyMs: number | null;
  lastError?: string;
  lastUpdateTs?: number;
}

export interface HAClientOptions {
  baseUrl: string;
  token: string;
  heartbeatIntervalMs?: number;
  heartbeatTimeoutMs?: number;
  maxBackoffMs?: number;
  minBackoffMs?: number;
  logger?: (message: string, payload?: unknown) => void;
}

export type StatusListener = (status: HAConnectionStatus) => void;
export type EntitiesListener = (entities: HassEntities) => void;

export interface HAClient {
  start(): Promise<void>;
  stop(): void;
  getConnection(): Connection | null;
  getStatus(): HAConnectionStatus;
  subscribeStatus(listener: StatusListener): () => void;
  subscribeEntities(listener: EntitiesListener): () => void;
}

const DEFAULTS = {
  heartbeatIntervalMs: 15_000,
  heartbeatTimeoutMs: 8_000,
  minBackoffMs: 2_000,
  maxBackoffMs: 30_000,
};

export function createHAClient(options: HAClientOptions): HAClient {
  const listeners = new Set<StatusListener>();
  const entityListeners = new Set<EntitiesListener>();

  let connection: Connection | null = null;
  let unsubscribeEntities: UnsubscribeFunc | null = null;
  let pingTimer: ReturnType<typeof setInterval> | null = null;
  let shouldStop = false;
  let loopPromise: Promise<void> | null = null;
  let attempts = 0;
  let latestEntities: HassEntities | null = null;

  const status: HAConnectionStatus = {
    phase: "idle",
    attempts,
    latencyMs: null,
  };

  const cfg = {
    heartbeatIntervalMs: options.heartbeatIntervalMs ?? DEFAULTS.heartbeatIntervalMs,
    heartbeatTimeoutMs: options.heartbeatTimeoutMs ?? DEFAULTS.heartbeatTimeoutMs,
    minBackoffMs: options.minBackoffMs ?? DEFAULTS.minBackoffMs,
    maxBackoffMs: options.maxBackoffMs ?? DEFAULTS.maxBackoffMs,
  };

  function log(message: string, payload?: unknown) {
    if (options.logger) {
      options.logger(message, payload);
    }
  }

  function emitStatus(partial: Partial<HAConnectionStatus>) {
    Object.assign(status, partial);
    for (const listener of listeners) {
      listener({ ...status });
    }
  }

  function emitEntities(entities: HassEntities) {
    latestEntities = entities;
    for (const listener of entityListeners) {
      listener(entities);
    }
  }

  async function startLoop() {
    shouldStop = false;
    if (loopPromise) {
      return loopPromise;
    }

    loopPromise = (async () => {
      while (!shouldStop) {
        attempts += 1;
        const phase: HAConnectionPhase = attempts === 1 ? "connecting" : "reconnecting";
        emitStatus({ phase, attempts, lastError: undefined });

        try {
          const auth = await createLongLivedTokenAuth(options.baseUrl, options.token);
          const conn = await createConnection({ auth });
          connection = conn;
          attempts = 0;
          emitStatus({ phase: "connected", attempts: 0 });
          log("ha.connected", { haVersion: conn.haVersion });

          const disconnectPromise = waitForDisconnect(conn);
          unsubscribeEntities = subscribeEntities(conn, (entities) => {
            emitStatus({ lastUpdateTs: Date.now() });
            emitEntities(entities);
          });
          startPing(conn);
          await disconnectPromise;
          log("ha.disconnected");
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          emitStatus({ phase: "reconnecting", lastError: message });
          log("ha.connect.error", { message });
        } finally {
          await cleanup();
        }

        if (shouldStop) {
          break;
        }

        const backoffMs = computeBackoff(cfg.minBackoffMs, cfg.maxBackoffMs, attempts);
        await delay(withJitter(backoffMs));
      }

      emitStatus({ phase: shouldStop ? "disconnected" : "idle", attempts: 0 });
      loopPromise = null;
    })();

    return loopPromise;
  }

  async function cleanup() {
    if (pingTimer) {
      clearInterval(pingTimer);
      pingTimer = null;
    }

    if (unsubscribeEntities) {
      try {
        await unsubscribeEntities();
      } catch (error) {
        log("ha.unsubscribe.error", error);
      }
      unsubscribeEntities = null;
    }

    if (connection) {
      connection = null;
    }
  }

  function startPing(conn: Connection) {
    if (pingTimer) {
      clearInterval(pingTimer);
    }

    pingTimer = setInterval(async () => {
      const started = performance.now();
      try {
        await promiseWithTimeout(conn.ping(), cfg.heartbeatTimeoutMs);
        emitStatus({ latencyMs: Math.round(performance.now() - started) });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        emitStatus({ latencyMs: null, lastError: message });
        log("ha.ping.error", { message });
        conn.close();
      }
    }, cfg.heartbeatIntervalMs);
  }

  function stop() {
    shouldStop = true;
    if (connection) {
      connection.close();
    }
  }

  return {
    async start() {
      if (!loopPromise) {
        void startLoop();
      }
    },
    stop,
    getConnection() {
      return connection;
    },
    getStatus() {
      return { ...status };
    },
    subscribeStatus(listener: StatusListener) {
      listeners.add(listener);
      listener({ ...status });
      return () => listeners.delete(listener);
    },
    subscribeEntities(listener: EntitiesListener) {
      entityListeners.add(listener);
      if (latestEntities) {
        listener(latestEntities);
      }
      return () => entityListeners.delete(listener);
    },
  };

  async function waitForDisconnect(conn: Connection) {
    await new Promise<void>((resolve) => {
      const handle = () => {
        conn.removeEventListener("disconnected", handle);
        resolve();
      };

      conn.addEventListener("disconnected", handle);
    });
  }

  function computeBackoff(min: number, max: number, attempt: number) {
    const exp = min * 2 ** Math.min(attempt, 5);
    return Math.min(exp, max);
  }

  function withJitter(value: number) {
    const jitter = 0.5 + Math.random();
    return Math.round(value * jitter);
  }

  async function delay(ms: number) {
    await new Promise((resolve) => setTimeout(resolve, ms));
  }

  async function promiseWithTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    return await Promise.race([
      promise.finally(() => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
      }),
      new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error("ping timeout")), timeoutMs);
      }),
    ]);
  }
}
