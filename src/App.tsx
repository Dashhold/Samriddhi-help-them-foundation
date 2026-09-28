import { FormEvent, ReactNode, useEffect, useRef, useState } from "react";
import logo from "./imports/samriddhi-logo.png";

const images = {
  hero: "https://images.unsplash.com/photo-1524069290683-0457abfe42c3?auto=format&fit=crop&w=2000&q=88",
  children:
    "https://images.unsplash.com/photo-1497486751825-1233686d5d80?auto=format&fit=crop&w=1200&q=84",
  classroom:
    "https://images.unsplash.com/photo-1572847748080-bac263fae977?auto=format&fit=crop&w=1200&q=84",
  community:
    "https://images.unsplash.com/photo-1707811180403-c22b7ef06476?auto=format&fit=crop&w=1200&q=84",
  woman:
    "https://images.unsplash.com/photo-1707811179851-c1f93698ad46?auto=format&fit=crop&w=1200&q=84",
  volunteers:
    "https://images.unsplash.com/photo-1667577113456-34c59803de33?auto=format&fit=crop&w=1200&q=84",
  group:
    "https://images.unsplash.com/photo-1692609659165-1ec4d8108c0e?auto=format&fit=crop&w=1200&q=84",
};

type IconName =
  | "arrow"
  | "building"
  | "heart"
  | "hands"
  | "users"
  | "briefcase"
  | "shield"
  | "document"
  | "phone"
  | "mail"
  | "pin"
  | "menu"
  | "close"
  | "chevron"
  | "whatsapp";

function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  const paths: Record<IconName, ReactNode> = {
    arrow: <><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></>,
    building: <><path d="M4 21V7l8-4 8 4v14" /><path d="M9 21v-6h6v6M8 9h.01M12 9h.01M16 9h.01M8 12h.01M16 12h.01" /></>,
    heart: <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z" />,
    hands: <><path d="m8 11-4.5 4.5a2.1 2.1 0 0 0 3 3L11 14" /><path d="m16 11 4.5 4.5a2.1 2.1 0 0 1-3 3L13 14" /><path d="m7 12 3.4-3.4a2.2 2.2 0 0 1 3.1 0L17 12M9 19l1 1a2 2 0 0 0 3 0l2-2M3 14 1-1a3 3 0 0 1 0-4l3-3M21 14l-1-1a3 3 0 0 0 0-4l-3-3" /></>,
    users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8" /></>,
    briefcase: <><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18M10 12v2h4v-2" /></>,
    shield: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" /><path d="m9 12 2 2 4-4" /></>,
    document: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><path d="M14 2v6h6M8 13h8M8 17h6" /></>,
    phone: <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.4 19.4 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.8a2 2 0 0 1-.4 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z" />,
    mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>,
    pin: <><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="3" /></>,
    menu: <><path d="M4 7h16M4 12h16M4 17h16" /></>,
    close: <><path d="m6 6 12 12M18 6 6 18" /></>,
    chevron: <path d="m6 9 6 6 6-6" />,
    whatsapp: <><path d="M20.5 11.7a8.5 8.5 0 0 1-12.6 7.5L3 20.5l1.3-4.7A8.5 8.5 0 1 1 20.5 11.7Z" /><path d="M8.4 7.5c.2-.4.4-.4.7-.4h.4c.1 0 .3.1.4.4l.8 1.9c.1.3 0 .5-.1.7l-.6.7c-.2.2-.1.4 0 .6.7 1.3 1.7 2.3 3 3 .2.1.4.2.6 0l.8-1c.2-.2.4-.2.7-.1l1.8.8c.3.1.5.2.5.4 0 .2-.1 1.2-.6 1.7-.5.6-1.3.9-2.1.9-.6 0-1.4-.2-2.4-.6-1-.4-4.2-1.6-6.4-5.5-.6-1-.6-2-.4-2.7.2-.4.5-.8.9-.8Z" /></>,
  };

  return (
    <svg aria-hidden="true" className="icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {paths[name]}
    </svg>
  );
}

function Reveal({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        node.classList.add("is-visible");
        observer.unobserve(node);
      }
    }, { threshold: 0.12 });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return <div ref={ref} className={`reveal ${className}`}>{children}</div>;
}

