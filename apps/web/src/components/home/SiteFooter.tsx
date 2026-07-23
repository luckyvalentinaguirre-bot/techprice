import Link from "next/link";
import { Icon } from "./Icon";

const COLUMNS = [
  {
    heading: "Producto",
    links: [
      { label: "Productos", href: "/productos" },
      { label: "Productos que bajaron", href: "/productos" },
      { label: "Tendencias", href: "/productos" },
    ],
  },
  {
    heading: "Categorías",
    links: [
      { label: "Tarjetas gráficas", href: "/productos?category=gpu" },
      { label: "Procesadores", href: "/productos?category=cpu" },
      { label: "Monitores", href: "/productos?category=monitor" },
      { label: "Notebooks", href: "/productos?category=notebook" },
    ],
  },
  {
    heading: "Plataforma",
    links: [
      { label: "Tiendas", href: "/productos" },
      { label: "Contacto", href: "mailto:hola@techprice.uy" },
      { label: "Política de privacidad", href: "#" },
      { label: "Términos", href: "#" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="site-footer__inner">
          <div className="site-footer__brandcol">
            <span className="brand">
              <span className="brand__mark">
                <Icon name="chart" size={18} />
              </span>
              TechPrice <span>Uruguay</span>
            </span>
            <p>
              Herramienta para analizar y comparar precios de tecnología entre tiendas de Uruguay.
              Comparamos componentes y productos individuales, no PCs armadas.
            </p>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.heading} className="footer-col">
              <h4>{col.heading}</h4>
              <ul>
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href}>{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="site-footer__bar">
          <span>© {new Date().getFullYear()} TechPrice Uruguay</span>
          <div className="site-footer__social">
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" aria-label="GitHub">
              <Icon name="github" size={17} />
            </a>
            <a href="https://x.com" target="_blank" rel="noopener noreferrer" aria-label="X">
              <Icon name="x" size={17} />
            </a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
              <Icon name="instagram" size={17} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
