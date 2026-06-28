import { generateText } from "ai";
import { groq } from "@ai-sdk/groq";
import { aiActionSchema } from "@/lib/validation/schemas";
import { ok, fail, route, requireUser, readJson } from "@/lib/api";

const PROMPTS: Record<string, (text: string) => string> = {
  summarize: (t) =>
    `Summarize the following document in 3-4 concise bullet points. Output only the bullets.\n\n${t}`,
  improve: (t) =>
    `Rewrite the following text to be clearer and more concise while preserving meaning and tone. Output only the rewritten text.\n\n${t}`,
  continue: (t) =>
    `Continue writing the following document naturally for 1-2 short paragraphs. Output only the continuation.\n\n${t}`,
};

export const POST = route(async (req: Request) => {
  await requireUser();
  const { action, text } = aiActionSchema.parse(await readJson(req, 64 * 1024));

  if (!process.env.GROQ_API_KEY) {
    return fail("AI is not configured on this deployment (missing GROQ_API_KEY).", 503);
  }

  const { text: result } = await generateText({
    model: groq("llama-3.3-70b-versatile"),
    prompt: PROMPTS[action](text),
    maxOutputTokens: 600,
  });

  return ok({ result });
});
