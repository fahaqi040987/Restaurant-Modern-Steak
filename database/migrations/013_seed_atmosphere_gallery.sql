-- 013_seed_atmosphere_gallery.sql
-- Seed atmosphere gallery section for franchise outlet photos

INSERT INTO franchise_content (section, content) VALUES
('atmosphere', '{
  "items": [
    {
      "id": "outlet-day",
      "image": "",
      "caption": {
        "id": "Foto Outlet Siang",
        "en": "Daytime Outlet Photo"
      },
      "sortOrder": 0
    },
    {
      "id": "indoor",
      "image": "",
      "caption": {
        "id": "Foto Area Indoor",
        "en": "Indoor Area Photo"
      },
      "sortOrder": 1
    },
    {
      "id": "outlet-night",
      "image": "",
      "caption": {
        "id": "Foto Outlet Malam",
        "en": "Nighttime Outlet Photo"
      },
      "sortOrder": 2
    },
    {
      "id": "outdoor",
      "image": "",
      "caption": {
        "id": "Foto Area Outdoor",
        "en": "Outdoor Area Photo"
      },
      "sortOrder": 3
    }
  ]
}') ON CONFLICT (section) DO NOTHING;
