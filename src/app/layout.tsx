import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "视频工坊 · Video Studio",
  description: "用一句话生成 Remotion 动效视频 · Generate Remotion animations from a single prompt",
  icons: {
    icon: "/icon-512.png",
    apple: "/icon-512.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className="min-h-full">
        {children}
      </body>
    </html>
  );
}
