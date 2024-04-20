// @ts-check

/**
 * @type{import('next').NextConfig}
 */
const config = {
	async rewrites() {
		return [
			{
				source: "/maps/:path*",
				destination: "http://127.0.0.1:8000/maps/:path*",
			},
		];
	},
};

export default config;
