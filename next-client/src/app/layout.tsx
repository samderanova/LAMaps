import "./globals.css";

import { UserProvider } from "@auth0/nextjs-auth0/client";
import { ThemeProvider } from "@/components/theme-provider";
import { Header } from "@/components/layout/header";
import type { Metadata } from "next";

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
              <Header />
              <div className="min-h-screen flex">{props.children}</div>
          </ThemeProvider>
        </UserProvider>
      </body>
    </html>
  );
}
