import { FormEvent, useState } from "react"
import { loginAdmin } from "../auth/adminSession"
import { useCms } from "../cms/CmsProvider"
import { AppLink, navigate, resolvePublicAsset } from "../lib/router"
import NewsCard from "../components/NewsCard"
import CertificatePreviewModal from "../components/CertificatePreviewModal"
import LeaderCard from "../components/LeaderCard"
import { leaders } from "../content/leadership"
import {
  ButtonLink,
  Icon,
  IconName,
  Reveal,
  SectionHeading,
} from "../components/ui"
import { fixedHero } from "../content/fixedHero"

interface TrustItem {
  icon: IconName
  label: string
  detail: string
}

const trustItems: TrustItem[] = [
  {
    icon: "building",
    label: "Section 8 Company",
    detail: "Licence No. 174891",
  },
  {
    icon: "document",
    label: "12AB Registered",
    detail: "Provisional registration",
  },
  { icon: "shield", label: "80G Approved", detail: "Provisional approval" },
  { icon: "reports", label: "CSR Registered", detail: "CSR00104011" },
]

function Hero() {
  const hero = fixedHero
  return (
    <section className="hero" id="home">
      <img
        className="hero__image"
        src={resolvePublicAsset(hero.imageUrl)}
        alt={hero.imageAlt}
        fetchPriority="high"
      />
      <div className="hero__veil" />
      <div className="hero__shape hero__shape--one" />
      <div className="hero__shape hero__shape--two" />
      <div className="hero__content page-shell">
        <div className="hero__identity">
          <span />
          {hero.eyebrow}
        </div>
        <h1>
          {hero.title} <em>{hero.highlight}</em>
        </h1>
        <p>{hero.body}</p>
        <div className="hero__actions">
          <ButtonLink to={hero.primaryCta.href}>
            {hero.primaryCta.label}
          </ButtonLink>
          <ButtonLink to={hero.secondaryCta.href} kind="light">
            {hero.secondaryCta.label}
          </ButtonLink>
        </div>
        <div className="hero__credential">
          <Icon name="shield" size={18} />
          <span>Section 8 Company</span>
          <i />
          <span>80G provisionally approved</span>
        </div>
      </div>
      <a
        className="scroll-cue"
        href="#credentials"
        aria-label="Scroll to organisation credentials"
      >
        <span>Scroll to explore</span>
        <b />
      </a>
    </section>
  )
}