function Logo({ light = false }: { light?: boolean }) {
  return (
    <a className={`brand-logo ${light ? "brand-logo--light" : ""}`} href="#home" aria-label="Samriddhi Help Team Foundation home">
      <img
        src={logo}
        alt="Samriddhi Help Team Foundation"
        width={851}
        height={388}
        loading={light ? "lazy" : "eager"}
        fetchPriority={light ? "auto" : "high"}
        decoding="async"
      />
    </a>
  );
}

function LinkButton({ href, children, kind = "primary", icon = true }: { href: string; children: ReactNode; kind?: "primary" | "secondary" | "light" | "text"; icon?: boolean }) {
  return <a className={`button button--${kind}`} href={href}>{children}{icon && <Icon name="arrow" size={18} />}</a>;
}

const navLinks = [
  ["Home", "#home"],
  ["About Us", "#about"],
  ["Our Causes", "#causes"],
  ["Our Work", "#work"],
  ["Impact", "#impact"],
  ["Gallery", "#gallery"],
  ["Get Involved", "#involved"],
  ["Contact", "#contact"],
];

function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <header className={`navbar ${scrolled ? "navbar--scrolled" : ""}`}>
      <div className="nav-inner">
        <Logo />
        <nav className="nav-links" aria-label="Main navigation">
          {navLinks.map(([label, href]) => <a key={label} href={href}>{label}</a>)}
        </nav>
        <div className="nav-actions">
          <a className="donate-button" href="#donate">Donate now</a>
          <button className="menu-button" onClick={() => setOpen(!open)} aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open}>
            <Icon name={open ? "close" : "menu"} size={24} />
          </button>
        </div>
      </div>
      <div className={`mobile-menu ${open ? "mobile-menu--open" : ""}`}>
        {navLinks.map(([label, href]) => <a key={label} href={href} onClick={() => setOpen(false)}>{label}<Icon name="arrow" size={18} /></a>)}
      </div>
    </header>
  );
}

function SectionHeading({ eyebrow, title, body, centered = false, light = false }: { eyebrow: string; title: string; body?: string; centered?: boolean; light?: boolean }) {
  return (
    <div className={`section-heading ${centered ? "section-heading--centered" : ""} ${light ? "section-heading--light" : ""}`}>
      <span className="eyebrow">{eyebrow}</span>
      <h2>{title}</h2>
      {body && <p>{body}</p>}
    </div>
  );
}

function Hero() {
  return (
    <section className="hero" id="home">
      <img className="hero__image" src={images.hero} alt="Children smiling together in a community setting" />
      <div className="hero__veil" />
      <div className="hero__shape hero__shape--one" />
      <div className="hero__shape hero__shape--two" />
      <div className="hero__content page-shell">
        <div className="hero__identity"><span /> Samriddhi Help Team Foundation</div>
        <h1>Together, We Can Create a <em>Better Tomorrow</em></h1>
        <p>Samriddhi Help Team Foundation works towards creating meaningful social impact through compassion, community support and responsible action.</p>
        <div className="hero__actions">
          <LinkButton href="#donate">Donate now</LinkButton>
          <LinkButton href="#work" kind="light">Explore our work</LinkButton>
        </div>
        <div className="hero__credential"><Icon name="shield" size={18} /><span>Section 8 Company</span><i /> <span>Charitable Organisation</span></div>
      </div>
      <a className="scroll-cue" href="#credentials" aria-label="Scroll to explore"><span>Scroll to explore</span><b /></a>
    </section>
  );
}

const trustItems = [
  { icon: "building" as IconName, label: "Section 8 Company", detail: "Licence No. 174891" },
  { icon: "document" as IconName, label: "12AB Registered", detail: "Provisional registration" },
  { icon: "shield" as IconName, label: "80G Approved", detail: "Provisional approval" },
  { icon: "briefcase" as IconName, label: "CSR Registered", detail: "CSR00104011" },
];

