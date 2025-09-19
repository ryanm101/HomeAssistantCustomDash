// src/ha.ts
import { createConnection, createLongLivedTokenAuth, subscribeEntities, callService } from "home-assistant-js-websocket";

export async function connectHA(baseUrl: string, token: string) {
  const auth = createLongLivedTokenAuth(baseUrl, token);
  const conn = await createConnection({ auth });
  return {
    conn,
    subscribe(fn: (entities: Record<string, any>) => void) {
      return subscribeEntities(conn, fn);
    },
    call(domain: string, service: string, data: object) {
      return callService(conn, domain, service, data);
    },
  };
}

