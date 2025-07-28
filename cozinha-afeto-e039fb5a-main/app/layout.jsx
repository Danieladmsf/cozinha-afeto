import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Cozinha Afeto",
  description: "Sistema de gestão para cozinha",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body className={cn("min-h-screen bg-background font-sans antialiased", inter.className)}>
        <div className="main-app-container">
          {children}
        </div>
      </body>
    </html>
  );
}
