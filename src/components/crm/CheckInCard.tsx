"use client";

import { Coffee, House, LogIn, LogOut, MapPin } from "lucide-react";
import { useEffect, useState } from "react";
import { checkInAction, checkOutAction, endBreakAction, startBreakAction } from "@/app/crm/(app)/attendance/actions";
import { ActionForm, SubmitButton } from "./forms";
import { Badge } from "./ui";

export type CheckInState = {
  timezone: string;
  isWorkingDay: boolean;
  isHoliday: boolean;
  onLeave: "none" | "full" | "half";
  wfhApproved: boolean;
  allowUnplannedRemote: boolean;
  /** e.g. "Second shift (9:30 AM – 6:30 PM)". */
  scheduleLabel: string;
  /** e.g. "9:30 AM". */
  scheduleStart: string;
  checkInAt: string | null;
  checkOutAt: string | null;
  workMode: "office" | "remote" | null;
  lateMinutes: number;
  breakMinutes: number;
  workedMinutes: number;
  openBreakStartedAt: string | null;
  /** Closed-break minutes so far, to compute the live timer. */
  closedBreakMinutes: number;
};

function fmt(min: number) {
  const m = Math.max(0, Math.floor(min));
  return `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, "0")}m`;
}

function time(iso: string, tz: string) {
  return new Intl.DateTimeFormat("en-IN", { hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: tz }).format(new Date(iso));
}

/** Today's attendance with check-in/out and breaks. The server records every timestamp. */
export function CheckInCard({ state }: { state: CheckInState }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!state.checkInAt || state.checkOutAt) return;
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, [state.checkInAt, state.checkOutAt]);

  const live =
    state.checkInAt && !state.checkOutAt
      ? (now - new Date(state.checkInAt).getTime()) / 60000 -
        state.closedBreakMinutes -
        (state.openBreakStartedAt ? (now - new Date(state.openBreakStartedAt).getTime()) / 60000 : 0)
      : state.workedMinutes;

  const status = state.checkOutAt
    ? { label: "Checked out", tone: "neutral" as const }
    : state.openBreakStartedAt
      ? { label: "On a break", tone: "warning" as const }
      : state.checkInAt
        ? { label: state.workMode === "remote" ? "Working remotely" : "Checked in", tone: "success" as const }
        : state.onLeave === "full"
          ? { label: "On leave", tone: "info" as const }
          : !state.isWorkingDay
            ? { label: state.isHoliday ? "Holiday" : "Day off", tone: "neutral" as const }
            : { label: "Not checked in", tone: "neutral" as const };

  const canRemote = state.wfhApproved || state.allowUnplannedRemote;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[0.8125rem] text-c-muted">Worked today</p>
          <p className="tabular mt-0.5 text-3xl font-semibold tracking-tight">{fmt(live)}</p>
        </div>
        <Badge tone={status.tone} dot>
          {status.label}
        </Badge>
      </div>

      <dl className="mt-4 grid grid-cols-3 gap-3 rounded-lg bg-c-surface-2 p-3 text-[0.8125rem]">
        <div>
          <dt className="text-c-subtle">Check-in</dt>
          <dd className="tabular font-medium">{state.checkInAt ? time(state.checkInAt, state.timezone) : "—"}</dd>
        </div>
        <div>
          <dt className="text-c-subtle">Check-out</dt>
          <dd className="tabular font-medium">{state.checkOutAt ? time(state.checkOutAt, state.timezone) : "—"}</dd>
        </div>
        <div>
          <dt className="text-c-subtle">Breaks</dt>
          <dd className="tabular font-medium">{fmt(state.closedBreakMinutes + (state.openBreakStartedAt ? (now - new Date(state.openBreakStartedAt).getTime()) / 60000 : 0))}</dd>
        </div>
      </dl>

      {state.lateMinutes > 0 && <p className="mt-2 text-xs text-c-warning">Checked in {state.lateMinutes} minutes after the {state.scheduleStart} start.</p>}

      <div className="mt-4 flex flex-wrap gap-2">
        {!state.checkInAt && state.onLeave !== "full" && (
          <>
            <ActionForm action={checkInAction}>
              <input type="hidden" name="mode" value="office" />
              <SubmitButton pendingLabel="Checking in…">
                <LogIn /> Check in
              </SubmitButton>
            </ActionForm>
            {canRemote && (
              <ActionForm action={checkInAction}>
                <input type="hidden" name="mode" value="remote" />
                <SubmitButton variant="secondary" pendingLabel="Checking in…">
                  <House /> Check in remotely
                </SubmitButton>
              </ActionForm>
            )}
          </>
        )}
        {state.checkInAt && !state.checkOutAt && (
          <>
            {state.openBreakStartedAt ? (
              <ActionForm action={endBreakAction}>
                <SubmitButton variant="secondary">
                  <Coffee /> End break
                </SubmitButton>
              </ActionForm>
            ) : (
              <ActionForm action={startBreakAction}>
                <SubmitButton variant="secondary">
                  <Coffee /> Start break
                </SubmitButton>
              </ActionForm>
            )}
            <ActionForm action={checkOutAction}>
              <SubmitButton pendingLabel="Checking out…">
                <LogOut /> Check out
              </SubmitButton>
            </ActionForm>
          </>
        )}
      </div>

      <p className="mt-3 flex items-center gap-1.5 text-xs text-c-subtle">
        <MapPin className="size-3.5" /> {state.scheduleLabel}
        {state.wfhApproved && " · WFH approved today"}
        {state.onLeave === "half" && " · Half-day leave today"}
      </p>
    </div>
  );
}
