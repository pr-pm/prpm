/**
 * Tests for license-extractor utilities
 */

import { extractLicenseInfo, validateLicenseInfo, LicenseInfo } from '../license-extractor';
import { writeFile, mkdir, rm } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';

describe('license-extractor', () => {
  let testDir: string;
  let originalCwd: string;

  beforeEach(async () => {
    // Create test directory
    testDir = join(tmpdir(), `prpm-license-test-${Date.now()}`);
    await mkdir(testDir, { recursive: true });
    originalCwd = process.cwd();
    process.chdir(testDir);
  });

  afterEach(async () => {
    process.chdir(originalCwd);
    await rm(testDir, { recursive: true, force: true });
  });

  describe('extractLicenseInfo', () => {
    it('should detect MIT license', async () => {
      const licenseText = `MIT License

Copyright (c) 2024 Test Author

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction...`;

      await writeFile(join(testDir, 'LICENSE'), licenseText);

      const result = await extractLicenseInfo();

      expect(result.type).toBe('MIT');
      expect(result.text).toBe(licenseText);
      expect(result.fileName).toBe('LICENSE');
    });

    it('should detect Apache 2.0 license', async () => {
      const licenseText = `                                 Apache License
                           Version 2.0, January 2004
                        http://www.apache.org/licenses/

   TERMS AND CONDITIONS FOR USE, REPRODUCTION, AND DISTRIBUTION...`;

      await writeFile(join(testDir, 'LICENSE'), licenseText);

      const result = await extractLicenseInfo();

      expect(result.type).toBe('Apache-2.0');
      expect(result.text).toBe(licenseText);
    });

    it('should detect GPL-3.0 license', async () => {
      const licenseText = `                    GNU GENERAL PUBLIC LICENSE
                       Version 3, 29 June 2007

 Copyright (C) 2007 Free Software Foundation, Inc. <https://fsf.org/>
 Everyone is permitted to copy and distribute verbatim copies...`;

      await writeFile(join(testDir, 'LICENSE'), licenseText);

      const result = await extractLicenseInfo();

      expect(result.type).toBe('GPL-3.0');
    });

    it('should detect BSD-3-Clause license', async () => {
      const licenseText = `BSD 3-Clause License

Copyright (c) 2024, Test Author
All rights reserved...`;

      await writeFile(join(testDir, 'LICENSE'), licenseText);

      const result = await extractLicenseInfo();

      expect(result.type).toBe('BSD-3-Clause');
    });

    it('should return null values when no license file found', async () => {
      const result = await extractLicenseInfo();

      expect(result.type).toBeNull();
      expect(result.text).toBeNull();
      expect(result.url).toBeNull();
      expect(result.fileName).toBeNull();
    });

    it('should try multiple license file patterns', async () => {
      const licenseText = 'MIT License\n\nTest license';
      await writeFile(join(testDir, 'LICENSE.md'), licenseText);

      const result = await extractLicenseInfo();

      expect(result.fileName).toBe('LICENSE.md');
      expect(result.text).toBe(licenseText);
    });

    it('should prefer LICENSE over other patterns', async () => {
      await writeFile(join(testDir, 'LICENSE'), 'MIT License\n\nPrimary license');
      await writeFile(join(testDir, 'LICENSE.txt'), 'MIT License\n\nSecondary license');

      const result = await extractLicenseInfo();

      expect(result.fileName).toBe('LICENSE');
      expect(result.text).toContain('Primary license');
    });

    it('should generate GitHub URL when repository provided', async () => {
      const licenseText = 'MIT License\n\nTest';
      await writeFile(join(testDir, 'LICENSE'), licenseText);

      const result = await extractLicenseInfo('https://github.com/owner/repo');

      expect(result.url).toBe('https://raw.githubusercontent.com/owner/repo/main/LICENSE');
    });

    it('should generate GitHub URL for SSH format', async () => {
      const licenseText = 'MIT License\n\nTest';
      await writeFile(join(testDir, 'LICENSE'), licenseText);

      const result = await extractLicenseInfo('git@github.com:owner/repo.git');

      expect(result.url).toBe('https://raw.githubusercontent.com/owner/repo/main/LICENSE');
    });

    it('should return null URL for non-GitHub repositories', async () => {
      const licenseText = 'MIT License\n\nTest';
      await writeFile(join(testDir, 'LICENSE'), licenseText);

      const result = await extractLicenseInfo('https://gitlab.com/owner/repo');

      expect(result.url).toBeNull();
    });

    it('should return null URL when no repository provided', async () => {
      const licenseText = 'MIT License\n\nTest';
      await writeFile(join(testDir, 'LICENSE'), licenseText);

      const result = await extractLicenseInfo();

      expect(result.url).toBeNull();
    });

    it('should detect ISC license', async () => {
      const licenseText = `ISC License

Copyright (c) 2024, Test Author

Permission to use, copy, modify...`;

      await writeFile(join(testDir, 'LICENSE'), licenseText);

      const result = await extractLicenseInfo();

      expect(result.type).toBe('ISC');
    });

    it('should detect Unlicense', async () => {
      const licenseText = `This is free and unencumbered software released into the public domain.

The Unlicense

Anyone is free to copy, modify, publish...`;

      await writeFile(join(testDir, 'LICENSE'), licenseText);

      const result = await extractLicenseInfo();

      expect(result.type).toBe('Unlicense');
    });

    it('should return license text without type for unknown licenses', async () => {
      const licenseText = 'Custom Proprietary License\n\nThis is a custom license.';
      await writeFile(join(testDir, 'LICENSE'), licenseText);

      const result = await extractLicenseInfo();

      expect(result.type).toBeNull();
      expect(result.text).toBe(licenseText);
      expect(result.fileName).toBe('LICENSE');
    });
  });

  describe('validateLicenseInfo', () => {
    let consoleSpy: jest.SpyInstance;

    beforeEach(() => {
      consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    });

    afterEach(() => {
      consoleSpy.mockRestore();
    });

    it('should log detected license type', () => {
      const licenseInfo: LicenseInfo = {
        type: 'MIT',
        text: 'MIT License...',
        url: null,
        fileName: 'LICENSE',
      };

      validateLicenseInfo(licenseInfo, 'test-package');

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('MIT'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('LICENSE'));
    });

    it('should log when license found but type unknown', () => {
      const licenseInfo: LicenseInfo = {
        type: null,
        text: 'Custom license...',
        url: null,
        fileName: 'LICENSE',
      };

      validateLicenseInfo(licenseInfo, 'test-package');

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Found'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('LICENSE'));
    });

    it('should log when no license found', () => {
      const licenseInfo: LicenseInfo = {
        type: null,
        text: null,
        url: null,
        fileName: null,
      };

      validateLicenseInfo(licenseInfo, 'test-package');

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Not found'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('without license'));
    });
  });
});
