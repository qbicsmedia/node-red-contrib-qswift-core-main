import DinaRundownExport, {
  IDinaRundownExportNode,
  IDinaRundownExportNodeConfig,
} from '@dina/nodes/dina-rundown-export';
import { ActiveRundownStore } from '@dina/util/ActiveRundownStore';
import helper, { TestFlowsItem } from 'node-red-node-test-helper';

jest.mock('@dina/util/ActiveRundownStore');

helper.init(require.resolve('node-red'));

const TEST_RUNDOWN_ID: string = 'TEST_RUNDOWN_ID';

describe('DinaRundownExport Node', () => {
  beforeEach(done => {
    helper.startServer(done);
  });

  afterEach(done => {
    helper.unload().then(() => helper.stopServer(done));
  });

  it('should handle a "create" rundown event', done => {
    const flow: TestFlowsItem[] = [rundownExportNodeFlow()];
    const createRundownMock = jest.fn();

    (ActiveRundownStore as unknown as jest.Mock).mockImplementation(() => ({
      createRundown: createRundownMock,
      on: jest.fn(),
      off: jest.fn(),
    }));

    helper.load(DinaRundownExport, flow, () => {
      const n1 = helper.getNode('n1');

      const msg = {
        payload: {
          event: 'rundown',
          type: 'create',
          id: TEST_RUNDOWN_ID,
          rundown: {},
          story: {},
        },
      };

      n1.receive(msg);

      setTimeout(() => {
        try {
          expect(createRundownMock).toHaveBeenCalledWith('TEST_RUNDOWN_ID', {}, msg, 10000);
          done();
        } catch (err) {
          done(err);
        }
      }, 100);
    });
  });

  it('should handle a "delete" rundown event', done => {
    const flow: TestFlowsItem[] = [rundownExportNodeFlow()];
    const removeRundownMock = jest.fn();

    (ActiveRundownStore as unknown as jest.Mock).mockImplementation(() => ({
      removeRundown: removeRundownMock,
      on: jest.fn(),
      off: jest.fn(),
    }));

    helper.load(DinaRundownExport, flow, () => {
      const n1 = helper.getNode('n1');

      const msg = {
        payload: {
          event: 'rundown',
          type: 'delete',
          id: 'TEST_RUNDOWN_ID',
          rundown: {},
          story: {},
        },
      };

      n1.receive(msg);

      setTimeout(() => {
        try {
          expect(removeRundownMock).toHaveBeenCalledWith('TEST_RUNDOWN_ID');
          done();
        } catch (err) {
          done(err);
        }
      }, 100);
    });
  });

  it('should handle a "complete" event and export the rundown', done => {
    const flow: TestFlowsItem[] = [rundownExportNodeFlow()];
    const activeRundownMock = {
      getRundown: jest.fn().mockReturnValue({ eventId: TEST_RUNDOWN_ID }),
      getMsg: jest.fn().mockReturnValue({ original: 'message' }),
    };

    (ActiveRundownStore as unknown as jest.Mock).mockImplementation(() => ({
      // eslint-disable-next-line @typescript-eslint/ban-types
      on: (event: string, callback: Function) => {
        if (event === 'complete') callback(activeRundownMock);
      },
      off: jest.fn(),
    }));

    helper.load(DinaRundownExport, flow, () => {
      const n1 = helper.getNode('n1') as IDinaRundownExportNode;

      setTimeout(() => {
        try {
          expect(n1).toHaveProperty('output');
          done();
        } catch (err) {
          done(err);
        }
      }, 100);
    });
  });

  it('should handle a "timeout" event and send an error message', done => {
    const flow: TestFlowsItem[] = [rundownExportNodeFlow()];
    const activeRundownMock = {
      getRundown: jest.fn().mockReturnValue({ eventId: 'test-event-id' }),
    };

    (ActiveRundownStore as unknown as jest.Mock).mockImplementation(() => ({
      // eslint-disable-next-line @typescript-eslint/ban-types
      on: (event: string, callback: Function) => {
        if (event === 'timeout') callback(activeRundownMock);
      },
      off: jest.fn(),
    }));

    helper.load(DinaRundownExport, flow, () => {
      const n1 = helper.getNode('n1') as IDinaRundownExportNode;

      setTimeout(() => {
        try {
          expect(n1).toHaveProperty('output');
          done();
        } catch (err) {
          done(err);
        }
      }, 100);
    });
  });

  function rundownExportNodeFlow(): TestFlowsItem<IDinaRundownExportNodeConfig> {
    return {
      id: 'n1',
      type: 'dina-rundown-export',
      output: 'output',
      timeout: '10000',
    };
  }
});
