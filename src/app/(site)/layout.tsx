import { SiteChrome } from "@/components/layout/SiteChrome";

/** The public marketing site. URLs are unaffected: (site) is a route group. */
export default function SiteLayout({ children }: LayoutProps<"/">) {
  return <SiteChrome>{children}</SiteChrome>;
}
