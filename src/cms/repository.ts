import { defaultSiteContent } from "./defaultContent";
import { CmsSnapshot, SiteContent } from "./types";
import { isSupabaseConfigured, requireSupabase, supabase } from "../lib/supabase";

export type RemoteSnapshot = CmsSnapshot & { revision: number };

type SiteContentRow = {
  content: unknown;
  updated_at: string;
  revision: number;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function mergeKnownShape(defaultValue: unknown, incoming: unknown): unknown {
  if (Array.isArray(defaultValue)) return Array.isArray(incoming) ? structuredClone(incoming) : structuredClone(defaultValue);
  if (isRecord(defaultValue)) {
    const source = isRecord(incoming) ? incoming : {};
    return Object.fromEntries(
      Object.entries(defaultValue).map(([key, value]) => [key, mergeKnownShape(value, source[key])]),
    );
  }
  return typeof incoming === typeof defaultValue ? incoming : defaultValue;
}

export function normalizeSiteContent(value: unknown): SiteContent {
  const source = isRecord(value) ? structuredClone(value) : {};
  // One-time migration from the previous editable campaign array. Hero is
  // deliberately ignored because it is now fixed in source code.
  if (!isRecord(source.fundraising)) {
    source.fundraising = {
      ...defaultSiteContent.fundraising,
      campaigns: Array.isArray(source.campaigns) ? source.campaigns : [],
    };
  }
  delete source.hero;
  delete source.campaigns;
  return mergeKnownShape(defaultSiteContent, source) as SiteContent;
}

function rowToSnapshot(row: SiteContentRow): RemoteSnapshot {
  return {
    schemaVersion: 2,
    updatedAt: row.updated_at,
    revision: Number(row.revision),
    content: normalizeSiteContent(row.content),
  };
}

export async function loadSiteContent(): Promise<RemoteSnapshot> {
  const client = requireSupabase();
  const { data, error } = await client
    .from("site_content")
    .select("content, updated_at, revision")
    .eq("id", "main")
    .eq("published", true)
    .single();
  if (error) throw new Error(error.message);
  return rowToSnapshot(data as SiteContentRow);
}

export async function saveSiteContent(content: SiteContent, expectedRevision: number): Promise<RemoteSnapshot> {
  const client = requireSupabase();
  const { data, error } = await client
    .from("site_content")
    .update({ content, schema_version: 2, published: true })
    .eq("id", "main")
    .eq("revision", expectedRevision)
    .select("content, updated_at, revision")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Content changed in another session. Refresh the dashboard before saving again.");
  return rowToSnapshot(data as SiteContentRow);
}

export function subscribeToSiteContent(onUpdate: (snapshot: RemoteSnapshot) => void) {
  const client = supabase;
  if (!isSupabaseConfigured || !client) return () => undefined;
  const channel = client
    .channel("public-site-content")
    .on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "site_content", filter: "id=eq.main" },
      (payload) => {
        const row = payload.new as SiteContentRow;
        if (row?.content && row.updated_at && row.revision) onUpdate(rowToSnapshot(row));
      },
    )
    .subscribe();
  return () => { void client.removeChannel(channel); };
}

export function parseCmsBackup(raw: string): SiteContent {
  const parsed: unknown = JSON.parse(raw);
  if (!isRecord(parsed)) throw new Error("This is not a valid Samriddhi CMS backup.");
  const content = "content" in parsed ? parsed.content : parsed;
  if (!isRecord(content)) throw new Error("The backup does not contain site content.");
  return normalizeSiteContent(content);
}
