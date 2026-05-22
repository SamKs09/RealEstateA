const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Exclude backend directory and other non-mobile directories
config.resolver.blockList = [
  /.*\/realestate_backend-main\/.*/,
  /.*\/RealEstate-WebSite\/.*/,
  /.*\/Support_Front\/.*/,
];

// Ensure we only watch the mobile app directory
config.watchFolders = [__dirname];

module.exports = config;
