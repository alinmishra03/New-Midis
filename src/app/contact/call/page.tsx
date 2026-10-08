import { ContactPageContent } from "@/components/contact/ContactPageContent";
import { buildMetadata } from "@/lib/seo";

/**
 * Strategy-call variant of the contact page.
 *
 * Noindexed with a canonical back to /contact, so the two pages never compete
 * in search or read as thin duplicate content.
 */
export const metadata = {
  ...buildMetadata({
    title: "Book a Strategy Call",
    description:
      "Book a strategy call with MIDIS. A conversation about where your business is now and where you want it to be — not a sales pitch.",
    path: "/contact",
    noIndex: true,
  }),
};

export default function ContactCallPage() {
  return (
    <ContactPageContent
      variant="call"
      crumbs={[
        { label: "Contact", href: "/contact" },
        { label: "Book a call", href: "/contact/call" },
      ]}
    />
  );
}
