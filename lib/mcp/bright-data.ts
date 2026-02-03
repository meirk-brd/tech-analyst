import "server-only";

import { MultiServerMCPClient } from "@langchain/mcp-adapters";

export const BRIGHT_DATA_SERVER_NAME = "bright-data";
const DEFAULT_BRIGHT_DATA_MCP_URL = "https://mcp.brightdata.com/mcp";

let cachedClient: MultiServerMCPClient | null = null;
let cachedTools: BrightDataTool[] | null = null;
let cachedToolsPromise: Promise<BrightDataTool[]> | null = null;
const cachedToolByPartialName = new Map<string, BrightDataTool>();

// Lock to prevent multiple simultaneous resets
let resetPromise: Promise<void> | null = null;

export type BrightDataTool = {
  name: string;
  invoke: (args: Record<string, unknown>) => Promise<unknown>;
};

function isSessionError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return message.includes("Session not found") || message.includes("code\":-32001");
}

function requireEnv(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `Missing ${name}. Set it in .env.local or your deployment environment.`
    );
  }
  return value;
}

export function getBrightDataClient(): MultiServerMCPClient {
  if (cachedClient) return cachedClient;

  const token = requireEnv("BRIGHT_DATA_API_TOKEN", process.env.BRIGHT_DATA_API_TOKEN);
  const url = process.env.BRIGHT_DATA_MCP_URL || DEFAULT_BRIGHT_DATA_MCP_URL;

  cachedClient = new MultiServerMCPClient({
    [BRIGHT_DATA_SERVER_NAME]: {
      transport: "http",
      url,
      headers: {
        Authorization: `Bearer ${token}`,
      },
      reconnect: {
        enabled: true,
        maxAttempts: 3,
        delayMs: 1000,
      },
    },
  });

  return cachedClient;
}

async function loadBrightDataTools(): Promise<BrightDataTool[]> {
  if (cachedTools) return cachedTools;
  if (!cachedToolsPromise) {
    const client = getBrightDataClient();
    cachedToolsPromise = client
      .getTools()
      .then((tools) => {
        cachedTools = tools as BrightDataTool[];
        return cachedTools;
      })
      .catch((error) => {
        cachedToolsPromise = null;
        throw error;
      });
  }
  return cachedToolsPromise;
}

export async function getBrightDataTools(): Promise<BrightDataTool[]> {
  return loadBrightDataTools();
}

export function findBrightDataTool(
  tools: BrightDataTool[],
  partialName: string
): BrightDataTool | undefined {
  const normalized = partialName.toLowerCase();
  return tools.find((tool) => tool.name.toLowerCase().includes(normalized));
}

async function getRawBrightDataTool(partialName: string): Promise<BrightDataTool> {
  const normalized = partialName.toLowerCase();
  const cached = cachedToolByPartialName.get(normalized);
  if (cached) return cached;

  const tools = await getBrightDataTools();
  const tool = findBrightDataTool(tools, partialName);

  if (!tool) {
    throw new Error(
      `Bright Data tool "${partialName}" not found. Available tools: ${tools
        .map((item) => item.name)
        .join(", ")}`
    );
  }

  cachedToolByPartialName.set(normalized, tool);
  return tool;
}

/**
 * Gets a Bright Data tool with automatic session recovery.
 * If a session error occurs during invocation, it will reset the client and retry once.
 */
export async function getBrightDataTool(partialName: string): Promise<BrightDataTool> {
  const rawTool = await getRawBrightDataTool(partialName);

  return {
    name: rawTool.name,
    invoke: async (args: Record<string, unknown>) => {
      try {
        return await rawTool.invoke(args);
      } catch (error) {
        if (isSessionError(error)) {
          // Reset client and get fresh tool
          await resetBrightDataClient();
          const freshTool = await getRawBrightDataTool(partialName);
          return await freshTool.invoke(args);
        }
        throw error;
      }
    },
  };
}

export async function resetBrightDataClient(): Promise<void> {
  // If a reset is already in progress, wait for it instead of starting another
  if (resetPromise) {
    return resetPromise;
  }

  resetPromise = (async () => {
    const client = cachedClient;
    cachedClient = null;
    cachedTools = null;
    cachedToolsPromise = null;
    cachedToolByPartialName.clear();

    if (client) {
      try {
        await client.close();
      } catch {
        // Ignore shutdown errors so callers can recover.
      }
    }
  })();

  try {
    await resetPromise;
  } finally {
    resetPromise = null;
  }
}
