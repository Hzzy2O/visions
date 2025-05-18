/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
		remotePatterns: [
			{
				protocol: "https",
				hostname: process.env.FLUX_URL?.replace("https://", "") || "",
				pathname: "/image/**",
			},
      {
        protocol: "https",
        hostname: "aggregator.walrus-testnet.walrus.space",
        pathname: "/v1/blobs/**",
      }
		],
	},
}

export default nextConfig
