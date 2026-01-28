import type { CompanyLead } from "../discovery/types";

export type ExtractedCompany = {
  name: string;
  url?: string;
};

export type LightweightReflectionInput = {
  url: string;
  content: string;
  marketSector: string;
};

export type LightweightReflectionOutput = {
  isCompanyPage: boolean;
  companyName?: string;
  extractedCompanies: ExtractedCompany[];
};

export type ScrapedPage = {
  url: string;
  companies: CompanyLead[];
  error?: string;
};

export type EnrichmentStats = {
  inputLeads: number;
  pagesScraped: number;
  companiesExtracted: number;
  afterDedupe: number;
  skippedUrls: number;
};
