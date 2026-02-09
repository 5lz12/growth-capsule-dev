import type { Metadata } from "next";
import { BottomTabBar } from "@/components/BottomTabBar";
import DevUidSwitcher from "@/components/DevUidSwitcher";
import "./globals.css";

export const metadata: Metadata = {
  title: "成长时间胶囊",
  description: "记录孩子的成长行为，基于发展心理学提供分析",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased min-h-screen bg-gradient-to-br from-orange-50 via-amber-50/30 to-white">
        <DevUidSwitcher />
        <div className="pb-16">
          {children}
        </div>
        <BottomTabBar />
      </body>
    </html>
  );
}
