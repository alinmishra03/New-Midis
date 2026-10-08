import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * The original MIDIS logo, used unmodified.
 *
 * Two official lockups exist and each has a surface it belongs on:
 *   "icon"     circular black mark with the white 'm' and orange cut —
 *              self-contained, so it sits correctly on LIGHT surfaces.
 *   "wordmark" full "midis" wordmark in white with orange accents —
 *              designed for DARK surfaces.
 *
 * Neither is recoloured, redrawn or reproportioned. A dark-ink version of the
 * horizontal wordmark would let the wordmark appear on light surfaces too;
 * it has been requested from MIDIS (see docs/02-evidence-intake.md).
 */
export function Logo({
  variant = "icon",
  className,
  priority = false,
}: {
  variant?: "icon" | "wordmark";
  className?: string;
  priority?: boolean;
}) {
  if (variant === "wordmark") {
    return (
      <Image
        src="/brand/wordmark-on-dark.png"
        alt="MIDIS"
        width={960}
        height={303}
        priority={priority}
        className={cn("h-8 w-auto", className)}
      />
    );
  }

  return (
    <Image
      src="/brand/icon-512.png"
      alt="MIDIS"
      width={512}
      height={512}
      priority={priority}
      className={cn("h-10 w-10", className)}
    />
  );
}

export function LogoLink({
  variant = "icon",
  className,
  priority = false,
}: {
  variant?: "icon" | "wordmark";
  className?: string;
  priority?: boolean;
}) {
  return (
    <Link
      href="/"
      aria-label="MIDIS — home"
      className={cn("inline-flex items-center rounded-full", className)}
    >
      <Logo variant={variant} priority={priority} />
    </Link>
  );
}
