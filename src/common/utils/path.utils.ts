import { join } from 'path';

export const getRootDir = (path?: string): string => {
  const cwd = process.cwd();
  return path ? join(cwd, path) : cwd;
};

export function getResourcesDir(path?: string): string {
  return path ? getRootDir(join('resources', path)) : getRootDir('resources');
}
