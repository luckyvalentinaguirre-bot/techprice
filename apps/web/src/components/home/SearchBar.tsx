"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Icon } from "./Icon";

/**
 * Hero search. Autocomplete is intentionally left as a seam for later — the
 * input is wired so a suggestions dropdown can drop in without markup churn.
 */
export function SearchBar({ placeholder }: { placeholder?: string }) {
  const router = useRouter();
  const [value, setValue] = useState("");

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const q = value.trim();
    router.push(q ? `/productos?search=${encodeURIComponent(q)}` : "/productos");
  }

  return (
    <form className="searchbar" role="search" onSubmit={submit}>
      <Icon name="search" size={22} className="searchbar__icon" />
      <input
        type="search"
        name="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder ?? "Buscá una RTX 5070, un i5-13400F, un SSD 2TB…"}
        aria-label="Buscar producto"
        autoComplete="off"
      />
      <button type="submit" className="searchbar__submit">
        <span className="searchbar__submit-label">Buscar</span>
        <Icon name="arrowRight" size={18} />
      </button>
    </form>
  );
}
