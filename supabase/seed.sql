-- Seed ilustrativo para MesaQR.
-- En este repo no está versionado `supabase/config.toml`, así que el comando apropiado
-- para aplicarlo sobre una base existente es:
--   psql "$DATABASE_URL" -f supabase/seed.sql
-- Si más adelante inicializan Supabase local con CLI, también pueden usar `npx supabase db reset`.

begin;

with seed_categories (name, preparation_area, sort_order) as (
  values
    ('Entradas', 'cocina'::public.preparation_area, 1),
    ('Platos principales', 'cocina'::public.preparation_area, 2),
    ('Postres', 'cocina'::public.preparation_area, 3),
    ('Bebidas sin alcohol', 'barra'::public.preparation_area, 4),
    ('Cervezas', 'barra'::public.preparation_area, 5),
    ('Cócteles', 'barra'::public.preparation_area, 6)
)
insert into public.menu_categories (name, preparation_area, sort_order, active)
select
  seed_categories.name,
  seed_categories.preparation_area,
  seed_categories.sort_order,
  true
from seed_categories
where not exists (
  select 1
  from public.menu_categories existing
  where existing.name = seed_categories.name
);

with seed_menu_items (
  category_name,
  name,
  description,
  price,
  sort_order
) as (
  values
    ('Entradas', 'Croquetas de jamón y queso', 'Doradas, cremosas y recién hechas.', 9800.00, 1),
    ('Entradas', 'Provoleta al hierro', 'Con orégano, tomates confitados y oliva.', 11200.00, 2),
    ('Entradas', 'Rabas crocantes', 'Con alioli cítrico y gajos de limón.', 14800.00, 3),
    ('Platos principales', 'Milanesa de bife con papas rústicas', 'Con limón fresco y mayo casera.', 18900.00, 1),
    ('Platos principales', 'Bondiola braseada con puré', 'Cocción lenta con salsa de cerveza negra.', 21400.00, 2),
    ('Platos principales', 'Sorrentinos de jamón y mozzarella', 'Con salsa mixta y parmesano.', 17600.00, 3),
    ('Postres', 'Flan casero mixto', 'Con dulce de leche y crema batida.', 7200.00, 1),
    ('Postres', 'Brownie tibio con helado', 'Chocolate intenso con bocha de americana.', 7900.00, 2),
    ('Postres', 'Cheesecake de frutos rojos', 'Base crocante y coulis artesanal.', 8400.00, 3),
    ('Bebidas sin alcohol', 'Agua mineral con gas', 'Botella individual bien fría.', 3200.00, 1),
    ('Bebidas sin alcohol', 'Limonada de la casa', 'Con menta fresca y jengibre.', 5400.00, 2),
    ('Bebidas sin alcohol', 'Pomelada rosada', 'Refrescante, levemente amarga.', 5600.00, 3),
    ('Cervezas', 'Pinta rubia suave', 'Liviana y refrescante.', 5900.00, 1),
    ('Cervezas', 'IPA lupulada', 'Aromática, con amargor marcado.', 6400.00, 2),
    ('Cervezas', 'Scottish roja', 'Maltosa, equilibrada y cremosa.', 6300.00, 3),
    ('Cócteles', 'Aperitivo naranja spritz', 'Burbujeante, cítrico y fresco.', 9800.00, 1),
    ('Cócteles', 'Gin tonic de pepino', 'Con tónica premium y botánicos.', 10400.00, 2),
    ('Cócteles', 'Vermú con soda y pomelo', 'Estilo porteño, ideal para arrancar.', 8600.00, 3)
)
insert into public.menu_items (
  category_id,
  name,
  description,
  price,
  image_url,
  available,
  sort_order
)
select
  categories.id,
  seed_menu_items.name,
  seed_menu_items.description,
  seed_menu_items.price,
  null,
  true,
  seed_menu_items.sort_order
from seed_menu_items
join public.menu_categories categories
  on categories.name = seed_menu_items.category_name
where not exists (
  select 1
  from public.menu_items existing
  where existing.category_id = categories.id
    and existing.name = seed_menu_items.name
);

insert into public.tables (number, name, capacity, status)
values
  (1, 'Mesa 1', 2, 'available'),
  (2, 'Mesa 2', 2, 'available'),
  (3, 'Mesa 3', 4, 'available'),
  (4, 'Mesa 4', 4, 'available'),
  (5, 'Mesa 5', 6, 'available'),
  (6, 'Mesa 6', 4, 'available'),
  (7, 'Mesa 7', 2, 'available'),
  (8, 'Mesa 8', 6, 'available')
on conflict (number) do nothing;

commit;
