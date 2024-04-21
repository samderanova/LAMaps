import "./globals.css";

import { ThemeProvider } from "@/components/theme-provider";
import Header from "@/components/layout/header";
import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "LAMaps",
	description: "",
};

export type LayoutProps = {
	children?: React.ReactNode;
};

export default function Layout(props: LayoutProps) {
	return (
		<html>
			<body>
				<ThemeProvider
					attribute="class"
					defaultTheme="system"
					enableSystem
					disableTransitionOnChange
				>
					<Header />
					<div className="min-h-screen flex">{props.children}</div>
				</ThemeProvider>
			</body>
		</html>
	);
}
