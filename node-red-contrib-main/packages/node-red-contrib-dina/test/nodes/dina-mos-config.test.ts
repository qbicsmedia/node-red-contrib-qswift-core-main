import DinaMosConfig, { IDinaMosConfigNode } from '@dina/nodes/dina-mos-config';
import helper from 'node-red-node-test-helper';
import WebSocket from 'ws';

const mockWebSocket = {
  on: jest.fn(),
  send: jest.fn(),
  close: jest.fn(),
  setMaxListeners: jest.fn(),
  readyState: WebSocket.CLOSED,
};

jest.mock('ws', () => {
  return jest.fn(() => mockWebSocket);
});

helper.init(require.resolve('node-red'));
describe('dina-mos-config', () => {
  beforeEach(function (done) {
    helper.startServer(done);
  });

  afterEach(function (done) {
    helper.unload().then(() => helper.stopServer(done));
  });

  it('should connect websocket', function (done) {
    const flow = [{ id: 'n1', z: 'f1', type: 'dina-mos-config', wsUrl: 'wss://localhost:3000' }];
    helper.load(DinaMosConfig, flow, async function () {
      const node = helper.getNode('n1') as IDinaMosConfigNode;
      expect(node).toHaveProperty('wsUrl');
      try {
        done();
      } catch (err) {
        done(err);
      }
    });
  });
});
