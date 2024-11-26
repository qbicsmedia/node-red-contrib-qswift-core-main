import * as fs from 'fs';
import { getSubdirectories } from '../../src/buildCatalogue/buildCatalogue';

jest.mock('fs');

describe('getSubdirectories()', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should return an array of subdirectory names', () => {
    jest.spyOn(fs, 'readdirSync').mockReturnValue(['dir1', 'dir2'] as never);
    jest.spyOn(fs, 'statSync').mockReturnValue({
      isDirectory: () => true,
    } as fs.Stats);
    const result = getSubdirectories('/mocked/path');
    expect(result).toEqual(['dir1', 'dir2']);
  });
});
