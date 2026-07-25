-- CreateEnum
CREATE TYPE "actor_type" AS ENUM ('USER', 'SYSTEM', 'SERVICE', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "idempotency_status" AS ENUM ('PENDING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "audit_events" (
    "id" UUID NOT NULL,
    "occurred_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actor_type" "actor_type" NOT NULL DEFAULT 'UNKNOWN',
    "actor_id" VARCHAR(191),
    "action" VARCHAR(191) NOT NULL,
    "resource_type" VARCHAR(191),
    "resource_id" VARCHAR(191),
    "correlation_id" VARCHAR(191),
    "request_id" VARCHAR(191),
    "source_service" VARCHAR(100) NOT NULL DEFAULT 'coachx-backend',
    "ip_address" VARCHAR(45),
    "user_agent" VARCHAR(512),
    "before_state" JSONB,
    "after_state" JSONB,
    "reason" VARCHAR(1000),
    "metadata" JSONB,

    CONSTRAINT "audit_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "idempotency_keys" (
    "id" UUID NOT NULL,
    "key" VARCHAR(191) NOT NULL,
    "scope" VARCHAR(191) NOT NULL,
    "request_hash" VARCHAR(64),
    "status" "idempotency_status" NOT NULL DEFAULT 'PENDING',
    "response_snapshot" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMPTZ(6),
    "expires_at" TIMESTAMPTZ(6),

    CONSTRAINT "idempotency_keys_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "audit_events_actor_type_actor_id_idx" ON "audit_events"("actor_type", "actor_id");

-- CreateIndex
CREATE INDEX "audit_events_resource_type_resource_id_idx" ON "audit_events"("resource_type", "resource_id");

-- CreateIndex
CREATE INDEX "audit_events_correlation_id_idx" ON "audit_events"("correlation_id");

-- CreateIndex
CREATE INDEX "audit_events_occurred_at_idx" ON "audit_events"("occurred_at");

-- CreateIndex
CREATE INDEX "idempotency_keys_expires_at_idx" ON "idempotency_keys"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "idempotency_keys_scope_key_key" ON "idempotency_keys"("scope", "key");

