const { getDefaultConfig } = require('@expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add support for additional file extensions
config.resolver.sourceExts.push('mjs', 'cjs');
config.resolver.assetExts.push('db', 'sqlite');

// Enable symlinks for better development experience
config.resolver.unstable_enableSymlinks = true;

module.exports = config;