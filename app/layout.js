import "./globals.css";
import { Analytics } from "@vercel/analytics/next";

export const metadata = {
  title: "世界树 · 人类智慧晶体库",
  description: "一棵可漫游的智慧之树。建言沉淀为晶体，AI 负责寻路与提纯。",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN">
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
