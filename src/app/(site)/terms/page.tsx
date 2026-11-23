import { PageHero } from "@/components/ui/PageHero";
import { Section } from "@/components/ui/Section";
import { legal } from "@/content/legal";
import { site } from "@/content/site";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Terms of Use",
  description:
    "The terms covering use of the MIDIS website, including the free website audit tool and enquiry form.",
  path: "/terms",
  noIndex: !legal.reviewed,
});

function Clause({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rule pt-8">
      <h2 className="text-xl font-semibold tracking-tight text-ink sm:text-2xl">{title}</h2>
      <div className="mt-4 space-y-4 text-base leading-relaxed text-muted">{children}</div>
    </section>
  );
}

export default function TermsPage() {
  return (
    <>
      <PageHero
        eyebrow="Legal"
        headlineLines={["Terms of use."]}
        intro={`The terms covering your use of this website. Last updated ${legal.lastUpdated}.`}
        visualSeed="terms"
        variant="focus"
crumbs={[{ label: "Terms", href: "/terms" }]}
      />

      <Section tone="surface" className="!pt-0">
        <div className="mx-auto max-w-3xl space-y-10">
          <Clause title="These terms">
            <p>
              This website is operated by {legal.legalEntityName}. By using it you accept these
              terms. If you do not, please don&apos;t use the site.
            </p>
          </Clause>

          <Clause title="What this website is">
            <p>
              This site describes services {legal.legalEntityName} offers and lets you get in
              touch. Nothing on it is a binding offer or a quotation. Any work we do together is
              governed by a separate written agreement, not by this page.
            </p>
          </Clause>

          <Clause title="The free website audit">
            <p>
              The audit tool passes the address you enter to Google&apos;s PageSpeed Insights
              service, which loads the page and measures it. The scores and findings you see come
              from Google, reported as given — we don&apos;t calculate, adjust or estimate them.
            </p>
            <p>
              A Lighthouse score measures how a page is technically built. It is a useful
              starting point, not a complete assessment, and it says nothing about whether a
              website is commercially effective. Please treat the results as information rather
              than advice, and don&apos;t rely on them alone for decisions.
            </p>
            <p>
              Only run an audit against a site you own or are authorised to test. The tool is
              provided for reasonable use; we may limit or withdraw access if it is abused.
            </p>
          </Clause>

          <Clause title="Enquiries">
            <p>
              When you contact us through the form, please send accurate information — we rely on
              it to reply usefully. Don&apos;t submit anyone else&apos;s personal details without
              their agreement, and don&apos;t send confidential material before we have an
              agreement in place to handle it properly.
            </p>
          </Clause>

          <Clause title="Content and intellectual property">
            <p>
              The content, design and code of this website belong to {legal.legalEntityName}
              {" "}unless stated otherwise. You&apos;re welcome to read it, share links to it and
              quote it with attribution. Please don&apos;t republish it wholesale or present it
              as your own.
            </p>
            <p>
              Client work shown on this site remains the property of the respective clients and
              appears with their agreement.
            </p>
          </Clause>

          <Clause title="Accuracy and availability">
            <p>
              We keep this site accurate and current as best we can, but we don&apos;t promise it
              is complete or error-free, and content may change without notice. We also
              don&apos;t guarantee the site is always available — maintenance happens, and so do
              outages.
            </p>
          </Clause>

          <Clause title="Links to other sites">
            <p>
              Where we link elsewhere, we don&apos;t control those sites and aren&apos;t
              responsible for their content or their privacy practices.
            </p>
          </Clause>

          <Clause title="Liability">
            <p>
              We&apos;re not liable for losses arising from your use of this website or from
              reliance on its content, to the extent the law allows us to say so. Nothing here
              limits liability that cannot lawfully be limited.
            </p>
          </Clause>

          <Clause title="Governing law">
            <p>
              These terms are governed by the laws of {legal.governingLaw}, and disputes relating
              to them fall to the courts of {legal.governingLaw}.
            </p>
          </Clause>

          <Clause title="Contact">
            <p>
              Questions about these terms:{" "}
              <a
                href={`mailto:${site.email}`}
                className="text-accent-ink underline underline-offset-4"
              >
                {site.email}
              </a>
              .
            </p>
          </Clause>
        </div>
      </Section>
    </>
  );
}
