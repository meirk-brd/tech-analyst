export type CompanyInput = {
  name: string;
  url: string;
};

export type ScrapeCategory = "pricing" | "docs" | "about";

export type ScrapeTargets = {
  pricing: string[];
  docs: string[];
  about: string[];
};

export type ScrapeResult = {
  url: string;
  content: string;
};

export type ExtractedCompanyData = {
  company: string;
  url: string;
  businessModel: string;
  pricingTiers: string[];
  keyFeatures: string[];
  technicalCapabilities: {
    scalability?: string;
    security?: string;
    integrations: string[];
  };
  headquarters?: string;
  foundingYear?: number | null;
  enterpriseCustomers: string[];
  sources: {
    pricing?: string;
    docs?: string;
    about?: string;
  };
  notes?: string;
};
