import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  moduleNameMapper: {
    '^@shared/(.*)$': '<rootDir>/src/shared/$1',
    '^@main/(.*)$': '<rootDir>/src/main/$1',
    '^@renderer/(.*)$': '<rootDir>/src/renderer/$1',
  },
  projects: [
    {
      displayName: 'node',
      preset: 'ts-jest',
      testEnvironment: 'node',
      testMatch: [
        '<rootDir>/tests/unit/formatters.test.ts',
        '<rootDir>/tests/unit/FileRecordingRepository.test.ts',
        '<rootDir>/tests/unit/RecordingService.test.ts',
        '<rootDir>/tests/unit/window.test.ts',
        '<rootDir>/tests/integration/**/*.ts',
      ],
      moduleNameMapper: {
        '^@shared/(.*)$': '<rootDir>/src/shared/$1',
        '^@main/(.*)$': '<rootDir>/src/main/$1',
      },
      globals: { 'ts-jest': { tsconfig: 'tsconfig.node.json' } },
    },
    {
      displayName: 'jsdom',
      preset: 'ts-jest',
      testEnvironment: 'jest-environment-jsdom',
      testMatch: [
        '<rootDir>/tests/unit/*.test.tsx',
        '<rootDir>/tests/unit/useAudioRecorder.test.ts',
      ],
      setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
      moduleNameMapper: {
        '^@shared/(.*)$': '<rootDir>/src/shared/$1',
        '^@renderer/(.*)$': '<rootDir>/src/renderer/$1',
      },
      globals: { 'ts-jest': { tsconfig: 'tsconfig.node.json' } },
    },
  ],
  collectCoverageFrom: [
    'src/shared/formatters.ts',
    'src/main/recordings/**/*.ts',
    'src/main/ipc-handlers.ts',
    'src/main/window.ts',
    'src/renderer/hooks/useAudioRecorder.ts',
    'src/renderer/components/**/*.tsx',
    'src/renderer/App.tsx',
  ],
  coverageThreshold: {
    global: {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
  },
};

export default config;
