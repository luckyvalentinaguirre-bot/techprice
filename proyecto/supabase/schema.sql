-- Esquema para Supabase (Postgres). Pegalo en el "SQL Editor" de tu proyecto
-- y ejecutá. Es re-ejecutable.

create table if not exists tiendas (
  id         int primary key,
  nombre     text not null,
  plataforma text
);

create table if not exists productos (
  id        int primary key,
  nombre    text not null,
  marca     text,
  categoria text not null,
  imagen    text,
  specs     jsonb default '{}'::jsonb
);

create table if not exists precios (
  id         bigint generated always as identity primary key,
  producto   int references productos(id) on delete cascade,
  tienda     int references tiendas(id) on delete cascade,
  precio     numeric not null,
  moneda     text default 'UYU',
  disponible boolean default true,
  url        text,
  fecha      date not null
);

-- Si ya tenías la tabla creada de antes, agrega la columna sin borrar datos.
alter table precios add column if not exists url text;

-- La página es solo de lectura desde el navegador: activamos RLS y permitimos
-- únicamente SELECT con la clave pública "anon".
alter table tiendas   enable row level security;
alter table productos enable row level security;
alter table precios   enable row level security;

drop policy if exists "lectura publica tiendas"   on tiendas;
drop policy if exists "lectura publica productos" on productos;
drop policy if exists "lectura publica precios"   on precios;
create policy "lectura publica tiendas"   on tiendas   for select using (true);
create policy "lectura publica productos" on productos for select using (true);
create policy "lectura publica precios"   on precios   for select using (true);
