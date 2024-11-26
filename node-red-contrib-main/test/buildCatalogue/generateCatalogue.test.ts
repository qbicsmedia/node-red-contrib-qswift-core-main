import * as fs from 'fs';
import { generateCatalogue } from '../../src/buildCatalogue/buildCatalogue';

jest.mock('fs');

describe('generateCatalogue', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should generate catalogue with mocked data', () => {
    const mockSubdirectories = ['module1', 'module2'];
    jest.spyOn(fs, 'readdirSync').mockReturnValue(mockSubdirectories as never);
    jest.spyOn(fs, 'existsSync').mockReturnValue(true);
    jest.spyOn(fs, 'statSync').mockReturnValue({
      isDirectory: () => true,
    } as fs.Stats);
    jest.spyOn(fs, 'readFileSync').mockReturnValue(
      JSON.stringify({
        name: 'testModule',
        version: '1.0.0',
        description: 'Test module for mock',
        keywords: ['test', 'mock'],
        repository: {
          url: 'https://github.com/test/testModule',
        },
      }),
    );

    jest.spyOn(fs, 'writeFileSync').mockImplementation(() => {});

    generateCatalogue();

    expect(fs.readdirSync).toHaveBeenCalledWith(expect.stringContaining('packages'));
    expect(fs.existsSync).toHaveBeenCalled();
    expect(fs.readFileSync).toHaveBeenCalled();
    expect(fs.writeFileSync).toHaveBeenCalled();
  });
});
