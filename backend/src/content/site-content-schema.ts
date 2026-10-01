import { z } from "zod";

const text = (maximum = 5000) => z.string().max(maximum);
const requiredText = (maximum = 5000) => z.string().trim().min(1).max(maximum);
const id = requiredText(160).regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/);
const date = z.string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => {
    const parsed = new Date(`${value}T00:00:00.000Z`);
    return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
  }, "Use a real calendar date in YYYY-MM-DD format.");
const tone = z.enum(["pink", "teal", "yellow", "ink"]);

const linkSchema = z.object({
  label: text(120),
  href: text(2048),
}).strict();

const pageBannerSchema = z.object({
  eyebrow: text(120),
  title: requiredText(240),
  body: text(2000),
  imageUrl: text(4096),
  imageAlt: text(500),
}).strict();

const homeSectionSchema = z.object({
  eyebrow: text(120),
  title: requiredText(240),
  lead: text(2000),
  body: text(10000),
  imageUrl: text(4096),
  imageAlt: text(500),
}).strict();

const focusAreaSchema = z.object({
  id,
  title: requiredText(200),
  summary: text(2000),
  imageUrl: text(4096),
  imageAlt: text(500),
  tone,
  enabled: z.boolean(),
}).strict();

const campaignSchema = z.object({
  id,
  title: requiredText(240),
  summary: text(3000),
  imageUrl: text(4096),
  imageAlt: text(500),
  goalAmount: z.number().finite().nonnegative().max(1_000_000_000_000),
  raisedAmount: z.number().finite().nonnegative().max(1_000_000_000_000),
  status: z.enum(["draft", "active", "completed"]),
  featured: z.boolean(),
}).strict();

const impactMetricSchema = z.object({
  id,
  label: requiredText(160),
  value: text(100),
  note: text(500),
}).strict();

const newsItemSchema = z.object({
  id,
  slug: requiredText(200).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  title: requiredText(300),
  summary: text(3000),
  body: text(50_000),
  imageUrl: text(4096),
  imageAlt: text(500),
  category: text(160),
  author: text(200),
  publishedAt: date,
  status: z.enum(["draft", "published"]),
  featured: z.boolean(),
}).strict();

const documentSchema = z.object({
  id,
  title: requiredText(300),
  category: text(160),
  description: text(5000),
  reference: text(500),
  issuedAt: date,
  validThrough: text(120),
  url: text(4096),
  fileType: z.enum(["PDF", "JPEG"]),
  fileSize: text(120),
  isPublic: z.boolean(),
  featured: z.boolean(),
}).strict();

const reportSchema = z.object({
  id,
  title: requiredText(300),
  periodType: z.enum(["monthly", "yearly"]),
  periodLabel: text(160),
  summary: text(5000),
  documentUrl: text(4096),
  publishedAt: date,
  status: z.enum(["draft", "published"]),
}).strict();

export const siteContentSchema = z.object({
  announcement: z.object({
    enabled: z.boolean(),
    label: text(120),
    message: text(2000),
    link: linkSchema,
    tone,
  }).strict(),
  pageBanners: z.object({
    news: pageBannerSchema,
    documents: pageBannerSchema,
    donate: pageBannerSchema,
    reports: pageBannerSchema,
  }).strict(),
  about: homeSectionSchema,
  story: homeSectionSchema,
  focusAreas: z.array(focusAreaSchema).max(50),
  fundraising: z.object({
    enabled: z.boolean(),
    eyebrow: text(120),
    title: requiredText(240),
    body: text(3000),
    campaigns: z.array(campaignSchema).max(200),
  }).strict(),
  impactMetrics: z.array(impactMetricSchema).max(50),
  news: z.array(newsItemSchema).max(1000),
  donation: z.object({
    acceptingDonations: z.boolean(),
    currency: z.literal("INR"),
    minimumAmount: z.number().finite().positive().max(1_000_000_000),
    qrImageUrl: text(4096),
    upiId: text(320),
    payeeName: text(300),
    bankName: text(300),
    accountName: text(300),
    accountNumber: text(120),
    ifsc: text(40),
    branch: text(300),
    accountType: text(120),
    instructions: text(5000),
    receiptEmail: z.string().email().max(320),
    gatewayEnabled: z.boolean(),
  }).strict(),
  documents: z.array(documentSchema).max(1000),
  reports: z.array(reportSchema).max(1000),
  contact: z.object({
    email: z.string().email().max(320),
    phone: requiredText(80),
    whatsapp: requiredText(40).regex(/^\d+$/),
    address: requiredText(2000),
    shortAddress: requiredText(500),
  }).strict(),
}).strict();

export const contentUpdateSchema = z.object({
  expectedRevision: z.number().int().positive(),
  content: siteContentSchema,
}).strict();

export type SiteContent = z.infer<typeof siteContentSchema>;
