import { getEncoding } from "js-tiktoken";

export interface Chunk {
  content: string;
  charStart: number;
  charEnd: number;
}

export function chunkText(
  text: string,
  options: { maxTokens?: number; overlap?: number } = {}
): Chunk[] {
  const { maxTokens = 500, overlap = 50 } = options;
  const enc = getEncoding("cl100k_base");

  const allTokens = enc.encode(text);
  const chunks: Chunk[] = [];
  const step = maxTokens - overlap;

  for (let start = 0; start < allTokens.length; start += step) {
    const end = Math.min(start + maxTokens, allTokens.length);

    const precedingText = enc.decode(allTokens.slice(0, start));
    const chunkText = enc.decode(allTokens.slice(start, end));

    const charStart = precedingText.length;
    const content = chunkText;

    chunks.push({ content, charStart, charEnd: charStart + content.length });

    if (end === allTokens.length) break;
  }

  return chunks;
}
