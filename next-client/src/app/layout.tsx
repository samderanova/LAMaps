import "./globals.css";

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
        <div style={{ display: "contents" }}>{props.children}</div>
      </body>
    </html>
  );
}
