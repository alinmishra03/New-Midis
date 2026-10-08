import { PageHero } from "@/components/ui/PageHero";
import { Section } from "@/components/ui/Section";
import { cookieList, dataProcessors, legal } from "@/content/legal";
import { site } from "@/content/site";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Privacy Policy",
  description:
    "What MIDIS collects through this website, where it is stored, who it is shared with, and how to ask us to delete it.",
  path: "/privacy",
  // Kept out of the index until MIDIS has reviewed the text.
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

export default function PrivacyPage() {
  return (
    <>
      <PageHero
        eyebrow="Legal"
        headlineLines={["Privacy policy."]}
        intro={`What this website collects, where it goes, and how to get it removed. Last updated ${legal.lastUpdated}.`}
        visualSeed="privacy"
        variant="focus"
crumbs={[{ label: "Privacy Policy", href: "/privacy" }]}
      />

      <Section tone="surface" className="!pt-0">
        <div className="mx-auto max-w-3xl space-y-10">
          <Clause title="Who we are">
            <p>
              {legal.legalEntityName} is a website design and development agency based at{" "}
              {site.address.street}, {site.address.locality}, {site.address.region},{" "}
              {site.address.countryName}. For anything in this policy, contact{" "}
              <a
                href={`mailto:${legal.privacyContactEmail}`}
                className="text-accent-ink underline underline-offset-4"
              >
                {legal.privacyContactEmail}
              </a>
              .
            </p>
          </Clause>

          <Clause title="What we collect, and when">
            <p>
              <strong className="text-ink">When you submit the enquiry form.</strong> We collect
              your name, email address and message, because we cannot reply without them.
              Optionally — only if you choose to provide them — your phone or WhatsApp number,
              business name, website address, the service you&apos;re interested in, your budget
              range and your timeline. We ask for these to give you a more useful response, and
              the form works without them.
            </p>
            <p>
              <strong className="text-ink">When you use the free website audit.</strong> We take
              the website address you type in. We do not ask for or collect any personal details
              to run an audit.
            </p>
            <p>
              <strong className="text-ink">Automatically, on every visit.</strong> Our server
              briefly sees your IP address as part of handling the request. We use it only to
              limit how many enquiries can be submitted from one place in a short period, which
              is how we keep spam out. It is held in memory for that purpose and is not written
              to a database or used to identify you.
            </p>
            <p>
              <strong className="text-ink">If you accept analytics cookies.</strong> Pages you
              view, roughly where you are, what device and browser you use, and actions such as
              starting an enquiry. You can decline, and nothing in this paragraph happens.
            </p>
          </Clause>

          <Clause title="Why we are allowed to use it">
            <p>
              We use your enquiry details to respond to you and to keep a record of our business
              conversations. We use analytics only where you have given consent, and you can
              withdraw that at any time using the cookie settings link in the footer.
            </p>
          </Clause>

          <Clause title="Who else sees it">
            <p>
              We do not sell your data and we do not share it for anyone else&apos;s marketing.
              These are the services involved in running this website:
            </p>
            <div className="mt-6 overflow-x-auto">
              <table className="w-full min-w-[34rem] text-left text-sm">
                <thead>
                  <tr>
                    <th className="border-b border-line pb-3 pr-4 font-semibold text-ink">
                      Service
                    </th>
                    <th className="border-b border-line pb-3 pr-4 font-semibold text-ink">
                      What it receives
                    </th>
                    <th className="border-b border-line pb-3 font-semibold text-ink">When</th>
                  </tr>
                </thead>
                <tbody>
                  {dataProcessors.map((p) => (
                    <tr key={p.name}>
                      <td className="border-b border-line py-3 pr-4 align-top text-ink">
                        {p.name}
                        <span className="mt-1 block text-xs text-muted">{p.purpose}</span>
                      </td>
                      <td className="border-b border-line py-3 pr-4 align-top text-muted">
                        {p.data}
                      </td>
                      <td className="border-b border-line py-3 align-top text-muted">{p.when}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Clause>

          <Clause title="Cookies and similar storage">
            <p>
              The site sets nothing for tracking until you accept. Your choice itself is stored
              in your browser so we stop asking — that is the only thing stored if you decline.
            </p>
            <div className="mt-6 overflow-x-auto">
              <table className="w-full min-w-[34rem] text-left text-sm">
                <thead>
                  <tr>
                    <th className="border-b border-line pb-3 pr-4 font-semibold text-ink">Name</th>
                    <th className="border-b border-line pb-3 pr-4 font-semibold text-ink">Type</th>
                    <th className="border-b border-line pb-3 pr-4 font-semibold text-ink">
                      Purpose
                    </th>
                    <th className="border-b border-line pb-3 font-semibold text-ink">Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {cookieList.map((c) => (
                    <tr key={c.name}>
                      <td className="border-b border-line py-3 pr-4 align-top font-mono text-xs text-ink">
                        {c.name}
                      </td>
                      <td className="border-b border-line py-3 pr-4 align-top text-muted">
                        {c.type}
                      </td>
                      <td className="border-b border-line py-3 pr-4 align-top text-muted">
                        {c.purpose}
                      </td>
                      <td className="border-b border-line py-3 align-top text-muted">
                        {c.duration}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-6">
              We self-host the fonts this site uses, so loading a page does not send a request to
              a font provider.
            </p>
          </Clause>

          <Clause title="How long we keep it">
            <p>We keep enquiry details {legal.retentionPeriod}.</p>
            <p>
              Analytics data is retained according to the settings on our Google Analytics and
              Meta accounts.
            </p>
          </Clause>

          <Clause title="Your choices">
            <p>
              You can ask us what we hold about you, ask us to correct it, or ask us to delete
              it. Email{" "}
              <a
                href={`mailto:${legal.privacyContactEmail}`}
                className="text-accent-ink underline underline-offset-4"
              >
                {legal.privacyContactEmail}
              </a>{" "}
              and we will deal with it.
            </p>
            <p>
              You can withdraw analytics consent at any time with the cookie settings link in the
              footer. You can also block cookies in your browser; the site will still work.
            </p>
          </Clause>

          <Clause title="Changes">
            <p>
              If we change how this website handles data, we will update this page and the date
              at the top.
            </p>
          </Clause>
        </div>
      </Section>
    </>
  );
}
