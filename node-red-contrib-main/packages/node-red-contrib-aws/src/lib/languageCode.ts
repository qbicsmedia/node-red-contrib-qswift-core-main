import RED from 'node-red';

import { getValueByPath } from './util';
import { LanguageCode, getAvailableLanguageCode, validLanguageCodes } from './comprehendClient';

export function evaluateLanguageCode(
  node: { id: string; languageCode: string; logging: boolean },
  msg: Record<string, unknown>,
): LanguageCode {
  const languageCode = getValueByPath(node.languageCode, msg);
  const supportedLanguageCode = getAvailableLanguageCode(languageCode);

  if (typeof supportedLanguageCode !== 'string') {
    throw new Error(
      `Language code "${languageCode}" is not supported! (supported language codes: ${validLanguageCodes.join(', ')})`,
    );
  }

  if (node.logging && languageCode !== supportedLanguageCode) {
    RED.log.info(
      `[node:${node.id}] Provided language code "${languageCode}" forwarded as "${supportedLanguageCode}" to aws comprehend.`,
    );
  }

  return supportedLanguageCode;
}
