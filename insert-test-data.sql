-- Insert test data for products
INSERT INTO products (
  source_site,
  source_url,
  raw_markdown,
  raw_html,
  metadata,
  normalized,
  price,
  search_vector
) VALUES 
(
  'twentyfive.vn',
  'https://twentyfive.vn/vay-di-tiec-1',
  '# Váy đi tiệc đẹp\n\n**Giá:** 450,000₫\n\n**Mô tả:** Váy đi tiệc sang trọng, phù hợp cho các dịp đặc biệt',
  '<h1>Váy đi tiệc đẹp</h1><p><strong>Giá:</strong> 450,000₫</p>',
  '{"title": "Váy đi tiệc đẹp", "description": "Váy đi tiệc sang trọng"}',
  '{"title": "Váy đi tiệc đẹp", "price": 450000, "description": "Váy đi tiệc sang trọng, phù hợp cho các dịp đặc biệt", "colors": ["đen", "đỏ"], "sizes": ["S", "M", "L"]}',
  450000,
  to_tsvector('vietnamese', 'Váy đi tiệc đẹp váy đi tiệc sang trọng phù hợp dịp đặc biệt')
),
(
  'twentyfive.vn',
  'https://twentyfive.vn/vay-di-tiec-2',
  '# Váy đi tiệc cao cấp\n\n**Giá:** 650,000₫\n\n**Mô tả:** Váy đi tiệc cao cấp, thiết kế tinh tế',
  '<h1>Váy đi tiệc cao cấp</h1><p><strong>Giá:</strong> 650,000₫</p>',
  '{"title": "Váy đi tiệc cao cấp", "description": "Váy đi tiệc cao cấp, thiết kế tinh tế"}',
  '{"title": "Váy đi tiệc cao cấp", "price": 650000, "description": "Váy đi tiệc cao cấp, thiết kế tinh tế", "colors": ["xanh", "hồng"], "sizes": ["M", "L", "XL"]}',
  650000,
  to_tsvector('vietnamese', 'Váy đi tiệc cao cấp thiết kế tinh tế')
),
(
  'twentyfive.vn',
  'https://twentyfive.vn/ao-khoac-len-1',
  '# Áo khoác len đẹp\n\n**Giá:** 350,000₫\n\n**Mô tả:** Áo khoác len ấm áp, phù hợp mùa đông',
  '<h1>Áo khoác len đẹp</h1><p><strong>Giá:</strong> 350,000₫</p>',
  '{"title": "Áo khoác len đẹp", "description": "Áo khoác len ấm áp, phù hợp mùa đông"}',
  '{"title": "Áo khoác len đẹp", "price": 350000, "description": "Áo khoác len ấm áp, phù hợp mùa đông", "colors": ["kem", "nâu"], "sizes": ["S", "M", "L"]}',
  350000,
  to_tsvector('vietnamese', 'Áo khoác len đẹp ấm áp phù hợp mùa đông')
);
