/** @type {import('next').NextConfig} */
const redirects = require("./src/data/redirects.json");

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

module.exports = nextConfig;
