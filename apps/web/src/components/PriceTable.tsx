import type { StoreOffer } from "@techprice/shared";
import { formatDate, formatPrice } from "@/lib/format";

export function PriceTable({ offers, cheapestStoreId }: { offers: StoreOffer[]; cheapestStoreId: string }) {
  return (
    <table className="price-table">
      <thead>
        <tr>
          <th>Tienda</th>
          <th>Precio</th>
          <th>Disponibilidad</th>
          <th>Actualizado</th>
          <th />
        </tr>
      </thead>
      <tbody>
        {offers.map((offer) => (
          <tr key={offer.storeId} className={offer.storeId === cheapestStoreId ? "price-table__row--best" : ""}>
            <td>{offer.storeName}</td>
            <td>{formatPrice(offer.price, offer.currency)}</td>
            <td>{offer.available ? "En stock" : "Sin stock"}</td>
            <td>{formatDate(offer.lastUpdated)}</td>
            <td>
              <a href={offer.url} target="_blank" rel="noopener noreferrer">
                Ver en tienda
              </a>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
