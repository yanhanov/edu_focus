import { Platform } from 'react-native';

export async function extractPdfText(bytes: Uint8Array): Promise<string> {
  if (Platform.OS !== 'web') {
    return extractPdfTextNative(bytes);
  }
  return extractPdfTextWeb(bytes);
}

async function extractPdfTextWeb(bytes: Uint8Array): Promise<string> {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const doc = await pdfjs.getDocument({
    data: bytes,
    useSystemFonts: true,
    ...({ disableWorker: true } as Record<string, unknown>),
  }).promise;
  const chunks: string[] = [];
  for (let pageNumber = 1; pageNumber <= doc.numPages; pageNumber += 1) {
    const page = await doc.getPage(pageNumber);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item) => ('str' in item && typeof item.str === 'string' ? item.str : ''))
      .join(' ')
      .trim();
    if (pageText) {
      chunks.push(pageText);
    }
  }
  return chunks.join('\n').trim();
}

async function extractPdfTextNative(bytes: Uint8Array): Promise<string> {
  try {
    return await extractPdfTextWeb(bytes);
  } catch (error) {
    console.warn('[pdf] extract failed', error);
    return '';
  }
}

export function isLikelyScannedPdfText(text: string): boolean {
  const normalized = text.replace(/\s+/g, ' ').trim();
  return normalized.length < 120;
}
