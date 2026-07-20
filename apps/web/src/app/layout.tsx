import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "TechPrice Uruguay",
  description: "Comparador de precios de componentes y tecnologia entre tiendas de Uruguay",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-UY">
      <body>
        <header className="site-header">
          <Link href="/" className="site-header__brand">
            TechPrice <span>Uruguay</span>
          </Link>
          <nav>
            <Link href="/productos">Productos</Link>
          </nav>
        </header>
        <main>{children}</main>
        <footer className="site-footer">
          <p>TechPrice Uruguay compara componentes y productos individuales de tecnologia entre tiendas de Uruguay.</p>
        </footer>
      </body>
    </html>
  );
}