function TrustStrip() {
  return (
    <section className="trust-strip" id="credentials" aria-label="Organisation credentials">
      <div className="page-shell trust-grid">
        {trustItems.map((item) => (
          <div className="trust-item" key={item.label}>
            <span className="trust-icon"><Icon name={item.icon} size={22} /></span>
            <div><strong>{item.label}</strong><small>{item.detail}</small></div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Introduction() {
  return (
    <section className="section intro" id="about">
      <div className="page-shell intro-grid">
        <Reveal className="intro-visual">
          <div className="image-frame image-frame--large"><img src={images.children} alt="Children sharing a moment together" /></div>
          <div className="image-frame image-frame--small"><img src={images.woman} alt="Woman holding a plant in a field" /></div>
          <div className="intro-note"><span>Incorporated</span><strong>24 October 2025</strong><small>Hisar, Haryana</small></div>
        </Reveal>
        <Reveal className="intro-copy">
          <SectionHeading eyebrow="Who we are" title="Building Hope. Creating Opportunity. Serving Communities." />
          <p className="lead">Samriddhi Help Team Foundation is a Section 8 charitable organisation based in Hisar, Haryana.</p>
          <p>Our purpose is to turn compassion into responsible, community-focused action. As a newly incorporated organisation, we are building our work on trust, dignity, accountability and meaningful collaboration.</p>
          <div className="values-row">
            <span><b>01</b> Compassion</span>
            <span><b>02</b> Accountability</span>
            <span><b>03</b> Community</span>
          </div>
          <LinkButton href="#transparency" kind="text">Learn more about us</LinkButton>
        </Reveal>
      </div>
    </section>
  );
}

const causePlaceholders = [
  { n: "01", icon: "hands" as IconName, title: "Community Support", color: "pink" },
  { n: "02", icon: "heart" as IconName, title: "Care & Wellbeing", color: "teal" },
  { n: "03", icon: "users" as IconName, title: "Opportunity & Inclusion", color: "yellow" },
];

function Causes() {
  return (
    <section className="section causes" id="causes">
      <div className="page-shell">
        <Reveal>
          <SectionHeading centered eyebrow="Our causes" title="Where We Make a Difference" body="Every effort begins with compassion and turns into meaningful action." />
        </Reveal>
        <div className="cause-grid">
          {causePlaceholders.map((cause, index) => (
            <Reveal key={cause.title} className={`cause-card cause-card--${cause.color}`}>
              <div className="cause-card__top"><span>{cause.n}</span><div className="cause-icon"><Icon name={cause.icon} size={28} /></div></div>
              <div className="cause-photo"><img src={[images.community, images.volunteers, images.group][index]} alt="" /></div>
              <h3>{cause.title}</h3>
              <p>Program information will be published here as this focus area is formally confirmed.</p>
              <span className="placeholder-label">Details coming soon <Icon name="arrow" size={17} /></span>
            </Reveal>
          ))}
        </div>
        <p className="content-note"><Icon name="shield" size={17} /> Focus areas are presented as design placeholders and do not represent active program claims.</p>
      </div>
    </section>
  );
}

function OurWork() {
  const items = [
    {
      tag: "Our approach",
      title: "Listening before acting",
      text: "We believe responsible social action begins by understanding real community needs, respecting local context and shaping initiatives with care.",
      image: images.community,
    },
    {
      tag: "Our commitment",
      title: "Creating action with accountability",
      text: "Every future initiative will be communicated transparently, with clear purpose and respectful documentation of the people and communities involved.",
      image: images.classroom,
    },
  ];
  return (
    <section className="section work" id="work">
      <div className="page-shell">
        <Reveal>
          <SectionHeading eyebrow="Our work" title="Purposeful action, shaped with communities" body="Our program portfolio is being developed. This is the approach that will guide how we work." />
        </Reveal>
        <div className="work-list">
          {items.map((item, index) => (
            <Reveal className={`work-row ${index % 2 ? "work-row--reverse" : ""}`} key={item.title}>
              <div className="work-image"><img src={item.image} alt={index ? "Students in a classroom" : "Community members together outdoors"} /><span>0{index + 1}</span></div>
              <div className="work-copy">
                <span className="work-tag">{item.tag}</span>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
                <a href="#contact" className="text-link">Start a conversation <Icon name="arrow" size={18} /></a>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function Impact() {
  const data = ["People reached", "Initiatives", "Volunteers", "Communities"];
  return (
    <section className="impact section" id="impact">
      <div className="impact-orbit impact-orbit--one" />
      <div className="impact-orbit impact-orbit--two" />
      <div className="page-shell">
        <Reveal><SectionHeading light eyebrow="Our impact" title="Measured with honesty. Shared with care." body="Verified impact figures will appear here as programs are delivered and documented." /></Reveal>
        <div className="impact-grid">
          {data.map((label, index) => <Reveal className="impact-stat" key={label}><span>0{index + 1}</span><strong>—</strong><p>{label}</p><small>Awaiting verified data</small></Reveal>)}
        </div>
      </div>
    </section>
  );
}

function HumanStory() {
  return (
    <section className="section story">
      <div className="page-shell story-grid">
        <Reveal className="story-image">
          <img src={images.group} alt="A group of children sitting together" />
          <span>Stories will be shared with dignity and consent</span>
        </Reveal>
        <Reveal className="story-copy">
          <span className="quote-mark">“</span>
          <span className="eyebrow">Human stories</span>
          <h2>Behind Every Number Is a Human Story</h2>
          <blockquote>We will share authentic stories here when they are documented and approved—never invented, never reduced to a statistic.</blockquote>
          <p>Samriddhi is committed to telling stories responsibly, protecting dignity and centering the voices of people involved.</p>
        </Reveal>
      </div>
    </section>
  );
}

const involvement = [
  { icon: "heart" as IconName, title: "Donate", text: "Support meaningful social initiatives.", cta: "Donation details", color: "pink", href: "#contact" },
  { icon: "users" as IconName, title: "Volunteer", text: "Give your time, skills and energy.", cta: "Become a volunteer", color: "yellow", href: "#contact" },
  { icon: "hands" as IconName, title: "Partner with us", text: "Collaborate with Samriddhi for meaningful impact.", cta: "Explore partnership", color: "teal", href: "#contact" },
];

function GetInvolved() {
  return (
    <section className="section involved" id="involved">
      <div className="page-shell">
        <Reveal><SectionHeading centered eyebrow="Get involved" title="There is a place for everyone" body="Choose how you would like to stand with communities and help turn good intent into responsible action." /></Reveal>
        <div className="involved-grid">
          {involvement.map((item) => (
            <Reveal className={`involved-card involved-card--${item.color}`} key={item.title}>
              <span className="involved-icon"><Icon name={item.icon} size={30} /></span>
              <h3>{item.title}</h3><p>{item.text}</p>
              <a href={item.href}>{item.cta}<Icon name="arrow" size={18} /></a>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function DonationCTA() {
  return (
    <section className="donation page-shell" id="donate">
      <div className="donation__pattern" />
      <div className="donation__copy">
        <span className="eyebrow">Make a difference</span>
        <h2>Your Support Can Create Change</h2>
        <p>Every contribution can help turn compassion into action.</p>
        <div><LinkButton href="#contact" kind="light">Donate now</LinkButton><LinkButton href="#contact" kind="secondary">Contact us</LinkButton></div>
        <small>Donation and payment details will be shared only through verified foundation channels.</small>
      </div>
      <div className="donation__visual"><div className="donation__circle"><Icon name="heart" size={54} /><span>Compassion</span><strong>into action</strong></div></div>
    </section>
  );
}

function Gallery() {
  const gallery = [
    { src: images.hero, cls: "gallery-item--wide", alt: "Children smiling together" },
    { src: images.woman, cls: "gallery-item--tall", alt: "Woman standing in a field" },
    { src: images.classroom, cls: "", alt: "Child in a classroom" },
    { src: images.community, cls: "", alt: "Community members outdoors" },
    { src: images.volunteers, cls: "gallery-item--wide", alt: "Women gathered together" },
  ];
  return (
    <section className="section gallery" id="gallery">
      <div className="page-shell">
        <Reveal className="gallery-head">
          <SectionHeading eyebrow="Gallery" title="Moments that move us" body="Representative social-impact imagery is shown until Samriddhi's own activity gallery is available." />
          <div className="gallery-filter"><button className="active">All</button><span>Verified activity categories coming soon</span></div>
        </Reveal>
        <div className="gallery-grid">
          {gallery.map((image, i) => <Reveal className={`gallery-item ${image.cls}`} key={image.src}><img src={image.src} alt={image.alt} loading="lazy" /><span>Representative image <b>0{i + 1}</b></span></Reveal>)}
        </div>
      </div>
    </section>
  );
}

const credentials = [
  { icon: "building" as IconName, overline: "Section 8 Company", title: "Licence No. 174891", detail: "Incorporated 24 October 2025" },
  { icon: "document" as IconName, overline: "12AB", title: "Provisional Registration", detail: "AY 2026–27 to AY 2028–29" },
  { icon: "shield" as IconName, overline: "80G", title: "Provisional Approval", detail: "AY 2026–27 to AY 2028–29" },
  { icon: "briefcase" as IconName, overline: "CSR Registered", title: "CSR00104011", detail: "Registration number" },
];

function Transparency() {
  return (
    <section className="section transparency" id="transparency">
      <div className="page-shell">
        <Reveal><SectionHeading centered eyebrow="Trust & governance" title="Transparency & Compliance" body="Building trust through accountability and transparency." /></Reveal>
        <div className="credential-grid">
          {credentials.map((c) => (
            <Reveal className="credential-card" key={c.overline}>
              <div className="credential-icon"><Icon name={c.icon} size={25} /></div>
              <span>{c.overline}</span><h3>{c.title}</h3><p>{c.detail}</p>
              <a href="#contact" aria-label={`Request ${c.overline} certificate`}>View certificate <Icon name="arrow" size={17} /></a>
            </Reveal>
          ))}
        </div>
        <Reveal className="legal-panel">
          <div className="legal-title"><Icon name="shield" size={26} /><div><span>Organisation record</span><h3>SAMRIDDHI HELP TEAM FOUNDATION</h3></div></div>
          <dl className="legal-data">
            <div><dt>CIN</dt><dd>U88900HR2025NPL137636</dd></div>
            <div><dt>PAN</dt><dd>ABRCS6665E</dd></div>
            <div><dt>TAN</dt><dd>RTKS52433D</dd></div>
            <div><dt>Registered address</dt><dd>H.No. 01 Second Floor, VPO Kuleri,<br />Hisar, Haryana – 125047, India</dd></div>
          </dl>
        </Reveal>
      </div>
    </section>
  );
}

const faqs = [
  ["What is Samriddhi Help Team Foundation?", "Samriddhi Help Team Foundation is a Section 8 charitable organisation incorporated on 24 October 2025 and registered in Hisar, Haryana."],
  ["How can I support Samriddhi?", "You can contact the foundation to discuss donations, volunteering or partnership. Verified donation details will be provided through official channels."],
  ["How can I volunteer?", "Use the contact form below or email samriddhihelpteam@gmail.com with your interests, availability and relevant skills."],
  ["How can organisations partner with Samriddhi?", "Organisations can contact the foundation directly to begin a conversation about responsible, aligned collaboration."],
  ["How can I contact the foundation?", "Email samriddhihelpteam@gmail.com or call +91 8814092008. The registered office is in VPO Kuleri, Hisar, Haryana."],
  ["Where can I view the organisation's registration documents?", "Certificate access can be requested from the Transparency & Compliance section or by contacting the foundation."],
];

function FAQ() {
  const [open, setOpen] = useState(0);
  return (
    <section className="section faq" id="faq">
      <div className="page-shell faq-grid">
        <Reveal className="faq-intro">
          <SectionHeading eyebrow="Frequently asked" title="Questions, answered clearly." body="If you need anything else, our team will be glad to help." />
          <LinkButton href="#contact" kind="text">Ask us a question</LinkButton>
        </Reveal>
        <Reveal className="accordion">
          {faqs.map(([question, answer], index) => (
            <div className={`faq-item ${open === index ? "faq-item--open" : ""}`} key={question}>
              <button onClick={() => setOpen(open === index ? -1 : index)} aria-expanded={open === index}>
                <span>{String(index + 1).padStart(2, "0")}</span>{question}<Icon name="chevron" size={20} />
              </button>
              <div className="faq-answer"><p>{answer}</p></div>
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  );
}

function Contact() {
  const [sent, setSent] = useState(false);
  const submit = (e: FormEvent) => { e.preventDefault(); setSent(true); };
  return (
    <section className="section contact" id="contact">
      <div className="page-shell contact-grid">
        <Reveal className="contact-copy">
          <span className="eyebrow">Contact us</span>
          <h2>Let's Create Change Together</h2>
          <p>Whether you want to support, volunteer or collaborate, start with a conversation.</p>
          <div className="contact-list">
            <a href="mailto:samriddhihelpteam@gmail.com"><span><Icon name="mail" size={21} /></span><div><small>Email us</small><strong>samriddhihelpteam@gmail.com</strong></div></a>
            <a href="tel:+918814092008"><span><Icon name="phone" size={21} /></span><div><small>Call us</small><strong>+91 8814092008</strong></div></a>
            <div><span><Icon name="pin" size={21} /></span><div><small>Visit us</small><strong>Hisar, Haryana, India</strong></div></div>
          </div>
        </Reveal>
        <Reveal className="contact-form-wrap">
          {sent ? (
            <div className="form-success"><span><Icon name="heart" size={32} /></span><h3>Thank you for reaching out.</h3><p>Your message is ready to be connected to a form service. For now, please email the foundation directly.</p><a href="mailto:samriddhihelpteam@gmail.com">Open email <Icon name="arrow" size={18} /></a></div>
          ) : (
            <form onSubmit={submit} className="contact-form">
              <div className="form-heading"><span>Send a message</span><small>We will respond as soon as possible.</small></div>
              <label>Name<input name="name" required placeholder="Your full name" /></label>
              <div className="form-row">
                <label>Email<input name="email" type="email" required placeholder="you@example.com" /></label>
                <label>Phone<input name="phone" type="tel" placeholder="+91" /></label>
              </div>
              <label>Message<textarea name="message" required rows={4} placeholder="How would you like to get involved?" /></label>
              <button type="submit" className="button button--primary">Send message <Icon name="arrow" size={18} /></button>
            </form>
          )}
        </Reveal>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <div className="page-shell footer-main">
        <div className="footer-brand"><Logo light /><p>Compassion, community support and responsible action.</p><span>Section 8 Company · Hisar, Haryana</span></div>
        <div className="footer-column"><h3>Explore</h3>{navLinks.slice(0, 4).map(([l, h]) => <a href={h} key={l}>{l}</a>)}</div>
        <div className="footer-column"><h3>Discover</h3>{navLinks.slice(4).map(([l, h]) => <a href={h} key={l}>{l}</a>)}</div>
        <div className="footer-column"><h3>Support</h3><a href="#donate">Donate</a><a href="#involved">Volunteer</a><a href="#involved">Partner with us</a><a href="#transparency">Transparency</a></div>
        <div className="footer-column footer-contact"><h3>Contact</h3><a href="mailto:samriddhihelpteam@gmail.com">samriddhihelpteam@gmail.com</a><a href="tel:+918814092008">+91 8814092008</a><span>Hisar, Haryana</span></div>
      </div>
      <div className="page-shell footer-bottom"><span>© 2026 Samriddhi Help Team Foundation. All Rights Reserved.</span><div><a href="#footer">Privacy Policy</a><a href="#footer">Terms</a><a href="#transparency">Transparency</a></div></div>
    </footer>
  );
}

function FloatingActions() {
  return (
    <>
      <a className="whatsapp" href="https://wa.me/918814092008" target="_blank" rel="noreferrer" aria-label="Contact Samriddhi on WhatsApp"><Icon name="whatsapp" size={26} /><span>Chat with us</span></a>
      <div className="mobile-donate"><span>Help turn compassion into action</span><a href="#donate">Donate now <Icon name="arrow" size={17} /></a></div>
    </>
  );
}

export default function App() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <TrustStrip />
        <Introduction />
        <Causes />
        <OurWork />
        <Impact />
        <HumanStory />
        <GetInvolved />
        <DonationCTA />
        <Gallery />
        <Transparency />
        <FAQ />
        <Contact />
      </main>
      <Footer />
      <FloatingActions />
    </>
  );
}
