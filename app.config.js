const fs = require('fs');

/**
 * Firebase Cloud Messaging config files hold project identifiers, not secrets, but we keep them out of git.
 * Locally: drop google-services.json / GoogleService-Info.plist in the repo root.
 * EAS: create file secrets and expose their paths as GOOGLE_SERVICES_JSON / GOOGLE_SERVICE_INFO_PLIST.
 */
module.exports = ({ config }) => {
  const android = process.env.GOOGLE_SERVICES_JSON ?? (fs.existsSync('./google-services.json') ? './google-services.json' : undefined);
  const ios = process.env.GOOGLE_SERVICE_INFO_PLIST ?? (fs.existsSync('./GoogleService-Info.plist') ? './GoogleService-Info.plist' : undefined);
  return {
    ...config,
    ios: { ...config.ios, ...(ios ? { googleServicesFile: ios } : {}) },
    android: { ...config.android, ...(android ? { googleServicesFile: android } : {}) },
  };
};
