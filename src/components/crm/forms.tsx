"use client";

import { CircleAlert, CircleCheck, Eye, EyeOff, LoaderCircle, X } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  createContext,
  useActionState,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
  useTransition,
  type ComponentProps,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";
import { directUploadInputs, prepareDirectUploads, useDirectUpload } from "./direct-upload";
import { buttonClass, type ButtonSize, type ButtonVariant } from "./ui";

/** Mirrors crm/lib/actions.ts ActionState (kept separate: that module is server-only). */
export type ActionState = {
  ok: boolean;
  message?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  data?: Record<string, string>;
  at?: number;
} | null;
export type FormAction = (prev: ActionState, fd: FormData) => Promise<ActionState>;

/* =================================================================== toasts */

type Toast = { id: number; message: string; tone: "success" | "error" };
let toasts: Toast[] = [];
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export function toast(message: string, tone: Toast["tone"] = "success") {
  const id = Date.now() + Math.random();
  toasts = [...toasts, { id, message, tone }].slice(-4);
  emit();
  setTimeout(() => dismiss(id), tone === "error" ? 7000 : 4500);
}
function dismiss(id: number) {
  toasts = toasts.filter((t) => t.id !== id);
  emit();
}

/** Toast stack. Also shows the one-shot flash message that redirecting actions leave in a cookie. */
export function Toaster() {
  const list = useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => toasts,
    () => toasts,
  );

  useEffect(() => {
    const match = document.cookie.match(/(?:^|;\s*)crm_flash=([^;]+)/);
    if (!match) return;
    document.cookie = "crm_flash=; Max-Age=0; path=/crm";
    try {
      const { message, tone } = JSON.parse(decodeURIComponent(match[1]!));
      if (typeof message === "string") toast(message, tone === "error" ? "error" : "success");
    } catch {
      /* ignore malformed flash */
    }
  });

  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-0 z-[80] flex flex-col items-center gap-2 p-4 sm:items-end">
      {list.map((t) => (
        <div
          key={t.id}
          role={t.tone === "error" ? "alert" : "status"}
          className="crm-enter pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border border-c-border bg-c-surface p-3.5 pr-2.5 text-sm text-c-fg shadow-c-lg"
        >
          {t.tone === "error" ? (
            <CircleAlert className="mt-0.5 size-4 shrink-0 text-c-danger" />
          ) : (
            <CircleCheck className="mt-0.5 size-4 shrink-0 text-c-success" />
          )}
          <p className="min-w-0 flex-1">{t.message}</p>
          <button type="button" onClick={() => dismiss(t.id)} className="rounded p-0.5 text-c-subtle hover:text-c-fg" aria-label="Dismiss">
            <X className="size-4" />
          </button>
        </div>
      ))}
    </div>
  );
}

/* ==================================================================== forms */

const FormErrors = createContext<Record<string, string[] | undefined>>({});
const FormPending = createContext(false);

/**
 * A form bound to a Server Action through useActionState. Shows the result
 * as a toast, exposes field errors to the fields inside it, and optionally
 * resets or refreshes on success.
 */
export function ActionForm({
  action,
  children,
  className,
  resetOnSuccess = false,
  onSuccess,
  showMessage = true,
  ...rest
}: Omit<ComponentProps<"form">, "action" | "onSubmit"> & {
  action: FormAction;
  resetOnSuccess?: boolean;
  onSuccess?: (state: NonNullable<ActionState>) => void;
  showMessage?: boolean;
}) {
  const [state, formAction, actionPending] = useActionState(action, null);
  const [transitionPending, startTransition] = useTransition();
  const ref = useRef<HTMLFormElement>(null);
  const router = useRouter();
  const last = useRef<number | undefined>(undefined);
  const directUpload = useDirectUpload();
  const uploaded = useRef(new WeakMap<File, string>());

  useEffect(() => {
    if (!state || state.at === last.current) return;
    last.current = state.at;
    if (state.message && showMessage) toast(state.message, state.ok ? "success" : "error");
    if (state.ok) {
      if (resetOnSuccess) ref.current?.reset();
      onSuccess?.(state);
      router.refresh();
    }
  }, [state, resetOnSuccess, onSuccess, showMessage, router]);

  return (
    <FormErrors.Provider value={state?.ok === false ? (state.fieldErrors ?? {}) : {}}>
      <FormPending.Provider value={actionPending || transitionPending}>
        {/*
          Submitted through a transition rather than the `action` prop: React
          19 resets a form after an `action` submission, which would wipe what
          the user typed whenever validation fails (e.g. the email on a wrong
          password). Successful submissions reset explicitly via resetOnSuccess.
        */}
        <form
          ref={ref}
          className={className}
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget, (e.nativeEvent as SubmitEvent).submitter);
            const uploads = directUpload.enabled ? directUploadInputs(e.currentTarget) : [];
            if (!uploads.length) {
              startTransition(() => formAction(fd));
              return;
            }
            // Large files go straight to private Blob storage first (see direct-upload.tsx);
            // the button shows its pending state throughout.
            startTransition(async () => {
              const error = await prepareDirectUploads(uploads, fd, directUpload, uploaded.current);
              if (error) {
                toast(error, "error");
                return;
              }
              startTransition(() => formAction(fd));
            });
          }}
          {...rest}
        >
          {children}
        </form>
      </FormPending.Provider>
    </FormErrors.Provider>
  );
}

