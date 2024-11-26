export function createTextList(text: string, maxChunkChars: number): string[] {
  if (typeof text !== 'string' || typeof maxChunkChars !== 'number') {
    return [];
  }

  if (text.length <= maxChunkChars) {
    return [text];
  }

  const chunks: string[] = [];

  let currentIndex = 0;

  while (currentIndex < text.length) {
    const currentTextPart = text.slice(currentIndex, currentIndex + maxChunkChars);
    const isLastPart = currentTextPart.length < maxChunkChars;

    // look for the best possible end to avoid splitting in between sentences or words
    const index = !isLastPart ? getBestLastIndex(currentTextPart) : -1;
    const chunk = index > -1 ? text.slice(currentIndex, currentIndex + index + 1) : currentTextPart;

    chunks.push(chunk);
    currentIndex += chunk.length;
  }

  return chunks.map(chunk => chunk.trim()).filter(chunk => chunk.length > 0);
}

function getBestLastIndex(text: string): number {
  const spaceIndex = text.lastIndexOf(' ');
  const pointIndex = text.lastIndexOf('.');
  const questionMarkIndex = text.lastIndexOf('?');
  const exclamationMarkIndex = text.lastIndexOf('!');
  const specialIndex = Math.max(pointIndex, exclamationMarkIndex, questionMarkIndex);

  return specialIndex > -1 ? specialIndex : spaceIndex;
}
