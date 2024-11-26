import RED from 'node-red';

import { evaluateLanguageCode } from '../../src/lib/languageCode';

describe('languageCode', () => {
  it.each([
    { languageCode: 'en', expected: 'en' },
    { languageCode: 'en-GB', expected: 'en' },
    { languageCode: 'en-US', expected: 'en' },
    { languageCode: 'de-DE', expected: 'de' },
    { languageCode: 'de-AT', expected: 'de' },
    { languageCode: 'zh-TW', expected: 'zh-TW' },
  ])('should return (short) language code of message if supported ($languageCode)', ({ languageCode, expected }) => {
    const node = createTestNode(false);
    const msg = { lc: languageCode };

    expect(evaluateLanguageCode(node, msg)).toEqual(expected);
  });

  it('should throw an error if language is not supported', () => {
    const node = createTestNode(false);
    const msg = { lc: 'invalid' };

    expect(() => evaluateLanguageCode(node, msg)).toThrow('Language code "invalid" is not supported!');
  });

  it('should log information about shortening language code if logging is enabled', () => {
    const spy = jest.spyOn(RED.log, 'info');
    const node = createTestNode(true);
    const msg = { lc: 'en-GB' };

    expect(spy).not.toHaveBeenCalled();
    evaluateLanguageCode(node, msg);
    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining('Provided language code "en-GB" forwarded as "en" to aws comprehend.'),
    );
  });

  it('should not log information about shortening language code if logging is not enabled', () => {
    const spy = jest.spyOn(RED.log, 'info');
    const node = createTestNode(false);
    const msg = { lc: 'en-GB' };

    expect(spy).not.toHaveBeenCalled();
    evaluateLanguageCode(node, msg);
    expect(spy).not.toHaveBeenCalled();
  });

  function createTestNode(logging: boolean): { id: string; languageCode: string; logging: boolean } {
    return {
      id: 'test-node',
      languageCode: 'lc',
      logging,
    };
  }
});
