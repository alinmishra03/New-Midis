"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { ok, parseForm, runAction, setFlash, ValidationError, zId, type ActionState } from "@/crm/lib/actions";
import { addAdjustment, addSalaryStructure, approveRun, createRun, decideAdjustment, generateRun, markRunPaid } from "@/crm/services/payroll";

const amount = z
  .string()
  .trim()
  .regex(/^\d{1,9}(\.\d{1,2})?$/, "Enter an amount like 25000 or 25000.50.");

/** Parses "Label: amount" lines, e.g. "Conveyance: 1600". */
function lines(raw: unknown, field: string) {
  const text = typeof raw === "string" ? raw : "";
  const out: { label: string; amount: string }[] = [];
  for (const [i, line] of text.split(/\r?\n/).entries()) {
    if (!line.trim()) continue;
    const m = line.match(/^\s*(.+?)\s*[:=]\s*(\d{1,9}(?:\.\d{1,2})?)\s*$/);
    if (!m) throw new ValidationError({ [field]: [`Line ${i + 1}: use “Label: amount”.`] });
    out.push({ label: m[1]!.slice(0, 80), amount: Number(m[2]).toFixed(2) });
  }
  if (out.length > 20) throw new ValidationError({ [field]: ["At most 20 lines."] });
  return out;
}

export async function addStructureAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return runAction(async (viewer) => {
    const base = parseForm(
      z.object({
        employeeId: zId,
        effectiveFrom: z.iso.date({ error: "Choose the effective date." }),
        basic: amount,
        hra: amount.optional().default("0"),
        notes: z.string().max(500).optional().transform((v) => v || null),
      }),
      fd,
    );
    await addSalaryStructure(viewer, { ...base, basic: Number(base.basic).toFixed(2), hra: Number(base.hra).toFixed(2), allowances: lines(fd.get("allowances"), "allowances"), deductions: lines(fd.get("deductions"), "deductions") });
    return ok("Salary structure saved.");
  });
}

export async function addAdjustmentAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return runAction(async (viewer) => {
    const input = parseForm(
      z.object({
        employeeId: zId,
        period: z.string().regex(/^\d{4}-\d{2}$/, "Choose the month."),
        type: z.enum(["bonus", "allowance", "deduction"]),
        label: z.string().trim().min(2, "Describe it.").max(80),
        amount,
      }),
      fd,
    );
    if (Number(input.amount) <= 0) throw new ValidationError({ amount: ["Must be more than zero."] });
    const [y, m] = input.period.split("-").map(Number) as [number, number];
    await addAdjustment(viewer, { employeeId: input.employeeId, year: y, month: m, type: input.type, label: input.label, amount: Number(input.amount).toFixed(2) });
    return ok("Adjustment added. It needs approval before payroll uses it.");
  });
}

export async function decideAdjustmentAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return runAction(async (viewer) => {
    const approve = fd.get("decision") === "approve";
    await decideAdjustment(viewer, zId.parse(fd.get("id")), approve);
    return ok(approve ? "Adjustment approved." : "Adjustment rejected.");
  });
}

export async function createRunAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  let id: string | null = null;
  const result = await runAction(async (viewer) => {
    const period = z.string().regex(/^\d{4}-\d{2}$/).safeParse(fd.get("period"));
    if (!period.success) throw new ValidationError({ period: ["Choose the month."] });
    const [y, m] = period.data.split("-").map(Number) as [number, number];
    const run = await createRun(viewer, y, m);
    id = run.id;
    await setFlash("Payroll run created. Generate the payslips next.");
  });
  if (result?.ok && id) redirect(`/crm/payroll/runs/${id}`);
  return result;
}

export async function generateRunAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return runAction(async (viewer) => {
    const r = await generateRun(viewer, zId.parse(fd.get("id")));
    return ok(`Generated ${r.generated} payslip${r.generated === 1 ? "" : "s"}.${r.skipped.length ? ` Skipped (no salary structure): ${r.skipped.join(", ")}.` : ""}`);
  });
}

export async function approveRunAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return runAction(async (viewer) => {
    await approveRun(viewer, zId.parse(fd.get("id")));
    return ok("Payroll approved. Employees can now see their payslips.");
  });
}

export async function markPaidAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return runAction(async (viewer) => {
    await markRunPaid(viewer, zId.parse(fd.get("id")));
    return ok("Marked as paid.");
  });
}
