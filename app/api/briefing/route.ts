export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const { getFacilityCensus } = await import("@/lib/db/queries/facilities");
    const { listOpenRiskFlags } = await import("@/lib/db/queries/riskFlags");
    const { buildDailyBriefingPayload } = await import("@/lib/phi/deidentify");
    const { buildDailyBriefingPrompt } = await import(
      "@/lib/bedrock/prompts/daily-briefing"
    );
    const { getBedrock, MODEL_ID, auditLog } = await import("@/lib/bedrock/client");
    const { InvokeModelWithResponseStreamCommand } = await import(
      "@aws-sdk/client-bedrock-runtime"
    );

    const [census, flags] = await Promise.all([getFacilityCensus(), listOpenRiskFlags()]);

    const payload = buildDailyBriefingPayload(census, flags);
    const prompt = buildDailyBriefingPrompt(payload);

    const body = JSON.stringify({
      anthropic_version: "bedrock-2023-05-31",
      max_tokens: 500,
      system: prompt.system,
      messages: [{ role: "user", content: prompt.user }],
    });

    const command = new InvokeModelWithResponseStreamCommand({
      modelId: MODEL_ID,
      contentType: "application/json",
      accept: "application/json",
      body,
    });

    const bedrockResponse = await getBedrock().send(command);

    // Collect full response text for audit log
    let fullText = "";
    let inputTokens = 0;
    let outputTokens = 0;

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();

        try {
          for await (const event of bedrockResponse.body!) {
            if (event.chunk?.bytes) {
              const chunk = JSON.parse(
                new TextDecoder().decode(event.chunk.bytes)
              ) as Record<string, unknown>;

              if (chunk.type === "content_block_delta") {
                const delta = chunk.delta as Record<string, unknown>;
                if (delta?.type === "text_delta" && typeof delta.text === "string") {
                  fullText += delta.text;
                  const data = `data: ${JSON.stringify({ text: delta.text })}\n\n`;
                  controller.enqueue(encoder.encode(data));
                }
              } else if (chunk.type === "message_delta") {
                const usage = (chunk.usage as Record<string, unknown>) ?? {};
                if (typeof usage.output_tokens === "number") {
                  outputTokens = usage.output_tokens;
                }
              } else if (chunk.type === "message_start") {
                const message = chunk.message as Record<string, unknown>;
                const usage = (message?.usage as Record<string, unknown>) ?? {};
                if (typeof usage.input_tokens === "number") {
                  inputTokens = usage.input_tokens;
                }
              }
            }
          }

          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (err) {
          controller.error(err);
        } finally {
          auditLog(prompt.user, fullText, MODEL_ID, inputTokens, outputTokens);
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    console.error("Briefing generation failed:", err);
    return Response.json({ error: "Failed to generate briefing" }, { status: 500 });
  }
}