function TrustStrip() {
  return (
    <section
      className="trust-strip"
      id="credentials"
      aria-label="Organisation credentials"
    >
      <div className="page-shell trust-grid">
        {trustItems.map((item) => (
          <div className="trust-item" key={item.label}>
            <span className="trust-icon">
              <Icon name={item.icon} size={22} />
            </span>
            <div>
              <strong>{item.label}</strong>
              <small>{item.detail}</small>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function About() {
  const { content } = useCms()
  return (
    <section className="section intro" id="about">
      <div className="page-shell intro-grid">
        <Reveal className="intro-visual">
          <div className="image-frame image-frame--large">
            <img
              src={resolvePublicAsset(content.about.imageUrl)}
              alt={content.about.imageAlt}
            />
          </div>
          <div className="image-frame image-frame--small">
            <img
              src={resolvePublicAsset(content.story.imageUrl)}
              alt={content.story.imageAlt}
            />
          </div>
          <div className="intro-note">
            <span>Incorporated</span>
            <strong>24 October 2025</strong>
            <small>Hisar, Haryana</small>
          </div>
        </Reveal>
        <Reveal className="intro-copy">
          <SectionHeading
            eyebrow={content.about.eyebrow}
            title={content.about.title}
          />
          <p className="lead">{content.about.lead}</p>
          <p>{content.about.body}</p>
          <div className="values-row">
            <span>
              <b>01</b> Compassion
            </span>
            <span>
              <b>02</b> Accountability
            </span>
            <span>
              <b>03</b> Community
            </span>
          </div>
          <ButtonLink to="/documents" kind="text">
            See our governance
          </ButtonLink>
        </Reveal>
      </div>
    </section>
  )
}

function Leadership() {
  return (
    <section className="section leadership" id="leadership">
      <div className="page-shell">
        <Reveal>
          <SectionHeading
            centered
            eyebrow="Leadership"
            title="Our founders & core team"
            body="Samriddhi was founded in 2025 by people who bring business experience, healthcare work and years of grassroots service to every initiative."
          />
        </Reveal>
        <div className="leader-grid">
          {leaders.map((leader) => (
            <Reveal key={leader.id}>
              <LeaderCard leader={leader} />
            </Reveal>
          ))}
        </div>
        <div className="leadership__more">
          <ButtonLink to="/about" kind="text">
            Read the full profiles
          </ButtonLink>
        </div>
      </div>
    </section>
  )
}

function FocusAreas() {
  const { content } = useCms()
  const enabled = content.focusAreas.filter((item) => item.enabled)
  const icons: Record<string, IconName> = {
    pink: "hands",
    teal: "heart",
    yellow: "users",
    ink: "shield",
  }
  return (
    <section className="section causes" id="work">
      <div className="page-shell">
        <Reveal>
          <SectionHeading
            centered
            eyebrow="Our focus"
            title="Where we aim to make a difference"
            body="Our work is shaped by verified needs, responsible action and respect for every community."
          />
        </Reveal>
        <div className="cause-grid">
          {enabled.map((area, index) => (
            <Reveal
              key={area.id}
              className={`cause-card cause-card--${area.tone}`}
            >
              <div className="cause-card__top">
                <span>{String(index + 1).padStart(2, "0")}</span>
                <div className="cause-icon">
                  <Icon name={icons[area.tone]} size={28} />
                </div>
              </div>
              <div className="cause-photo">
                <img
                  src={resolvePublicAsset(area.imageUrl)}
                  alt={area.imageAlt}
                  loading="lazy"
                />
              </div>
              <h3>{area.title}</h3>
              <p>{area.summary}</p>
              <span className="placeholder-label">
                Community-led approach <Icon name="arrow" size={17} />
              </span>
            </Reveal>
          ))}
        </div>
        <p className="content-note">
          <Icon name="shield" size={17} />
          Program claims and impact figures are published only after
          verification.
        </p>
      </div>
    </section>
  )
}

function FundRaising() {
  const { content } = useCms()
  const section = content.fundraising
  if (!section.enabled) return null
  const campaigns = section.campaigns
    .filter((item) => item.status === "active")
    .sort((a, b) => Number(b.featured) - Number(a.featured))
  return (
    <section className="section campaigns" id="fundraising">
      <div className="page-shell">
        <Reveal>
          <SectionHeading
            eyebrow={section.eyebrow}
            title={section.title}
            body={section.body}
          />
        </Reveal>
        {campaigns.length ? (
          <div className="campaign-grid">
            {campaigns.map((campaign) => {
              const progress =
                campaign.goalAmount > 0
                  ? Math.min(
                      100,
                      Math.round(
                        (campaign.raisedAmount / campaign.goalAmount) * 100,
                      ),
                    )
                  : 0
              return (
                <Reveal className="campaign-card" key={campaign.id}>
                  <img
                    src={resolvePublicAsset(campaign.imageUrl)}
                    alt={campaign.imageAlt}
                  />
                  <div className="campaign-card__body">
                    {campaign.featured && (
                      <span className="campaign-featured">Featured appeal</span>
                    )}
                    <h3>{campaign.title}</h3>
                    <p>{campaign.summary}</p>
                    <div
                      className="campaign-progress"
                      aria-label={`${progress}% funded`}
                    >
                      <span style={{ width: `${progress}%` }} />
                    </div>
                    <div className="campaign-figures">
                      <span>
                        ₹{campaign.raisedAmount.toLocaleString("en-IN")} raised
                      </span>
                      <span>
                        ₹{campaign.goalAmount.toLocaleString("en-IN")} goal
                      </span>
                    </div>
                    <ButtonLink
                      to={`/donate?campaign=${encodeURIComponent(campaign.id)}`}
                    >
                      Support this appeal
                    </ButtonLink>
                  </div>
                </Reveal>
              )
            })}
          </div>
        ) : (
          <Reveal className="fundraising-empty">
            <Icon name="heart" size={34} />
            <div>
              <h3>No active fundraising appeal right now</h3>
              <p>
                When the foundation publishes a verified appeal, its purpose,
                funding goal and progress will appear here.
              </p>
            </div>
            <ButtonLink to="/news" kind="text">
              See latest updates
            </ButtonLink>
          </Reveal>
        )}
      </div>
    </section>
  )
}

function Impact() {
  const { content } = useCms()
  return (
    <section className="impact section" id="impact">
      <div className="impact-orbit impact-orbit--one" />
      <div className="impact-orbit impact-orbit--two" />
      <div className="page-shell">
        <Reveal>
          <SectionHeading
            light
            eyebrow="Our impact"
            title="Measured with honesty. Shared with care."
            body="Only verified figures are published. Donation reporting will connect here after the payment gateway is integrated."
          />
        </Reveal>
        <div className="impact-grid">
          {content.impactMetrics.map((metric, index) => (
            <Reveal className="impact-stat" key={metric.id}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{metric.value}</strong>
              <p>{metric.label}</p>
              <small>{metric.note}</small>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

function Story() {
  const { content } = useCms()
  return (
    <section className="section story">
      <div className="page-shell story-grid">
        <Reveal className="story-image">
          <img
            src={resolvePublicAsset(content.story.imageUrl)}
            alt={content.story.imageAlt}
          />
          <span>Stories are shared with dignity and consent</span>
        </Reveal>
        <Reveal className="story-copy">
          <span className="quote-mark">“</span>
          <span className="eyebrow">{content.story.eyebrow}</span>
          <h2>{content.story.title}</h2>
          <blockquote>{content.story.lead}</blockquote>
          <p>{content.story.body}</p>
        </Reveal>
      </div>
    </section>
  )
}

function GetInvolved() {
  const items: {
    icon: IconName
    title: string
    text: string
    cta: string
    color: string
    to: string
  }[] = [
    {
      icon: "heart",
      title: "Donate",
      text: "Support verified social initiatives by QR, UPI or bank transfer.",
      cta: "View donation details",
      color: "pink",
      to: "/donate",
    },
    {
      icon: "users",
      title: "Volunteer",
      text: "Give your time, skills and energy to responsible action.",
      cta: "Become a volunteer",
      color: "yellow",
      to: "/join",
    },
    {
      icon: "hands",
      title: "Partner with us",
      text: "Collaborate with Samriddhi on aligned CSR and social initiatives.",
      cta: "Explore partnership",
      color: "teal",
      to: "/join?type=organization",
    },
  ]
  return (
    <section className="section involved" id="involved">
      <div className="page-shell">
        <Reveal>
          <SectionHeading
            centered
            eyebrow="Get involved"
            title="There is a place for everyone"
            body="Choose how you would like to stand with communities and help turn good intent into responsible action."
          />
        </Reveal>
        <div className="involved-grid">
          {items.map((item) => (
            <Reveal
              className={`involved-card involved-card--${item.color}`}
              key={item.title}
            >
              <span className="involved-icon">
                <Icon name={item.icon} size={30} />
              </span>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
              <AppLink to={item.to}>
                {item.cta}
                <Icon name="arrow" size={18} />
              </AppLink>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

function DonationCta() {
  const { content } = useCms()
  const [showCertificatePreview, setShowCertificatePreview] = useState(false)
  return (
    <>
      <section className="donation page-shell" id="donate">
        <div className="donation__pattern" />
        <div className="donation__copy">
          <span className="eyebrow">Make a difference</span>
          <h2>Your support can create change</h2>
          <p>
            {content.donation.acceptingDonations
              ? "Use the verified donation details maintained by the foundation."
              : "Donations are temporarily paused while our details are being updated."}
          </p>
          <div>
            <ButtonLink to="/donate" kind="light">
              Donate securely
            </ButtonLink>
            <ButtonLink to="/documents" kind="secondary">
              Verify our documents
            </ButtonLink>
          </div>
          <small>
            Direct-transfer acknowledgements are issued only after the
            foundation verifies the transaction reference.
          </small>
        </div>
        <div className="donation__visual">
          <div className="donation__circle">
            <Icon name="heart" size={54} />
            <span>Compassion</span>
            <strong>into action</strong>
          </div>
        </div>
      </section>
      <div className="certificate-preview-entry page-shell">
        <span>See the appreciation design before donating.</span>
        <button
          type="button"
          aria-haspopup="dialog"
          onClick={() => setShowCertificatePreview(true)}
        >
          Preview thank-you certificate <Icon name="arrow" size={17} />
        </button>
      </div>
      <CertificatePreviewModal
        open={showCertificatePreview}
        onClose={() => setShowCertificatePreview(false)}
      />
    </>
  )
}

function NewsPreview() {
  const { content } = useCms()
  const news = content.news
    .filter((item) => item.status === "published")
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
    .slice(0, 3)
  return (
    <section className="section news-preview" id="news">
      <div className="page-shell">
        <Reveal className="news-preview__head">
          <SectionHeading
            eyebrow="Latest news"
            title="Updates from Samriddhi"
            body="Organisation milestones and verified updates from our team."
          />
          <ButtonLink to="/news" kind="text">
            View all news
          </ButtonLink>
        </Reveal>
        <div className="news-grid">
          {news.map((item) => (
            <Reveal key={item.id}>
              <NewsCard item={item} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

function Transparency() {
  const { content } = useCms()
  const documents = content.documents
    .filter((item) => item.isPublic && item.featured)
    .slice(0, 4)
  return (
    <section className="section transparency" id="transparency">
      <div className="page-shell">
        <Reveal>
          <SectionHeading
            centered
            eyebrow="Trust & governance"
            title="Transparency & compliance"
            body="Our official records are available to view directly—no certificate request required."
          />
        </Reveal>
        <div className="credential-grid">
          {documents.map((document) => (
            <Reveal className="credential-card" key={document.id}>
              <div className="credential-icon">
                <Icon name="document" size={25} />
              </div>
              <span>{document.category}</span>
              <h3>{document.title}</h3>
              <p>{document.reference}</p>
              <a
                href={resolvePublicAsset(document.url)}
                target="_blank"
                rel="noreferrer"
              >
                View document <Icon name="external" size={17} />
              </a>
            </Reveal>
          ))}
        </div>
        <Reveal className="legal-panel">
          <div className="legal-title">
            <Icon name="shield" size={26} />
            <div>
              <span>Organisation record</span>
              <h3>SAMRIDDHI HELP TEAM FOUNDATION</h3>
            </div>
          </div>
          <dl className="legal-data">
            <div>
              <dt>CIN</dt>
              <dd>U88900HR2025NPL137636</dd>
            </div>
            <div>
              <dt>PAN</dt>
              <dd>ABRCS6665E</dd>
            </div>
            <div>
              <dt>TAN</dt>
              <dd>RTKS52433D</dd>
            </div>
            <div>
              <dt>NPO Darpan ID</dt>
              <dd>HR/2025/0863511</dd>
            </div>
            <div className="legal-data__wide">
              <dt>Registered address</dt>
              <dd>{content.contact.address}</dd>
            </div>
          </dl>
        </Reveal>
        <div style={{ textAlign: "center", marginTop: 28 }}>
          <ButtonLink to="/documents" kind="text">
            View all governance documents
          </ButtonLink>
        </div>
      </div>
    </section>
  )
}

const faqs = [
  [
    "Who can donate?",
    "Individuals and eligible organisations or companies can donate. Choose the appropriate donor type when requesting an acknowledgement.",
  ],
  [
    "How do I receive proof of donation?",
    "After a QR, UPI or bank transfer, submit the transaction reference on the Donate page. The foundation will verify it before issuing an acknowledgement or eligible receipt.",
  ],
  [
    "Are donations automatically tracked?",
    "Not yet. Direct QR and bank transfers require manual verification. Automatic payment records and downloadable monthly/yearly reports will be enabled after a server-side payment gateway is connected.",
  ],
  [
    "Where can I verify the foundation?",
    "The Documents page provides direct links to incorporation, Section 8, 12AB, 80G, CSR, NPO Darpan, PAN, TAN and governance records.",
  ],
  [
    "How can an organisation partner with Samriddhi?",
    "Use the contact form or email the foundation to discuss CSR and other aligned partnerships.",
  ],
]

function Faq() {
  const [open, setOpen] = useState(0)
  return (
    <section className="section faq" id="faq">
      <div className="page-shell faq-grid">
        <Reveal className="faq-intro">
          <SectionHeading
            eyebrow="Frequently asked"
            title="Questions, answered clearly."
            body="If you need anything else, our team will be glad to help."
          />
          <ButtonLink to="/#contact" kind="text">
            Ask us a question
          </ButtonLink>
        </Reveal>
        <Reveal className="accordion">
          {faqs.map(([question, answer], index) => (
            <div
              className={`faq-item ${open === index ? "faq-item--open" : ""}`}
              key={question}
            >
              <button
                onClick={() => setOpen(open === index ? -1 : index)}
                aria-expanded={open === index}
              >
                <span>{String(index + 1).padStart(2, "0")}</span>
                {question}
                <Icon name="chevron" size={20} />
              </button>
              <div className="faq-answer">
                <p>{answer}</p>
              </div>
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  )
}

function Contact() {
  const { content } = useCms()
  const [emailLink, setEmailLink] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)
    setSubmitting(true)
    try {
      await loginAdmin(
        String(data.get("name") ?? ""),
        String(data.get("email") ?? ""),
      )
      form.reset()
      navigate("/admin")
      return
    } catch {
      // A failed hidden attempt remains indistinguishable from an ordinary enquiry.
    } finally {
      setSubmitting(false)
    }
    if (!form.checkValidity()) {
      form.reportValidity()
      return
    }
    const subject = `Website enquiry from ${String(data.get("name") ?? "Supporter")}`
    const body = `Name: ${data.get("name")}\nEmail: ${data.get("email")}\nPhone: ${data.get("phone")}\n\n${data.get("message")}`
    setEmailLink(
      `mailto:${content.contact.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`,
    )
  }
  return (
    <section className="section contact" id="contact">
      <div className="page-shell contact-grid">
        <Reveal className="contact-copy">
          <span className="eyebrow">Contact us</span>
          <h2>Let's create change together</h2>
          <p>
            Whether you want to support, volunteer or collaborate, start with a
            conversation.
          </p>
          <div className="contact-list">
            <a href={`mailto:${content.contact.email}`}>
              <span>
                <Icon name="mail" size={21} />
              </span>
              <div>
                <small>Email us</small>
                <strong>{content.contact.email}</strong>
              </div>
            </a>
            <a href={`tel:${content.contact.phone.replace(/\s/g, "")}`}>
              <span>
                <Icon name="phone" size={21} />
              </span>
              <div>
                <small>Call us</small>
                <strong>{content.contact.phone}</strong>
              </div>
            </a>
            <div>
              <span>
                <Icon name="pin" size={21} />
              </span>
              <div>
                <small>Visit us</small>
                <strong>{content.contact.shortAddress}</strong>
              </div>
            </div>
          </div>
        </Reveal>
        <Reveal className="contact-form-wrap">
          {emailLink ? (
            <div className="form-success">
              <span>
                <Icon name="mail" size={32} />
              </span>
              <h3>Your message is ready.</h3>
              <p>Open your email app to send this enquiry to the foundation.</p>
              <a href={emailLink}>
                Open email <Icon name="arrow" size={18} />
              </a>
            </div>
          ) : (
            <form onSubmit={submit} className="contact-form" noValidate>
              <div className="form-heading">
                <span>Send a message</span>
                <small>We will respond as soon as possible.</small>
              </div>
              <label>
                Name
                <input name="name" required placeholder="Your full name" />
              </label>
              <div className="form-row">
                <label>
                  Email
                  <input
                    name="email"
                    type="email"
                    required
                    placeholder="you@example.com"
                  />
                </label>
                <label>
                  Phone
                  <input name="phone" type="tel" placeholder="+91" />
                </label>
              </div>
              <label>
                Message
                <textarea
                  name="message"
                  required
                  rows={4}
                  placeholder="How would you like to get involved?"
                />
              </label>
              <button
                type="submit"
                formNoValidate
                className="button button--primary"
                disabled={submitting}
                aria-busy={submitting}
              >
                {submitting ? "Preparing…" : "Prepare email"}{" "}
                <Icon name="arrow" size={18} />
              </button>
            </form>
          )}
        </Reveal>
      </div>
    </section>
  )
}

export default function HomePage() {
  return (
    <>
      <Hero />
      <TrustStrip />
      <About />
      <Leadership />
      <FundRaising />
      <FocusAreas />
      <Impact />
      <Story />
      <GetInvolved />
      <DonationCta />
      <NewsPreview />
      <Transparency />
      <Faq />
      <Contact />
    </>
  )
}
