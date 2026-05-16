import { createHash } from "crypto";
import type { BedrockRuntimeClient } from "@aws-sdk/client-bedrock-runtime";

// Lazy singleton — constructed on first call so CI (no AWS creds) never touches it at build time.
let _client: BedrockRuntimeClient | undefined;

export function getBedrock(): BedrockRuntimeClient {
  if (!_client) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { BedrockRuntimeClient } = require("@aws-sdk/client-bedrock-runtime");
    _client = new BedrockRuntimeClient({
      region: process.env.AWS_REGION ?? "us-east-1",
    }) as BedrockRuntimeClient;
  }
  return _client!;
}

export const MODEL_ID =
  process.env.BEDROCK_MODEL_ID ?? "anthropic.claude-sonnet-4-5";

export function auditLog(
  prompt: string,
  response: string,
  modelId: string,
  inputTokens: number,
  outputTokens: number
): void {
  const promptHash = createHash("sha256").update(prompt).digest("hex").slice(0, 16);
  const responseHash = createHash("sha256").update(response).digest("hex").slice(0, 16);
  console.log(
    JSON.stringify({
      event: "bedrock_invocation",
      timestamp: new Date().toISOString(),
      user: "system",
      modelId,
      promptHash,
      responseHash,
      inputTokens,
      outputTokens,
    })
  );
}
