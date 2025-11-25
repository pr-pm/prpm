import path from 'path';
import module from 'module';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Ensure stubbed dependencies are resolvable without network installs
const stubPath = path.resolve(__dirname, 'shared/stubs');
process.env.NODE_PATH = process.env.NODE_PATH
  ? `${process.env.NODE_PATH}${path.delimiter}${stubPath}`
  : stubPath;
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - initPaths is intentionally used to refresh module search paths
module.Module._initPaths();
