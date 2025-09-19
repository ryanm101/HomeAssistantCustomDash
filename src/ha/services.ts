import type { HassServiceTarget } from "home-assistant-js-websocket";
import { callService as callHAService } from "home-assistant-js-websocket";
import type { HAClient } from "./client";
import { applyOptimisticEntities, type EntitiesState } from "../store/entitiesStore";

export interface ServiceCallDescriptor {
  domain: string;
  service: string;
  serviceData?: Record<string, unknown>;
  target?: HassServiceTarget;
}

export interface ServiceCallOptions {
  timeoutMs?: number;
  retries?: number;
  optimisticEntities?: Partial<EntitiesState>;
  rollbackOnError?: boolean;
}

const DEFAULT_TIMEOUT_MS = 7_000;
const DEFAULT_RETRIES = 2;

export async function callService(
  client: HAClient,
  descriptor: ServiceCallDescriptor,
  options: ServiceCallOptions = {},
) {
  const connection = client.getConnection();
  if (!connection) {
    throw new Error("HA connection is not ready");
  }

  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const retries = options.retries ?? DEFAULT_RETRIES;
  const rollbackOnError = options.rollbackOnError ?? true;

  let rollback: (() => void) | undefined;
  if (options.optimisticEntities) {
    rollback = applyOptimisticEntities(options.optimisticEntities);
  }

  let attempt = 0;
  let lastError: unknown;

  while (attempt <= retries) {
    try {
      const result = await promiseWithTimeout(
        callHAService(
          connection,
          descriptor.domain,
          descriptor.service,
          descriptor.serviceData,
          descriptor.target,
          true,
        ),
        timeoutMs,
      );
      return result;
    } catch (error) {
      lastError = error;
      if (attempt === retries) {
        break;
      }
      await delay(backoff(attempt));
      attempt += 1;
    }
  }

  if (rollbackOnError && rollback) {
    rollback();
  }

  throw toError(lastError);
}

function backoff(attempt: number) {
  const base = 400 * 2 ** attempt;
  const jitter = 0.5 + Math.random();
  return Math.min(Math.round(base * jitter), 4_000);
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
      timeoutId = setTimeout(() => reject(new Error("service timeout")), timeoutMs);
    }),
  ]);
}

async function delay(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

function toError(error: unknown) {
  if (error instanceof Error) {
    return error;
  }
  return new Error(String(error));
}
