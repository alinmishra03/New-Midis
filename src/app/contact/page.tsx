import { ContactPageContent } from "@/components/contact/ContactPageContent";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Contact Us — Start Your Website Project",
  description:
    "Contact MIDIS to start a website design, development, SEO or AI project. Tell us what you're trying to achieve and we'll reply with an honest view of fit.",
  path: "/contact",
});

export default function ContactPage() {
  return <ContactPageContent variant="project" crumbs={[{ label: "Contact", href: "/contact" }]} />;
}
