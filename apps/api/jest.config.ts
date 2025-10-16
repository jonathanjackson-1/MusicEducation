import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '.',
  moduleFileExtensions: ['ts', 'js', 'json'],
  testMatch: ['<rootDir>/src/**/*.spec.ts'],
  moduleNameMapper: {
    '^@soundstudio/types$': '<rootDir>/../../packages/types/src',
    '^@soundstudio/ui$': '<rootDir>/../../packages/ui/src'
  }
};

export default config;
