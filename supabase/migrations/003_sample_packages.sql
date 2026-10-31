-- OPTIONAL: three sample packages so you can see the layout.
-- Prices and hotels are placeholders — edit them in Table Editor or delete
-- these rows before going live:  delete from public.packages where slug like 'sample-%';

with p as (
  insert into public.packages (slug, title, category, tier, duration_days, teaser, sort_order) values
    ('sample-premium-umrah-14', 'Premium Umrah — 14 Days', 'Umrah', 'Premium', 14,
     'Five-star stays steps from the Haram, private transfers and guided ziyarat.', 1),
    ('sample-family-umrah-21', 'Family Umrah — 21 Days', 'Umrah', 'Family', 21,
     'Comfortable family rooms, a private Staria for your family and a relaxed pace.', 2),
    ('sample-ramadan-umrah-10', 'Last Ten Nights of Ramadan', 'Umrah', 'Premium', 10,
     'Spend the blessed last ten nights in Makkah with a hotel close to Masjid al-Haram.', 3)
  on conflict (slug) do nothing
  returning id, slug
)
insert into public.package_details (package_id, price_text, makkah_hotel, madinah_hotel, inclusions, itinerary)
select id,
  'PKR — (set the price in Table Editor)',
  'Sample Makkah hotel',
  'Sample Madinah hotel',
  array['Umrah visa', 'Return flights', 'Hotel accommodation', 'Private transfers', 'Guided ziyarat'],
  'Day 1: Arrival in Jeddah, transfer to Makkah. Remaining days split between Makkah and Madinah.'
from p;
