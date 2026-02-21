/** @type {import('next').NextConfig} */
const redirects = require("./src/data/redirects.json");
const withNextIntl = require("next-intl/plugin")("./src/i18n/request.ts");

const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return redirects.map((rule) => ({
      source: rule.source,
      destination: rule.destination,
      permanent: true
    }));
  }
};

module.exports = withNextIntl(nextConfig);
