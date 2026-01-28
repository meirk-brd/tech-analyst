export type CompanyLead = {
  name: string;
  url: string;
  snippet?: string;
  sourceQuery?: string;
};

export type SearchRunResult = {
  query: string;
  cursor?: number;
  raw?: unknown;
  error?: string;
};
