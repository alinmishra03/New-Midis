import Link from "next/link";
import { Brand } from "@/components/crm/Brand";

/** Sign-in, forgot-password and set-password screens. */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh flex-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <aside className="relative hidden overflow-hidden bg-[#17191c] p-10 text-white lg:flex lg:flex-col lg:justify-between">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -bottom-24 size-[28rem] rounded-full bg-[#ef8716] opacity-[0.12] blur-3xl"
        />
        <Link href="/" className="relative inline-flex w-fit items-center gap-2.5" aria-label="MIDIS website">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/icon-192.png" alt="" className="size-9" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/wordmark-on-dark.png" alt="MIDIS" className="h-5 w-auto" />
        </Link>
        <div className="relative max-w-md">
          <p className="text-xs font-semibold tracking-[0.18em] text-[#ef8716] uppercase">Employee Portal</p>
          <h1 className="mt-4 text-4xl leading-tight font-semibold tracking-tight">
            Everything about your work at MIDIS, in one place.
          </h1>
          <p className="mt-4 text-[0.9375rem] leading-relaxed text-white/65">
            Attendance, leave, tasks, payslips, documents and company updates — for every employee, with HR and managers
            on the same page.
          </p>
        </div>
        <p className="relative text-xs text-white/45">For MIDIS Resources employees only. Access is logged.</p>
      </aside>

      <main className="flex flex-col items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <Brand size="lg" />
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
