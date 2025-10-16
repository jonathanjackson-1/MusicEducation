const { getDefaultConfig } = require('@expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  '@soundstudio/types': require('path').resolve(__dirname, '../../packages/types/src')
};

module.exports = config;
