import * as fs from 'fs';
import * as path from 'path';

interface ModuleInfo {
  id: string;
  version: string;
  description: string;
  updated_at: string;
  types: string[];
  keywords: string[];
  url: string;
}

const PACKAGE_FOLDER = '../packages';
const packageDir: string = path.join(__dirname, PACKAGE_FOLDER);
const outputJsonPath: string = path.join(__dirname, '../catalogue.json');

export const readPackageJson = (dir: string): ModuleInfo | null => {
  const packageJsonPath: string = path.join(dir, 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const updatedAt: string = new Date().toISOString();
    return {
      id: packageJson.name,
      version: packageJson.version,
      description: packageJson.description || '',
      updated_at: updatedAt,
      types: [],
      keywords: packageJson.keywords || [],
      url: packageJson.repository.url,
    };
  }
  return null;
};

export const getSubdirectories = (dir: string): string[] => {
  return fs.readdirSync(dir).filter((subdir: string) => {
    return fs.statSync(path.join(dir, subdir)).isDirectory();
  });
};

export const generateCatalogue = (): void => {
  const subdirectories: string[] = getSubdirectories(packageDir);
  const folderListJson = {
    name: 'Kunusta Private Nodes',
    updated_at: new Date().toISOString(),
    modules: [] as ModuleInfo[],
  };

  subdirectories.forEach((subdir: string) => {
    const module: ModuleInfo | null = readPackageJson(path.join(packageDir, subdir));
    if (module) {
      folderListJson.modules.push(module);
    }
  });

  fs.writeFileSync(outputJsonPath, JSON.stringify(folderListJson, null, 2), 'utf8');
  console.log(`Generated ${outputJsonPath}`);
};
