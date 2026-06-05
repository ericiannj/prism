export async function embedTexts(texts: string[]): Promise<number[][]> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY is not set");

  const response = await fetch("https://openrouter.ai/api/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "openai/text-embedding-3-small",
      input: texts,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`OpenRouter embeddings failed: ${body}`);
  }

  const json = (await response.json()) as {
    data: { embedding: number[]; index: number }[];
  };

  return json.data.sort((a, b) => a.index - b.index).map((item) => item.embedding);
}
