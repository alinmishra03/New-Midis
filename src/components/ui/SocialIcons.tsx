import type { ReactNode } from "react";

/**
 * Brand glyphs for the official MIDIS profiles, keyed by the `name` already
 * used in content/site.ts.
 *
 * One definition, shared by the footer and the announcement bar. Keeping a
 * second copy next to whichever component needed it next is how two sets of
 * brand marks end up subtly different from each other.
 *
 * An unrecognised name returns undefined, which every caller treats as "fall
 * back to a text link" — so adding a profile to site.ts can never render a
 * blank button.
 */
export const SOCIAL_ICON_PATHS: Record<string, ReactNode> = {
  LinkedIn: (
    <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.13 1.45-2.13 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.63-1.85 3.36-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.56V9h3.56v11.45z" />
  ),
  Instagram: (
    <path
      fillRule="evenodd"
      d="M7.8 2h8.4A5.8 5.8 0 0 1 22 7.8v8.4A5.8 5.8 0 0 1 16.2 22H7.8A5.8 5.8 0 0 1 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2zm0 2A3.8 3.8 0 0 0 4 7.8v8.4A3.8 3.8 0 0 0 7.8 20h8.4a3.8 3.8 0 0 0 3.8-3.8V7.8A3.8 3.8 0 0 0 16.2 4H7.8zm4.2 3.2a4.8 4.8 0 1 1 0 9.6 4.8 4.8 0 0 1 0-9.6zm0 2a2.8 2.8 0 1 0 0 5.6 2.8 2.8 0 0 0 0-5.6zm5.4-3.9a1.3 1.3 0 1 1 0 2.6 1.3 1.3 0 0 1 0-2.6z"
    />
  ),
  YouTube: (
    <path
      fillRule="evenodd"
      d="M21.6 7.2a2.8 2.8 0 0 0-1.97-1.98C17.9 4.75 12 4.75 12 4.75s-5.9 0-7.63.47A2.8 2.8 0 0 0 2.4 7.2C1.93 8.93 1.93 12 1.93 12s0 3.07.47 4.8a2.8 2.8 0 0 0 1.97 1.98c1.73.47 7.63.47 7.63.47s5.9 0 7.63-.47a2.8 2.8 0 0 0 1.97-1.98c.47-1.73.47-4.8.47-4.8s0-3.07-.47-4.8zM10.1 15.3V8.7l5.7 3.3-5.7 3.3z"
    />
  ),
  Facebook: (
    <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5.02 3.66 9.18 8.44 9.94v-7.03H7.9v-2.9h2.54V9.85c0-2.5 1.49-3.89 3.77-3.89 1.1 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56v1.88h2.78l-.45 2.9h-2.33V22c4.78-.76 8.44-4.92 8.44-9.94z" />
  ),
};

/**
 * WhatsApp, kept here with the other brand marks rather than redrawn at each
 * call site. Not part of SOCIAL_ICON_PATHS because WhatsApp is not one of
 * the profiles in site.socials — it is a contact channel, and the two lists
 * are consumed in different places.
 */
export function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" className={className} fill="currentColor">
      <path d="M17.5 14.4c-.3-.2-1.7-.9-2-1-.3-.1-.5-.2-.7.1s-.7 1-.9 1.2c-.2.2-.3.2-.6.1a8 8 0 0 1-4-3.5c-.3-.5.3-.5.8-1.5.1-.2 0-.4 0-.5l-1-2.2c-.2-.6-.4-.5-.6-.5H7.9c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.2.2 2.1 3.3 5.2 4.5 1.9.8 2.7.9 3.6.8.6-.1 1.7-.7 2-1.4.2-.7.2-1.2.2-1.4-.1-.1-.3-.2-.6-.3Z" />
      <path d="M12 2a10 10 0 0 0-8.6 15L2 22l5.2-1.4A10 10 0 1 0 12 2Zm0 18.2c-1.6 0-3.1-.4-4.4-1.2l-.3-.2-3.1.8.8-3-.2-.3A8.2 8.2 0 1 1 12 20.2Z" />
    </svg>
  );
}

/** Renders one brand glyph, or nothing if the name has no mark defined. */
export function SocialIcon({ name, className }: { name: string; className?: string }) {
  const path = SOCIAL_ICON_PATHS[name];
  if (!path) return null;

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" className={className} fill="currentColor">
      {path}
    </svg>
  );
}
