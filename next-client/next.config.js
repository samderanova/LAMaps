// @ts-check

/**
 * @type{import('next').NextConfig}
 */
const config = {
	async rewrites() {
		return [
			{
				source: "/api/:path*",
				destination: "http://127.0.0.1:8000/api/:path*",
			},
		];
	},
};

export default config;