export function useFieldError(name: string) {
  return useContext(FormErrors)[name];
}

export function SubmitButton({
  children,
  variant = "primary",
  size = "md",
  className,
  pendingLabel,
  ...props
}: ComponentProps<"button"> & { variant?: ButtonVariant; size?: ButtonSize; pendingLabel?: string }) {
  const pending = useContext(FormPending);
  return (
    <button type="submit" disabled={pending || props.disabled} aria-disabled={pending} className={buttonClass(variant, size, className)} {...props}>
      {pending && <LoaderCircle className="animate-spin" />}
      {pending && pendingLabel ? pendingLabel : children}
    </button>
  );
}

/* =================================================================== fields */

export const inputClass =
  "block w-full rounded-lg border border-c-border bg-c-surface px-3 py-2 text-sm text-c-fg shadow-c placeholder:text-c-subtle transition-colors hover:border-c-border-strong focus:border-c-accent focus:outline-none focus-visible:outline-none focus:ring-3 focus:ring-c-accent/20 disabled:cursor-not-allowed disabled:opacity-60 aria-invalid:border-c-danger aria-invalid:focus:ring-c-danger/20";

export function Field({
  label,
  name,
  hint,
  required,
  children,
  className,
  id,
}: {
  label: ReactNode;
  name: string;
  hint?: ReactNode;
  required?: boolean;
  children: (props: { id: string; "aria-invalid"?: true; "aria-describedby"?: string }) => ReactNode;
  className?: string;
  id?: string;
}) {
  const auto = useId();
  const fieldId = id ?? `${name}-${auto}`;
  const errors = useFieldError(name);
  const describedBy = errors ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined;
  return (
    <div className={cn("min-w-0", className)}>
      <label htmlFor={fieldId} className="mb-1.5 block text-[0.8125rem] font-medium text-c-fg">
        {label}
        {required && <span className="text-c-danger"> *</span>}
      </label>
      {children({ id: fieldId, ...(errors ? { "aria-invalid": true as const } : {}), ...(describedBy ? { "aria-describedby": describedBy } : {}) })}
      {errors ? (
        <p id={`${fieldId}-error`} className="mt-1.5 text-xs text-c-danger">
          {errors.join(" ")}
        </p>
      ) : hint ? (
        <p id={`${fieldId}-hint`} className="mt-1.5 text-xs text-c-subtle">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

type BaseFieldProps = { label: ReactNode; name: string; hint?: ReactNode; required?: boolean; className?: string };

export function TextField({ label, name, hint, required, className, ...input }: BaseFieldProps & Omit<ComponentProps<"input">, "name">) {
  return (
    <Field label={label} name={name} hint={hint} required={required} className={className}>
      {(p) => <input name={name} required={required} className={inputClass} {...p} {...input} />}
    </Field>
  );
}

export function TextAreaField({ label, name, hint, required, className, rows = 4, ...input }: BaseFieldProps & Omit<ComponentProps<"textarea">, "name">) {
  return (
    <Field label={label} name={name} hint={hint} required={required} className={className}>
      {(p) => <textarea name={name} rows={rows} required={required} className={cn(inputClass, "resize-y")} {...p} {...input} />}
    </Field>
  );
}

export function SelectField({
  label,
  name,
  hint,
  required,
  className,
  options,
  placeholder,
  ...select
}: BaseFieldProps &
  Omit<ComponentProps<"select">, "name"> & { options: { value: string; label: string }[]; placeholder?: string }) {
  return (
    <Field label={label} name={name} hint={hint} required={required} className={className}>
      {(p) => (
        <select name={name} required={required} className={cn(inputClass, "pr-8")} {...p} {...select}>
          {placeholder !== undefined && <option value="">{placeholder}</option>}
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      )}
    </Field>
  );
}

export function CheckboxField({ label, name, hint, className, ...input }: { label: ReactNode; name: string; hint?: ReactNode; className?: string } & Omit<ComponentProps<"input">, "name" | "type">) {
  const id = useId();
  return (
    <div className={cn("flex items-start gap-2.5", className)}>
      <input id={id} type="checkbox" name={name} className="mt-0.5 size-4 rounded border-c-border-strong accent-[var(--c-accent)]" {...input} />
      <label htmlFor={id} className="text-sm text-c-fg">
        {label}
        {hint && <span className="block text-xs text-c-subtle">{hint}</span>}
      </label>
    </div>
  );
}

export function PasswordField({ label, name, hint, required, className, ...input }: BaseFieldProps & Omit<ComponentProps<"input">, "name" | "type">) {
  const [show, setShow] = useState(false);
  return (
    <Field label={label} name={name} hint={hint} required={required} className={className}>
      {(p) => (
        <div className="relative">
          <input name={name} type={show ? "text" : "password"} required={required} className={cn(inputClass, "pr-10")} {...p} {...input} />
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-c-subtle hover:text-c-fg"
            aria-label={show ? "Hide password" : "Show password"}
            aria-pressed={show}
          >
            {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
      )}
    </Field>
  );
}

export function FormMessage() {
  const errors = useFieldError("form");
  return errors ? <p className="text-sm text-c-danger">{errors.join(" ")}</p> : null;
}

/* ================================================================== dialogs */

/**
 * A modal built on the native <dialog> element (focus trapping, Esc to close
 * and the backdrop come from the browser).
 */
export function Dialog({
  trigger,
  title,
  description,
  children,
  open: controlledOpen,
  onOpenChange,
  size = "md",
}: {
  trigger?: (open: () => void) => ReactNode;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode | ((close: () => void) => ReactNode);
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  size?: "sm" | "md" | "lg";
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [innerOpen, setInnerOpen] = useState(false);
  const open = controlledOpen ?? innerOpen;
  const setOpen = (v: boolean) => {
    setInnerOpen(v);
    onOpenChange?.(v);
  };

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  const close = () => setOpen(false);
  return (
    <>
      {trigger?.(() => setOpen(true))}
      <dialog
        ref={ref}
        onClose={() => setOpen(false)}
        onClick={(e) => {
          if (e.target === ref.current) close();
        }}
        className={cn(
          "m-auto w-[calc(100%-2rem)] rounded-2xl border border-c-border bg-c-surface p-0 text-c-fg shadow-c-lg backdrop:bg-black/40 backdrop:backdrop-blur-[2px]",
          size === "sm" && "max-w-md",
          size === "md" && "max-w-xl",
          size === "lg" && "max-w-3xl",
        )}
      >
        {open && (
          <div className="max-h-[85dvh] overflow-y-auto">
            <header className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-c-border bg-c-surface px-5 py-4">
              <div>
                <h2 className="text-base font-semibold">{title}</h2>
                {description && <p className="mt-0.5 text-[0.8125rem] text-c-muted">{description}</p>}
              </div>
              <button type="button" onClick={close} className="rounded-md p-1 text-c-subtle hover:bg-c-hover hover:text-c-fg" aria-label="Close">
                <X className="size-4" />
              </button>
            </header>
            <div className="p-5">{typeof children === "function" ? children(close) : children}</div>
          </div>
        )}
      </dialog>
    </>
  );
}

/**
 * A button that asks for confirmation, then submits a Server Action with the
 * given hidden fields. Used for destructive or significant one-click actions.
 */
export function ConfirmAction({
  action,
  fields,
  label,
  title,
  description,
  confirmLabel = "Confirm",
  variant = "secondary",
  size = "sm",
  confirmVariant = "primary",
  icon,
  withComment,
  commentLabel = "Comment (optional)",
  commentRequired,
  ariaLabel,
}: {
  ariaLabel?: string;
  action: FormAction;
  fields: Record<string, string>;
  label: ReactNode;
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  confirmVariant?: ButtonVariant;
  icon?: ReactNode;
  withComment?: boolean;
  commentLabel?: string;
  commentRequired?: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
      size="sm"
      title={title}
      description={description}
      trigger={(o) => (
        <button type="button" onClick={o} className={buttonClass(variant, size)} aria-label={ariaLabel}>
          {icon}
          {label}
        </button>
      )}
    >
      <ActionForm action={action} onSuccess={() => setOpen(false)} className="space-y-4">
        {Object.entries(fields).map(([k, v]) => (
          <input key={k} type="hidden" name={k} value={v} />
        ))}
        {withComment && <TextAreaField name="comment" label={commentLabel} rows={3} required={commentRequired} />}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={() => setOpen(false)} className={buttonClass("secondary")}>
            Cancel
          </button>
          <SubmitButton variant={confirmVariant}>{confirmLabel}</SubmitButton>
        </div>
      </ActionForm>
    </Dialog>
  );
}

/** Copy-to-clipboard for one-time links shown to HR. */
export function CopyField({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div>
      <p className="mb-1.5 text-[0.8125rem] font-medium">{label}</p>
      <div className="flex gap-2">
        <input readOnly value={value} className={cn(inputClass, "font-mono text-xs")} onFocus={(e) => e.currentTarget.select()} />
        <button
          type="button"
          className={buttonClass("secondary")}
          onClick={async () => {
            await navigator.clipboard.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </div>
  );
}
