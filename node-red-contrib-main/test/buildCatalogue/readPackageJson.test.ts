import * as fs from 'fs';
import { readPackageJson } from '../../src/buildCatalogue/buildCatalogue';

jest.mock('fs');

describe('readPackageJson()', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should read packageJson', () => {
    const mockData = {
      name: '@kunnusta/node-red-contrib-mimir',
      version: '1.0.7',
      description: 'Mimir nodes for kunnusta workflow engine',
      updated_at: 'time',
      types: [],
      keywords: ['node-red'],
      repository: {
        url: 'https://github.com/Kunnusta/node-red-contrib.git',
      },
    };
    jest.spyOn(fs, 'existsSync').mockReturnValue(true);
    jest.spyOn(fs, 'readFileSync').mockReturnValue(JSON.stringify(mockData));
    const result = readPackageJson('/mocked/path');
    expect(result).toHaveProperty(['description']);
  });
});
