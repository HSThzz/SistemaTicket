import "../helpers/env";
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { env } from "../../src/shared/infrastructure/config/env";
import { getRedisKeyspaceExpiredPattern } from "../../src/shared/infrastructure/config/redis";

describe("Redis keyspace pattern", () => {
  it("uses REDIS_DB from environment for expired key events", () => {
    assert.equal(
      getRedisKeyspaceExpiredPattern(),
      `__keyevent@${env.redis.db}__:expired`,
    );
    assert.equal(env.redis.db, Number(process.env.REDIS_DB ?? "0"));
  });
});
