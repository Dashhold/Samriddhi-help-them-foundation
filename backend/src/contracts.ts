import type { SiteContent } from "./content/site-content-schema.js";

export type AdminIdentity = {
  id: string;
  username: string;
};

export type AuthSessionResponse = {
  token: string;
  expiresAt: string;
  admin: AdminIdentity;
};

export type SessionResponse = Omit<AuthSessionResponse, "token">;

export type ContentResponse = {
  schemaVersion: 2;
  revision: number;
  updatedAt: string;
  content: SiteContent;
};

export type ContentUpdateRequest = {
  expectedRevision: number;
  content: SiteContent;
};

export type AssetUploadResponse = {
  id: string;
  url: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
};
