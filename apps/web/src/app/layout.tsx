import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import { Icon } from "@/components/home/Icon";
import { SiteFooter } from "@/components/home/SiteFooter";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

export const metadata: Metadata = {
  title: "TechPrice Uruguay — Compará precios de tecnología",
  description:
    "Herramienta para comparar precios de componentes y tecnología entre tiendas de Uruguay y seguir la evolución del valor de cada producto.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-UY" className={inter.variable}>
      <body>
        <header className="site-header">
          <div className="container site-header__inner">
            <Link href="/" className="brand">
              <span className="brand__mark">
                <Icon name="chart" size={18} />
              </span>
              TechPrice <span>Uruguay</span>
            </Link>
            <nav className="site-nav">
              <Link href="/productos">Productos</Link>
              <Link href="/productos" className="site-nav__cta">
                Explorar
              </Link>
            </nav>
          </div>
        </header>

        <main>
          <div className="container">{children}</div>
        </main>

        <SiteFooter />
      </body>
    </html>
  );
}
