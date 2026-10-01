export type Tone = "pink" | "teal" | "yellow" | "ink";

export type LinkConfig = {
  label: string;
  href: string;
};

export type Announcement = {
  enabled: boolean;
  label: string;
  message: string;
  link: LinkConfig;
  tone: Tone;
};

export type HeroContent = {
  eyebrow: string;
  title: string;
  highlight: string;
  body: string;
  imageUrl: string;
  imageAlt: string;
  primaryCta: LinkConfig;
  secondaryCta: LinkConfig;
};

export type PageBanner = {
  eyebrow: string;
  title: string;
  body: string;
  imageUrl: string;
  imageAlt: string;
};

export type HomeSection = {
  eyebrow: string;
  title: string;
  lead: string;
  body: string;
  imageUrl: string;
  imageAlt: string;
};

export type FocusArea = {
  id: string;
  title: string;
  summary: string;
  imageUrl: string;
  imageAlt: string;
  tone: Tone;
  enabled: boolean;
};

export type Campaign = {
  id: string;
  title: string;
  summary: string;
  imageUrl: string;
  imageAlt: string;
  goalAmount: number;
  raisedAmount: number;
  status: "draft" | "active" | "completed";
  featured: boolean;
};

export type ImpactMetric = {
  id: string;
  label: string;
  value: string;
  note: string;
};

export type NewsItem = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  body: string;
  imageUrl: string;
  imageAlt: string;
  category: string;
  author: string;
  publishedAt: string;
  status: "draft" | "published";
  featured: boolean;
};

export type DonationSettings = {
  acceptingDonations: boolean;
  currency: "INR";
  minimumAmount: number;
  qrImageUrl: string;
  upiId: string;
  payeeName: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  ifsc: string;
  branch: string;
  accountType: string;
  instructions: string;
  receiptEmail: string;
  gatewayEnabled: boolean;
};

export type DocumentItem = {
  id: string;
  title: string;
  category: string;
  description: string;
  reference: string;
  issuedAt: string;
  validThrough: string;
  url: string;
  fileType: "PDF" | "JPEG";
  fileSize: string;
  isPublic: boolean;
  featured: boolean;
};

export type PublicReport = {
  id: string;
  title: string;
  periodType: "monthly" | "yearly";
  periodLabel: string;
  summary: string;
  documentUrl: string;
  publishedAt: string;
  status: "draft" | "published";
};

export type ContactSettings = {
  email: string;
  phone: string;
  whatsapp: string;
  address: string;
  shortAddress: string;
};

export type SiteContent = {
  announcement: Announcement;
  hero: HeroContent;
  pageBanners: {
    news: PageBanner;
    documents: PageBanner;
    donate: PageBanner;
    reports: PageBanner;
  };
  about: HomeSection;
  story: HomeSection;
  focusAreas: FocusArea[];
  campaigns: Campaign[];
  impactMetrics: ImpactMetric[];
  news: NewsItem[];
  donation: DonationSettings;
  documents: DocumentItem[];
  reports: PublicReport[];
  contact: ContactSettings;
};

export type CmsSnapshot = {
  schemaVersion: 1;
  updatedAt: string;
  content: SiteContent;
};
