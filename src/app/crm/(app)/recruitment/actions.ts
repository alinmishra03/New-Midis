"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { ok, parseForm, runAction, setFlash, zId, type ActionState } from "@/crm/lib/actions";
import { uploadFrom } from "@/crm/lib/storage";
import {
  addCandidate,
  addOnboardingTask,
  cancelInterview,
  hireCandidate,
  saveJob,
  scheduleInterview,
  setCandidateStage,
  startOnboarding,
  submitInterviewFeedback,
  toggleOnboardingTask,
} from "@/crm/services/recruitment";

const optId = z.uuid().optional().transform((v) => v || null);
const optText = (max: number) => z.string().trim().max(max).optional().transform((v) => v || null);

const jobSchema = z.object({
  title: z.string().trim().min(2, "Give the role a title.").max(150),
  departmentId: optId,
  location: optText(120),
  employmentType: z.enum(["full_time", "part_time", "contract", "intern"]),
  description: optText(10000),
  positions: z.coerce.number().int().min(1).max(100),
  status: z.enum(["draft", "open", "on_hold", "closed"]),
  hiringManagerId: optId,
});

export async function saveJobAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  let newId: string | null = null;
  const id = fd.get("id") ? zId.parse(fd.get("id")) : null;
  const result = await runAction(async (viewer) => {
    const job = await saveJob(viewer, id, parseForm(jobSchema, fd));
    if (!id) {
      newId = job.id;
      await setFlash("Job opening created.");
    }
    return ok("Job saved.");
  });
  if (result?.ok && newId) redirect(`/crm/recruitment/jobs/${newId}`);
  return result;
}

export async function addCandidateAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return runAction(async (viewer) => {
    const input = parseForm(
      z.object({
        jobId: zId,
        fullName: z.string().trim().min(2, "Enter the candidate's name.").max(150),
        email: z.string().trim().toLowerCase().pipe(z.email("Enter a valid email.")),
        phone: optText(30),
        source: optText(80),
        notes: optText(2000),
      }),
      fd,
    );
    await addCandidate(viewer, { ...input, resume: uploadFrom(fd, "resume") });
    return ok("Candidate added.");
  });
}

export async function candidateStageAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return runAction(async (viewer) => {
    const stage = z.enum(["applied", "screening", "interview", "offer", "rejected"]).parse(fd.get("stage"));
    await setCandidateStage(viewer, zId.parse(fd.get("id")), stage);
    return ok("Stage updated.");
  });
}

export async function scheduleInterviewAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return runAction(async (viewer) => {
    const input = parseForm(
      z.object({
        candidateId: zId,
        interviewerId: z.uuid({ error: "Choose an interviewer." }),
        date: z.iso.date({ error: "Choose a date." }),
        time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use HH:MM."),
        durationMinutes: z.coerce.number().int().min(15).max(240),
        mode: z.enum(["video", "in_person", "phone"]),
        location: optText(300),
      }),
      fd,
    );
    await scheduleInterview(viewer, input);
    return ok("Interview scheduled. The interviewer has been notified.");
  });
}

export async function interviewFeedbackAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return runAction(async (viewer) => {
    const input = parseForm(
      z.object({
        rating: z.coerce.number({ error: "Choose a rating." }).int().min(1, "Choose a rating.").max(5),
        recommendation: z.enum(["strong_hire", "hire", "hold", "no_hire"]),
        feedback: z.string().trim().min(10, "Write at least a sentence.").max(5000),
      }),
      fd,
    );
    await submitInterviewFeedback(viewer, zId.parse(fd.get("id")), input);
    return ok("Feedback saved.");
  });
}

export async function cancelInterviewAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return runAction(async (viewer) => {
    await cancelInterview(viewer, zId.parse(fd.get("id")));
    return ok("Interview cancelled.");
  });
}

export async function hireAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  let employeeId: string | null = null;
  const result = await runAction(async (viewer) => {
    const input = parseForm(
      z.object({ email: z.string().trim().toLowerCase().pipe(z.email("Enter their new company email.")), joiningDate: z.iso.date({ error: "Choose the joining date." }), designationId: optId, managerId: optId }),
      fd,
    );
    const created = await hireCandidate(viewer, zId.parse(fd.get("id")), input);
    employeeId = created.employeeId;
    await setFlash("Hired. Their employee record and onboarding checklist are ready — get their activation link below.");
  });
  if (result?.ok && employeeId) redirect(`/crm/employees/${employeeId}?invite=1`);
  return result;
}

export async function startOnboardingAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return runAction(async (viewer) => {
    await startOnboarding(viewer, zId.parse(fd.get("employeeId")));
    return ok("Onboarding checklist created.");
  });
}

export async function toggleOnboardingAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return runAction(async (viewer) => {
    await toggleOnboardingTask(viewer, zId.parse(fd.get("id")), fd.get("done") === "1");
    return ok();
  });
}

export async function addOnboardingTaskAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return runAction(async (viewer) => {
    const input = parseForm(
      z.object({ employeeId: zId, title: z.string().trim().min(2, "Describe the item.").max(200), category: z.enum(["documents", "accounts", "department", "manager", "formalities"]), dueDate: z.iso.date().optional().transform((v) => v || null) }),
      fd,
    );
    await addOnboardingTask(viewer, input.employeeId, input.title, input.category, input.dueDate);
    return ok("Checklist item added.");
  });
}
