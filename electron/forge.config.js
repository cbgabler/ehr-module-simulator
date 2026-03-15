import { cp, rm } from 'fs/promises';
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default {
  packagerConfig: {
    asar: true,
    name: 'EHR Module Simulator',
    executableName: 'ehr-module-simulator',
    ignore: [/^\/src/, /^\/\.git/, /^\/node_modules\/.cache/],
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        name: 'ehr_module_simulator',
        authors: 'Oregon State Capstone Team CS.012',
        description: 'EHR Module Simulator for education at OHSU',
      },
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin', 'linux'],
    },
    {
      name: '@electron-forge/maker-dmg',
      platforms: ['darwin'],
    },
  ],
  hooks: {
    prePackage: async () => {
      // Build the React frontend
      execSync('npm run build', {
        cwd: path.join(__dirname, '..', 'frontend'),
        stdio: 'inherit',
      });

      // Copy frontend/dist → electron/build
      const src = path.join(__dirname, '..', 'frontend', 'dist');
      const dest = path.join(__dirname, 'build');
      await rm(dest, { recursive: true, force: true });
      await cp(src, dest, { recursive: true });
    },
  },
};
