import Image from "next/image";
import { cn } from "@/lib/utils";

/** MIDIS mark + wordmark, with the wordmark swapped for the dark theme. */
export function Brand({ className, size = "md" }: { className?: string; size?: "md" | "lg" }) {
  const icon = size === "lg" ? "size-11" : "size-8";
  const word = size === "lg" ? "h-6" : "h-[1.05rem]";
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <Image src="/brand/icon-192.png" alt="" width={192} height={192} className={cn("shrink-0", icon)} priority />
      <Image src="/brand/wordmark-on-light.png" alt="MIDIS" width={960} height={303} className={cn("w-auto crm-dark:hidden", word)} priority />
      <Image src="/brand/wordmark-on-dark.png" alt="MIDIS" width={960} height={303} className={cn("hidden w-auto crm-dark:block", word)} priority />
    </span>
  );
}
