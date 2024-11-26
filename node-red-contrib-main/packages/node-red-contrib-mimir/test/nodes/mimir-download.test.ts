import helper, { TestFlowsItem } from 'node-red-node-test-helper';

import MimirDownloadNode, {
  IMimirDownloadNode,
  IMimirDownloadNodeConfig,
  IMimirDownloadNodeMessage,
  IMimirDownloadNodeOutput,
} from '../../src/nodes/mimir-download';

import * as MimirDownloadModule from '../../src/lib/MimirDownload';

import { createTestOutputHelper, TEST_ERROR_TEXT, TEST_ITEM_ID } from '../helper';

const downloadProto = MimirDownloadModule.MimirDownload.prototype;
const mockedDownload = jest.fn() as jest.MockedFunction<typeof downloadProto.download>;
const mockedExtractUrl = jest.fn() as jest.MockedFunction<typeof downloadProto.extractUrl>;
const mockedExtractLanguageCode = jest.fn() as jest.MockedFunction<typeof downloadProto.extractLanguageCode>;
const mockedTransformData = jest.fn() as jest.MockedFunction<typeof downloadProto.transformData>;

jest.mock<typeof import('../../src/lib/MimirDownload')>('../../src/lib/MimirDownload', () => {
  return {
    MimirDownload: jest.fn().mockImplementation(() => {
      return {
        download: mockedDownload,
        extractUrl: mockedExtractUrl,
        extractLanguageCode: mockedExtractLanguageCode,
        transformData: mockedTransformData,
      };
    }),
  };
});

helper.init(require.resolve('node-red'));

describe('mimir-download', () => {
  const TEST_BASE_URL = 'https://download.local';

  const { testErrorOutput, testSuccessOutput } = createTestOutputHelper(helper);
  const testMimirItem = {
    id: TEST_ITEM_ID,
    srtUrl: `${TEST_BASE_URL}/srt`,
    vttUrl: `${TEST_BASE_URL}/vtt`,
    languageCode: 'en',
  };

  beforeEach(function (done) {
    helper.startServer(done);
  });

  afterEach(function (done) {
    helper.unload().then(() => helper.stopServer(done));
  });

  it('should have configured properties', async () => {
    await setupTest({
      urlType: 'vttUrl',
      transformEnabled: true,
      output: 'myOutputProp',
    });

    const n1 = helper.getNode('n1') as IMimirDownloadNode;

    expect(n1).toHaveProperty('urlType');
    expect(n1).toHaveProperty('transformEnabled');
    expect(n1).toHaveProperty('output');

    expect(n1.urlType).toBe('vttUrl');
    expect(n1.transformEnabled).toBe(true);
    expect(n1.output).toBe('myOutputProp');
  });

  it('should download from provided urlType', async () => {
    const { languageCode, srtUrl } = testMimirItem;
    const urlType = 'srtUrl';
    const downloadText = 'this is some test download text';
    const result = {
      text: downloadText,
      languageCode,
    };

    mockedExtractUrl.mockReturnValue(srtUrl);
    mockedExtractLanguageCode.mockReturnValue(languageCode);
    mockedDownload.mockResolvedValue(downloadText);
    mockedTransformData.mockReturnValue(result);

    await setupTest({ urlType, transformEnabled: false });

    expect(mockedDownload).not.toHaveBeenCalled();
    expect(mockedTransformData).not.toHaveBeenCalled();

    const n1 = helper.getNode('n1') as IMimirDownloadNode;
    n1.receive({ payload: testMimirItem });

    await testSuccessOutput(async (_msg: unknown) => {
      expect(mockedDownload).toHaveBeenCalledWith(srtUrl);
      expect(mockedTransformData).toHaveBeenCalledWith(downloadText, urlType, false, languageCode);

      const msg = _msg as IMimirDownloadNodeMessage & IMimirDownloadNodeOutput;
      expect(msg).toHaveProperty('output');
      expect(msg.output).toEqual(result);
    });
  });

  it.each([{ url: null }, { url: '' }])(
    'should throw an error if url type could not be extracted (url: $url)',
    async ({ url }) => {
      mockedExtractUrl.mockReturnValue(url);

      await setupTest();
      const n1 = helper.getNode('n1') as IMimirDownloadNode;

      await new Promise(resolve => {
        n1.receive({});
        // @ts-expect-error signature not declared
        n1.on('call:error', call => {
          call.should.be.calledWithMatch('could not be extracted!');
          resolve({});
        });
      });
    },
  );

  it('should forward api error to error output', async () => {
    mockedDownload.mockRejectedValue(TEST_ERROR_TEXT);
    mockedExtractUrl.mockReturnValue(testMimirItem.srtUrl);
    mockedExtractLanguageCode.mockReturnValue('en');

    await setupTest();

    const n1 = helper.getNode('n1') as IMimirDownloadNode;
    n1.receive({ payload: testMimirItem });

    await testErrorOutput(async (_msg: unknown) => {
      const msg = _msg as IMimirDownloadNodeMessage & IMimirDownloadNodeOutput;
      expect(msg).toHaveProperty('error');
      expect(msg.error).toEqual(TEST_ERROR_TEXT);
    });
  });

  async function setupTest(downloadFlowOptions: Partial<IMimirDownloadNodeConfig> = {}): Promise<void> {
    const flow = [
      { id: 'f1', type: 'tab', label: 'Test Flow' },
      createTestMimirDownloadFlow(downloadFlowOptions),
      { id: 'successNode', z: 'f1', type: 'helper' },
      { id: 'errorNode', z: 'f1', type: 'helper' },
    ];

    await helper.load(MimirDownloadNode, flow);
  }

  function createTestMimirDownloadFlow(
    options: Partial<IMimirDownloadNodeConfig>,
  ): TestFlowsItem<IMimirDownloadNodeConfig> {
    return {
      id: 'n1',
      z: 'f1',
      type: 'mimir-download',
      urlType: 'srtUrl',
      transformEnabled: false,
      output: 'output',
      wires: [['successNode'], ['errorNode']],
      ...options,
    };
  }
});
