import { UserProvider } from "@auth0/nextjs-auth0/client";
import "./globals.css";

import type { Metadata } from "next";
import { ThemeProvider } from "@/components/theme-provider";

export const metadata: Metadata = {
	title: "App",
	description: "",
};

export type LayoutProps = {
	children?: React.ReactNode;
};

export default function Layout(props: LayoutProps) {
	return (
		<html>
			<body>
				<UserProvider>
					<ThemeProvider
						attribute="class"
						defaultTheme="system"
						enableSystem
						disableTransitionOnChange
					>
						<div style={{ display: "contents" }}>{props.children}</div>
					</ThemeProvider>
				</UserProvider>
			</body>
		</html>
	);
}
