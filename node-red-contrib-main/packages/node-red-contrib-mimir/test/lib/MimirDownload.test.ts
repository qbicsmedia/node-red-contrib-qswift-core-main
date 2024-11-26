import axios from 'axios';

import { MimirDownload, TUrlType } from '../../src/lib/MimirDownload';

jest.mock('axios');
const mockedAxiosGet = axios.get as jest.MockedFunction<typeof axios.get>;

describe('MimirDownload', () => {
  const testBaseUrl = 'https://download.local';
  const mockedUrls = {
    SRT: `${testBaseUrl}/srt`,
    VTT: `${testBaseUrl}/vtt`,
    TRANSLATION_SRT: `${testBaseUrl}/translationSrt`,
    TRANSLATION_VTT: `${testBaseUrl}/translationVtt`,
    TIMED_TRANSCRIPT: `${testBaseUrl}/timedTranscript`,
    TIMED_TRANSLATED_TRANSCRIPT: `${testBaseUrl}/timedTranslatedTranscript`,
  };
  const mockedMimirItem = {
    id: 'm1m1r-173m-p4yl04d',
    srtUrl: mockedUrls.SRT,
    vttUrl: mockedUrls.VTT,
    translationSrtUrl: mockedUrls.TRANSLATION_SRT,
    translationVttUrl: mockedUrls.TRANSLATION_VTT,
    timedTranscriptUrl: mockedUrls.TIMED_TRANSCRIPT,
    timedTranslatedTranscriptUrl: mockedUrls.TIMED_TRANSLATED_TRANSCRIPT,
    languageCode: 'de',
    translationLanguage: 'en',
  };
  const testTimedTranscriptions = [
    { content: 'One', startTime: 40, endTime: 140 },
    { content: 'of', startTime: 140, endTime: 200 },
    { content: 'the', startTime: 200, endTime: 290 },
    { content: 'veteran', startTime: 290, endTime: 740 },
    { content: 'actors', startTime: 740, endTime: 1260 },
  ];
  const testSrtTranscription = `1\n00:00:00,040 --> 00:00:02,359\nOne of the veteran actors from Laverne and\n\n2\n00:00:02,360 --> 00:00:04,149\nShirley, the 1970s sitcom.\n\n3\n00:00:04,150 --> 00:00:04,639\nRemember him.`;
  const testVttTranscription = `WEBVTT\n\n1\n00:00:00.040 --> 00:00:02.359\nOne of the veteran actors from Laverne and\n\n2\n00:00:02.360 --> 00:00:04.149\nShirley, the 1970s sitcom.\n\n3\n00:00:04.150 --> 00:00:04.639\nRemember him.`;
  const testTranscriptionTransformed =
    'One of the veteran actors from Laverne and Shirley, the 1970s sitcom. Remember him.';

  it('should download data from provided url', async () => {
    mockedAxiosGet.mockResolvedValue({ status: 200, data: 'some downloaded data' });

    const mockedUrl = `${testBaseUrl}/path/to/data`;
    const mimirDownload = new MimirDownload();

    expect(mockedAxiosGet).not.toHaveBeenCalled();
    expect(await mimirDownload.download(mockedUrl)).toEqual('some downloaded data');
    expect(mockedAxiosGet).toHaveBeenCalledWith(mockedUrl);
  });

  it.each([
    { urlType: 'srtUrl', url: mockedUrls.SRT },
    { urlType: 'vttUrl', url: mockedUrls.VTT },
    { urlType: 'translationSrtUrl', url: mockedUrls.TRANSLATION_SRT },
    { urlType: 'translationVttUrl', url: mockedUrls.TRANSLATION_VTT },
    { urlType: 'timedTranscriptUrl', url: mockedUrls.TIMED_TRANSCRIPT },
    { urlType: 'timedTranslatedTranscriptUrl', url: mockedUrls.TIMED_TRANSLATED_TRANSCRIPT },
  ] as { urlType: TUrlType; url: string }[])(
    'should extract url to download according to url type ($urlType)',
    ({ urlType, url }) => {
      const mimirDownload = new MimirDownload();
      expect(mimirDownload.extractUrl(mockedMimirItem, urlType)).toBe(url);
    },
  );

  it('should return null for url to download on wrong url type', () => {
    const mimirDownload = new MimirDownload();
    // @ts-expect-error wrong type (testing purpose)
    expect(mimirDownload.extractUrl(mockedMimirItem, 'invalidUrlType')).toBe(null);
  });

  it.each([
    { urlType: 'srtUrl', languageCode: 'de' },
    { urlType: 'vttUrl', languageCode: 'de' },
    { urlType: 'translationSrtUrl', languageCode: 'en' },
    { urlType: 'translationVttUrl', languageCode: 'en' },
    { urlType: 'timedTranscriptUrl', languageCode: 'de' },
    { urlType: 'timedTranslatedTranscriptUrl', languageCode: 'en' },
  ] as { urlType: TUrlType; languageCode: string }[])(
    'should extract language code according to url type ($urlType)',
    ({ urlType, languageCode }) => {
      const mimirDownload = new MimirDownload();
      expect(mimirDownload.extractLanguageCode(mockedMimirItem, urlType)).toBe(languageCode);
    },
  );

  it('should return value of languageCode on wrong url type', () => {
    const mimirDownload = new MimirDownload();
    // @ts-expect-error wrong type (testing purpose)
    expect(mimirDownload.extractLanguageCode(mockedMimirItem, 'invalidUrlType')).toBe('de');
  });

  it.each(['timedTranscriptUrl', 'timedTranslatedTranscriptUrl'] as TUrlType[])(
    'should never transform downloaded timed transcriptions (%s)',
    urlType => {
      const mimirDownload = new MimirDownload();
      expect(mimirDownload.transformData(testTimedTranscriptions, urlType, true, 'de')).toEqual({
        languageCode: 'de',
        timedTranscriptions: testTimedTranscriptions,
      });
    },
  );

  it.each([
    { urlType: 'srtUrl', input: testSrtTranscription, output: testTranscriptionTransformed },
    { urlType: 'vttUrl', input: testVttTranscription, output: testTranscriptionTransformed },
    { urlType: 'translationSrtUrl', input: testSrtTranscription, output: testTranscriptionTransformed },
    { urlType: 'translationVttUrl', input: testVttTranscription, output: testTranscriptionTransformed },
  ] as { urlType: TUrlType; input: string; output: string }[])(
    'should transform downloaded transcriptions on transform enabled ($urlType)',
    ({ urlType, input, output }) => {
      const mimirDownload = new MimirDownload();
      expect(mimirDownload.transformData(input, urlType, true, 'de')).toEqual({
        languageCode: 'de',
        text: output,
      });
    },
  );

  it.each([
    { urlType: 'srtUrl', transcription: testSrtTranscription },
    { urlType: 'vttUrl', transcription: testVttTranscription },
    { urlType: 'translationSrtUrl', transcription: testSrtTranscription },
    { urlType: 'translationVttUrl', transcription: testVttTranscription },
  ] as { urlType: TUrlType; transcription: string }[])(
    'should not transform downloaded transcriptions on transform disabled ($urlType)',
    ({ urlType, transcription }) => {
      const mimirDownload = new MimirDownload();
      expect(mimirDownload.transformData(transcription, urlType, false, 'de')).toEqual({
        languageCode: 'de',
        text: transcription,
      });
    },
  );

  it('should ignore misformatted transformation input parts', () => {
    const input =
      '1\nannotation 1\nsection 1.1\nsection 1.2\nsection 1.3\n\n2\n(misformed) annotation 2\n\n3\nannotation 3\nsection 3.1\nsection 3.2\n\n4\n\n5\nannotation 5\nsection 5.1\nsection 5.2';
    const mimirDownload = new MimirDownload();

    expect(mimirDownload.transformTranscription(input)).toEqual(
      'section 1.1 section 1.2 section 1.3 section 3.1 section 3.2 section 5.1 section 5.2',
    );
  });
});
