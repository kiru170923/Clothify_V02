-- Insert sample products for testing Style Quiz
-- Run this in Supabase SQL editor

INSERT INTO products (title, price, images, normalized, source_url, is_active) VALUES
('Áo Thun Nam Cotton Basic', 199000, '["https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400"]', '{"title": "Áo Thun Nam Cotton Basic", "description": "Áo thun nam chất liệu cotton thoáng mát, phù hợp mặc hàng ngày"}', 'https://example.com/ao-thun-basic', true),
('Áo Sơ Mi Nam Trắng', 299000, '["https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400"]', '{"title": "Áo Sơ Mi Nam Trắng", "description": "Áo sơ mi nam màu trắng trang trọng, phù hợp đi làm"}', 'https://example.com/ao-so-mi-trang', true),
('Áo Polo Nam Xanh Navy', 349000, '["https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=400"]', '{"title": "Áo Polo Nam Xanh Navy", "description": "Áo polo nam màu xanh navy thanh lịch"}', 'https://example.com/ao-polo-navy', true),
('Quần Jeans Nam Đen', 399000, '["https://images.unsplash.com/photo-1542272604-787c3835535d?w=400"]', '{"title": "Quần Jeans Nam Đen", "description": "Quần jeans nam màu đen phong cách"}', 'https://example.com/quan-jeans-den', true),
('Áo Khoác Nam Bomber', 599000, '["https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?w=400"]', '{"title": "Áo Khoác Nam Bomber", "description": "Áo khoác bomber nam phong cách"}', 'https://example.com/ao-khoac-bomber', true),
('Giày Sneaker Nam Trắng', 799000, '["https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400"]', '{"title": "Giày Sneaker Nam Trắng", "description": "Giày sneaker nam màu trắng thể thao"}', 'https://example.com/giay-sneaker-trang', true),
('Áo Thun Nam Đen', 179000, '["https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400"]', '{"title": "Áo Thun Nam Đen", "description": "Áo thun nam màu đen basic"}', 'https://example.com/ao-thun-den', true),
('Quần Short Nam Xám', 249000, '["https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400"]', '{"title": "Quần Short Nam Xám", "description": "Quần short nam màu xám thoải mái"}', 'https://example.com/quan-short-xam', true),
('Áo Vest Nam Xanh Navy', 1299000, '["https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400"]', '{"title": "Áo Vest Nam Xanh Navy", "description": "Áo vest nam màu xanh navy trang trọng"}', 'https://example.com/ao-vest-navy', true),
('Quần Tây Nam Đen', 449000, '["https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400"]', '{"title": "Quần Tây Nam Đen", "description": "Quần tây nam màu đen trang trọng"}', 'https://example.com/quan-tay-den', true),
('Áo Thun Nam Xanh', 189000, '["https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400"]', '{"title": "Áo Thun Nam Xanh", "description": "Áo thun nam màu xanh casual"}', 'https://example.com/ao-thun-xanh', true),
('Áo Polo Nam Trắng', 329000, '["https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=400"]', '{"title": "Áo Polo Nam Trắng", "description": "Áo polo nam màu trắng thanh lịch"}', 'https://example.com/ao-polo-trang', true)
ON CONFLICT DO NOTHING;
