"use client";

import { useState } from "react";
import { Icon } from "./Icon";

/**
 * Price-alert toggle. Persisting alerts needs accounts/notifications that don't
 * exist yet, so this holds local state only — the visual + a11y contract is in
 * place for when the backend lands.
 */
export function AlertButton({ productName }: { productName: string }) {
  const [on, setOn] = useState(false);
  return (
    <button
      type="button"
      className="btn btn--icon"
      aria-pressed={on}
      aria-label={on ? `Alerta activada para ${productName}` : `Activar alerta para ${productName}`}
      title="Avisarme cuando baje de precio"
      onClick={() => setOn((v) => !v)}
      style={on ? { color: "var(--brand)", borderColor: "var(--brand)" } : undefined}
    >
      <Icon name="bell" size={16} />
    </button>
  );
}
