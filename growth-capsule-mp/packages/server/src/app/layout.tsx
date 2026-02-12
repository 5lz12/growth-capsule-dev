import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "成长时间胶囊 - API Server",
  description: "成长时间胶囊后端 API 服务",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
