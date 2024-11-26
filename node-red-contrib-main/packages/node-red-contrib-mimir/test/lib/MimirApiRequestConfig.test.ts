import { IMimirApiRequestConfig, MimirApiRequestConfig } from '../../src/lib/MimirApiRequestConfig';

describe('MimirApiRequestConfig', () => {
  const TEST_BASE_URL = 'https://tenant.local';

  describe('getToken', () => {
    it('should return bearer token for given tenant', () => {
      const requestConfig = createMimirApiRequestConfig();

      expect(requestConfig.getToken('tenant1')).toBe('Bearer apiKey1');
      expect(requestConfig.getToken('tenant2')).toBe('Bearer apiKey2');
      expect(requestConfig.getToken('tenant3')).toBe('Bearer apiKey3');
    });

    it.each([{ tenantName: null }, { tenantName: '' }, { tenantName: true }, { tenantName: 1234 }])(
      'should throw an error if given tenant is invalid (tenantName: $tenantName)',
      ({ tenantName }) => {
        const requestConfig = createMimirApiRequestConfig();

        // @ts-expect-error wrong type (testing purpose)
        expect(() => requestConfig.getToken(tenantName)).toThrow('Invalid tenant!');
      },
    );

    it('should throw an error if no token for the given tenant is provided', () => {
      const requestConfig = createMimirApiRequestConfig();
      expect(() => requestConfig.getToken('noTokenTenant')).toThrow('Token for tenant "noTokenTenant" not found!');
    });
  });

  describe('getBaseUrl', () => {
    it('should get base url if no custom base urls for tenants are defined', () => {
      const requestConfig = createMimirApiRequestConfig({ customBaseUrls: [] });
      expect(requestConfig.getBaseUrl('tenant1')).toBe(TEST_BASE_URL);
    });

    it('should get base url if no custom base url for given tenant is defined', () => {
      const requestConfig = createMimirApiRequestConfig();
      expect(requestConfig.getBaseUrl('tenant4')).toBe(TEST_BASE_URL);
    });

    it('should get custom base url if a custom url for given tenant is defined', () => {
      const requestConfig = createMimirApiRequestConfig();
      expect(requestConfig.getBaseUrl('tenant1')).toBe('https://tenant1.local');
    });
  });

  function createMimirApiRequestConfig(options: Partial<IMimirApiRequestConfig> = {}): MimirApiRequestConfig {
    const config = {
      baseUrl: TEST_BASE_URL,
      tokenList: [
        { name: 'tenant1', apiKey: 'apiKey1' },
        { name: 'tenant2', apiKey: 'apiKey2' },
        { name: 'tenant3', apiKey: 'apiKey3' },
      ],
      customBaseUrls: [
        { tenantName: 'tenant1', baseUrl: 'https://tenant1.local' },
        { tenantName: 'tenant2', baseUrl: 'https://tenant2.local' },
      ],
      ...options,
    };
    return new MimirApiRequestConfig(config);
  }
});
