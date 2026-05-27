-- 012_create_franchise_content.sql
-- Franchise dynamic content management (Vision & Mission, Packages, Investment)

CREATE TABLE franchise_content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  section VARCHAR(50) NOT NULL UNIQUE,
  content JSONB NOT NULL DEFAULT '{}',
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_franchise_content_section ON franchise_content(section);

-- Seed with current hardcoded content from i18n files
INSERT INTO franchise_content (section, content) VALUES
('vision_mission', '{
  "mission": {
    "id": "Menjadi destinasi utama pilihan masyarakat Indonesia untuk menikmati pengalaman bersantap steak berkualitas premium dengan rasa yang lezat, harga yang ramah dan suasana tempat yang nyaman serta modern.",
    "en": "To become the primary destination for Indonesians to enjoy premium quality steak dining with delicious taste, friendly prices, and a comfortable modern atmosphere."
  },
  "visions": [
    {
      "id": "Menyajikan Steak berkualitas tinggi yang diolah dengan bahan baku pilihan serta dengan rasa berkelas dan harga terjangkau.",
      "en": "Serve high-quality steak prepared with premium ingredients, exceptional taste, and affordable prices."
    },
    {
      "id": "Menghadirkan kemudahan akses pada tempat steak kenangan, selalu hadir disekitaran tempat tinggal masyarakat.",
      "en": "Provide easy access to Steak Kenangan locations, always present around residential areas."
    },
    {
      "id": "Menciptakan suasana yang nyaman dan modern, dengan menyediakan tempat yang didesain secara yang estetik dan menarik.",
      "en": "Create a comfortable and modern atmosphere with aesthetically designed spaces."
    }
  ]
}'),
('packages', '{
  "packages": [
    {
      "slug": "starter",
      "name": {
        "id": "Paket Starter",
        "en": "Starter Package"
      },
      "description": {
        "id": "Ideal untuk memulai bisnis restoran steak pertama Anda dengan dukungan penuh dari tim kami.",
        "en": "Ideal for starting your first steak restaurant business with full support from our team."
      },
      "highlights": {
        "id": "10 menu unggulan, pelatihan staff, desain interior standar",
        "en": "10 signature menus, staff training, standard interior design"
      },
      "priceRange": {
        "id": "Rp 500 Juta - Rp 750 Juta",
        "en": "IDR 500M - IDR 750M"
      },
      "isFeatured": false,
      "sortOrder": 0,
      "isActive": true
    },
    {
      "slug": "premium",
      "name": {
        "id": "Paket Premium",
        "en": "Premium Package"
      },
      "description": {
        "id": "Pengalaman franchise lengkap dengan branding premium dan dukungan operasional menyeluruh.",
        "en": "Complete franchise experience with premium branding and comprehensive operational support."
      },
      "highlights": {
        "id": "20 menu lengkap, pelatihan intensif, desain interior premium, marketing support",
        "en": "20 complete menus, intensive training, premium interior design, marketing support"
      },
      "priceRange": {
        "id": "Rp 750 Juta - Rp 1.2 Miliar",
        "en": "IDR 750M - IDR 1.2B"
      },
      "isFeatured": true,
      "sortOrder": 1,
      "isActive": true
    },
    {
      "slug": "signature",
      "name": {
        "id": "Paket Signature",
        "en": "Signature Package"
      },
      "description": {
        "id": "Pengalaman eksklusif untuk mitra pilihan dengan hak istimewa dan dukungan penuh waktu.",
        "en": "Exclusive experience for selected partners with privileges and full-time support."
      },
      "highlights": {
        "id": "Full menu, chef dedicated, desain custom, marketing premium, priority support",
        "en": "Full menu, dedicated chef, custom design, premium marketing, priority support"
      },
      "priceRange": {
        "id": "Rp 1.2 Miliar - Rp 2 Miliar",
        "en": "IDR 1.2B - IDR 2B"
      },
      "isFeatured": false,
      "sortOrder": 2,
      "isActive": true
    }
  ]
}'),
('investment', '{
  "title": {
    "id": "Investasi & Keuntungan",
    "en": "Investment & Benefits"
  },
  "subtitle": {
    "id": "Lihat mengapa bergabung dengan Steak Kenangan adalah keputusan bisnis yang cerdas.",
    "en": "See why joining Steak Kenangan is a smart business decision."
  },
  "roiEstimate": {
    "id": "18-24 Bulan",
    "en": "18-24 Months"
  },
  "benefits": [
    {
      "id": "Brand recognition yang sudah terbukti",
      "en": "Proven brand recognition",
      "icon": "shield"
    },
    {
      "id": "Pelatihan operasional & manajemen",
      "en": "Operational & management training",
      "icon": "award"
    },
    {
      "id": "Sistem supply chain terintegrasi",
      "en": "Integrated supply chain system",
      "icon": "truck"
    },
    {
      "id": "Dukungan marketing & promosi",
      "en": "Marketing & promotion support",
      "icon": "megaphone"
    },
    {
      "id": "Sistem POS & teknologi modern",
      "en": "Modern POS system & technology",
      "icon": "trending-up"
    },
    {
      "id": "Tim support dedicated 24/7",
      "en": "Dedicated 24/7 support team",
      "icon": "headphones"
    }
  ]
}');
