interface IMimirTenantTokenConfig {
  name: string;
  apiKey: string;
}

interface IMimirTenantCustomBaseUrlConfig {
  tenantName: string;
  baseUrl: string;
}

export interface IMimirApiRequestConfig {
  baseUrl: string | null;
  tokenList: IMimirTenantTokenConfig[];
  customBaseUrls: IMimirTenantCustomBaseUrlConfig[];
}

export class MimirApiRequestConfig {
  baseUrl: string | null;
  tokenList: IMimirTenantTokenConfig[];
  customBaseUrls: IMimirTenantCustomBaseUrlConfig[];

  constructor(config: IMimirApiRequestConfig) {
    this.baseUrl = config.baseUrl;
    this.tokenList = config.tokenList;
    this.customBaseUrls = config.customBaseUrls;
  }

  getToken(tenantName: string): string {
    if (typeof tenantName !== 'string' || tenantName.trim().length === 0) {
      throw new Error('Invalid tenant!');
    }

    const tokenConfig = this.tokenList.find(tenant => tenant.name === tenantName);

    if (!tokenConfig) {
      throw new Error(`Token for tenant "${tenantName}" not found!`);
    }

    return `Bearer ${tokenConfig.apiKey}`;
  }

  getBaseUrl(tenantName: string): string | null {
    if (!Array.isArray(this.customBaseUrls) || this.customBaseUrls.length === 0) {
      return this.baseUrl;
    }

    const configItem = this.customBaseUrls.find(item => item.tenantName === tenantName);
    return configItem ? configItem.baseUrl : this.baseUrl;
  }
}
