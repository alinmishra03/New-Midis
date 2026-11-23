import "server-only";
import { db, type Tx } from "@/crm/db";
import { auditLogs } from "@/crm/db/schema";

export type AuditEntry = {
  actorUserId: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  summary: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string | null;
};

/**
 * Appends to the audit log. Pass the transaction handle when the audited
 * change happens in one, so the entry commits or rolls back with it.
 *
 * Never put secrets (passwords, tokens) or full salary figures in metadata;
 * record *that* something changed and which fields, not the values.
 */
export async function audit(entry: AuditEntry, tx?: Tx) {
  await (tx ?? db).insert(auditLogs).values({
    actorUserId: entry.actorUserId,
    action: entry.action,
    entityType: entry.entityType,
    entityId: entry.entityId ?? null,
    summary: entry.summary,
    metadata: entry.metadata ?? null,
    ipAddress: entry.ipAddress ?? null,
  });
}
