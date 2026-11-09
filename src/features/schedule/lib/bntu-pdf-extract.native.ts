export async function extractPdfText(_bytes: Uint8Array): Promise<string> {
  return '';
}

export function isLikelyScannedPdfText(text: string): boolean {
  const normalized = text.replace(/\s+/g, ' ').trim();
  return normalized.length < 120;
}
