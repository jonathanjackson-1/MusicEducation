const { getDefaultConfig } = require('jest-expo/legacy');

const config = getDefaultConfig(__dirname);

module.exports = {
  ...config,
  preset: 'jest-expo/ios',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|expo(nent)?|@expo|expo-status-bar)/)'
  ]
};
