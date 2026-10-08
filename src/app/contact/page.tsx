import { ContactPageContent } from "@/components/contact/ContactPageContent";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Contact MIDIS",
  description:
    "Start a project with MIDIS. Tell us what you're trying to achieve and we'll tell you honestly whether we're the right people to help.",
  path: "/contact",
});

export default function ContactPage() {
  return <ContactPageContent variant="project" crumbs={[{ label: "Contact", href: "/contact" }]} />;
}
