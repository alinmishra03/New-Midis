import { notFound } from "next/navigation";

/**
 * Unknown /crm URLs. Without this, Next.js renders the public site's root
 * 404 (with the marketing header) for unmatched paths. Real routes always
 * take precedence over a catch-all, so this only sees genuinely unknown
 * paths, and they get the portal's own 404 inside the signed-in shell.
 */
export default function MissingCrmPage() {
  notFound();
}
