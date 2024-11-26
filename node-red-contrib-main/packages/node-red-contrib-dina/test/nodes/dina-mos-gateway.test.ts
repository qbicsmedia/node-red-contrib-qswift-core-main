import DinaMosConfig, { IDinaMosConfigNode, IDinaMosConfigNodeConfig, MosConfig } from '@dina/nodes/dina-mos-config';
import DinaMosGateway, { IDinaMosGatewayNode, IDinaMosGatewayNodeConfig } from '@dina/nodes/dina-mos-gateway';
import { EventEmitter } from '@dina/util/EventEmitter';
import helper, { TestFlowsItem } from 'node-red-node-test-helper';

helper.init(require.resolve('node-red'));

describe('DinaMosGateway Node', () => {
  beforeEach(done => {
    helper.startServer(done);
  });

  afterEach(done => {
    helper.unload().then(() => helper.stopServer(done));
  });

  it('should register with DinaMosConfig and handle events', function (done) {
    const flow: TestFlowsItem[] = [{ id: 'f1', type: 'tab', name: 'Test Flow' }, configNodeFlow(), gatewayNodeFlow()];

    helper.load([DinaMosConfig, DinaMosGateway], flow, () => {
      const n1 = helper.getNode('n1') as IDinaMosGatewayNode;
      const configNode = helper.getNode('n0') as IDinaMosConfigNode;

      expect(n1).toBeDefined();
      expect(configNode).toBeDefined();

      const eventEmitter = new EventEmitter();
      const mosConfig = new MosConfig(eventEmitter);

      configNode.injectMosConfig(mosConfig);

      eventEmitter.emit('opened', 'open message');
      setTimeout(() => {
        try {
          eventEmitter.emit('closed', 'close message');
          setTimeout(() => {
            try {
              done();
            } catch (err) {
              done(err);
            }
          }, 100);
        } catch (err) {
          done(err);
        }
      }, 100);
    });
  });

  function configNodeFlow(): TestFlowsItem<IDinaMosConfigNodeConfig> {
    return {
      id: 'n0',
      z: 'f1',
      type: 'dina-mos-config',
      name: 'Dina Mos Config',
      wsUrl: 'ws://localhost',
      headers: '{}',
    };
  }

  function gatewayNodeFlow(): TestFlowsItem<IDinaMosGatewayNodeConfig> {
    return {
      id: 'n1',
      z: 'f1',
      type: 'dina-mos-gateway',
      config: 'n0',
    };
  }
});
