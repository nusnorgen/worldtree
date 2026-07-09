"use client";
import { AuthProvider } from "../lib/authContext";

/**
 * 客户端包装组件：在服务端布局中注入 AuthProvider，
 * 使 metadata/viewport 导出保持为服务端组件。
 */
export default function ClientWrapper({ children }) {
  return <AuthProvider>{children}</AuthProvider>;
}
