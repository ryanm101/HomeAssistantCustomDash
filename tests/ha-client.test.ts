/* @vitest-environment jsdom */
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

const mocks = vi.hoisted(() => {
  const createConnectionMock = vi.fn();
  const subscribeEntitiesMock = vi.fn();
  const createAuthMock = vi.fn();

  function createMockConnection() {
    const handlers: Record<string, Set<(conn: any) => void>> = {
      disconnected: new Set(),
    };

    const connection = {
      haVersion: "2025.1.0",
      pingMock: vi.fn(async () => {}),
      closeMock: vi.fn(() => {
        handlers.disconnected.forEach((handler) => handler(connection));
      }),
      addEventListener: vi.fn((event: string, handler: (conn: any) => void) => {
        (handlers[event] ??= new Set()).add(handler);
      }),
      removeEventListener: vi.fn((event: string, handler: (conn: any) => void) => {
        handlers[event]?.delete(handler);
      }),
      ping() {
        return connection.pingMock();
      },
      close() {
        connection.closeMock();
      },
      reset() {
        connection.pingMock.mockReset();
        connection.closeMock.mockReset();
        for (const set of Object.values(handlers)) {
          set.clear();
        }
        handlers.disconnected = new Set();
      },
    } as any;

    return connection;
  }

  const mockConnection = createMockConnection();

  return { createConnectionMock, subscribeEntitiesMock, createAuthMock, mockConnection };
});

vi.mock("home-assistant-js-websocket", async () => {
  const actual = await vi.importActual<Record<string, unknown>>("home-assistant-js-websocket");
  const { createAuthMock, createConnectionMock, subscribeEntitiesMock } = mocks;
  return {
    ...actual,
    createLongLivedTokenAuth: createAuthMock,
    createConnection: createConnectionMock,
    subscribeEntities: subscribeEntitiesMock,
  };
});

const { createConnectionMock, subscribeEntitiesMock, createAuthMock, mockConnection } = mocks;

import { createHAClient, type HAConnectionStatus } from "../src/ha/client";

describe("createHAClient", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-01-01T00:00:00Z"));
    createAuthMock.mockResolvedValue({});
    createConnectionMock.mockReset();
    mockConnection.reset();
    subscribeEntitiesMock.mockImplementation((_conn, cb) => {
      cb({} as any);
      return async () => {};
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("retries with backoff until connected", async () => {
    createConnectionMock.mockRejectedValueOnce(new Error("boom"));
    createConnectionMock.mockResolvedValue(mockConnection);

    const client = createHAClient({
      baseUrl: "http://ha.local",
      token: "abc",
      heartbeatIntervalMs: 1_000,
      heartbeatTimeoutMs: 2_000,
    });

    const history: HAConnectionStatus[] = [];
    client.subscribeStatus((status) => history.push(status));

    await client.start();
    await vi.runAllTicks();

    await vi.runOnlyPendingTimersAsync();
    await vi.runAllTicks();

    const phases = history.map((entry) => entry.phase);
    expect(phases).toContain("connecting");
    expect(phases).toContain("reconnecting");
    expect(phases).toContain("connected");
  });

  it("records latency and closes connection on ping timeout", async () => {
    createConnectionMock.mockResolvedValue(mockConnection);

    const client = createHAClient({
      baseUrl: "http://ha.local",
      token: "abc",
      heartbeatIntervalMs: 1_000,
      heartbeatTimeoutMs: 500,
    });

    let latest: HAConnectionStatus | null = null;
    const history: HAConnectionStatus[] = [];
    client.subscribeStatus((status) => {
      latest = status;
      history.push(status);
    });

    await client.start();
    await vi.runAllTicks();

    mockConnection.pingMock.mockImplementationOnce(async () => {
      await vi.advanceTimersByTimeAsync(120);
    });

    await vi.advanceTimersByTimeAsync(1_000);
    await vi.runAllTicks();

    mockConnection.closeMock.mockClear();
    mockConnection.pingMock.mockImplementationOnce(() => new Promise(() => {}));
    await vi.advanceTimersByTimeAsync(1_600);
    await vi.runAllTicks();
    expect(mockConnection.closeMock).toHaveBeenCalled();
  });
});
