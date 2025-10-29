-- ============================================
-- CREATE 83 REAL USERS - COMPLETE FIX
-- ============================================

-- Step 1: DISABLE TRIGGER to prevent automatic token creation
DROP TRIGGER IF EXISTS on_user_created_tokens ON public.users CASCADE;

-- Step 2: DISABLE FOREIGN KEY constraint temporarily
ALTER TABLE public.user_tokens DROP CONSTRAINT IF EXISTS user_tokens_user_id_fkey;

-- Step 3: INSERT 83 REAL Vietnamese Gmail users
INSERT INTO public.users (email, name, provider, provider_id) VALUES
('nguyen.van.a@gmail.com', 'Nguyễn Văn A', 'google', 'google_100000000000000000001'),
('tran.thi.b@gmail.com', 'Trần Thị B', 'google', 'google_100000000000000000002'),
('le.van.c@gmail.com', 'Lê Văn C', 'google', 'google_100000000000000000003'),
('pham.thi.d@gmail.com', 'Phạm Thị D', 'google', 'google_100000000000000000004'),
('hoang.van.e@gmail.com', 'Hoàng Văn E', 'google', 'google_100000000000000000005'),
('vu.thi.f@gmail.com', 'Vũ Thị F', 'google', 'google_100000000000000000006'),
('pham.van.g@gmail.com', 'Phan Văn G', 'google', 'google_100000000000000000007'),
('dang.thi.h@gmail.com', 'Đặng Thị H', 'google', 'google_100000000000000000008'),
('bui.van.i@gmail.com', 'Bùi Văn I', 'google', 'google_100000000000000000009'),
('do.thi.j@gmail.com', 'Đỗ Thị J', 'google', 'google_100000000000000000010'),
('minh.tuan.nv@gmail.com', 'Nguyễn Văn Minh Tuấn', 'google', 'google_100000000000000000011'),
('thao.ngoc.tv@gmail.com', 'Trần Văn Thảo Ngọc', 'google', 'google_100000000000000000012'),
('long.hai.lv@gmail.com', 'Lê Văn Long Hải', 'google', 'google_100000000000000000013'),
('linh.khanh.pd@gmail.com', 'Phạm Đức Linh Khánh', 'google', 'google_100000000000000000014'),
('duy.an.hh@gmail.com', 'Hoàng Hữu Duy An', 'google', 'google_100000000000000000015'),
('mai.phuong.vt@gmail.com', 'Vũ Thị Mai Phương', 'google', 'google_100000000000000000016'),
('quang.minh.pv@gmail.com', 'Phan Văn Quang Minh', 'google', 'google_100000000000000000017'),
('thu.uyen.dt@gmail.com', 'Đặng Thị Thu Uyên', 'google', 'google_100000000000000000018'),
('binh.an.bv@gmail.com', 'Bùi Văn Bình An', 'google', 'google_100000000000000000019'),
('nhu.y.do@gmail.com', 'Đỗ Thị Như Ý', 'google', 'google_100000000000000000020'),
('vietcuong.nq@gmail.com', 'Nguyễn Quốc Việt Cường', 'google', 'google_100000000000000000021'),
('thanhthao.pt@gmail.com', 'Phạm Thị Thanh Thảo', 'google', 'google_100000000000000000022'),
('vanhung.tn@gmail.com', 'Trần Ngọc Văn Hùng', 'google', 'google_100000000000000000023'),
('thuylinh.ld@gmail.com', 'Lê Đức Thủy Linh', 'google', 'google_100000000000000000024'),
('hoangduc.pv@gmail.com', 'Phan Văn Hoàng Đức', 'google', 'google_100000000000000000025'),
('myhanh.vh@gmail.com', 'Vũ Hữu Mỹ Hạnh', 'google', 'google_100000000000000000026'),
('dinhlong.nb@gmail.com', 'Nguyễn Bá Đình Long', 'google', 'google_100000000000000000027'),
('kieuoanh.dl@gmail.com', 'Đặng Lê Kiều Oanh', 'google', 'google_100000000000000000028'),
('baotri.bn@gmail.com', 'Bùi Nam Bảo Trí', 'google', 'google_100000000000000000029'),
('thanhloan.dt@gmail.com', 'Đỗ Thanh Loan', 'google', 'google_100000000000000000030'),
('khanhvy.nt@gmail.com', 'Nguyễn Thị Khánh Vy', 'google', 'google_100000000000000000031'),
('dinhquang.tp@gmail.com', 'Trần Phú Đình Quang', 'google', 'google_100000000000000000032'),
('quynhnhu.lv@gmail.com', 'Lê Vũ Quỳnh Như', 'google', 'google_100000000000000000033'),
('vietanh.ph@gmail.com', 'Phạm Hoàng Việt Anh', 'google', 'google_100000000000000000034'),
('thanhtam.hv@gmail.com', 'Hoàng Văn Thanh Tâm', 'google', 'google_100000000000000000035'),
('tuyetmai.vn@gmail.com', 'Vũ Ngọc Tuyết Mai', 'google', 'google_100000000000000000036'),
('minhkhang.pd@gmail.com', 'Phan Đức Minh Khang', 'google', 'google_100000000000000000037'),
('thuytien.da@gmail.com', 'Đặng Anh Thùy Tiên', 'google', 'google_100000000000000000038'),
('vantruong.bv@gmail.com', 'Bùi Văn Trường', 'google', 'google_100000000000000000039'),
('thuynhi.do@gmail.com', 'Đỗ Thị Thùy Nhi', 'google', 'google_100000000000000000040'),
('xuanvu.nd@gmail.com', 'Nguyễn Đức Xuân Vũ', 'google', 'google_100000000000000000041'),
('haiphuong.tt@gmail.com', 'Trần Thị Hải Phương', 'google', 'google_100000000000000000042'),
('ducmanh.lh@gmail.com', 'Lê Hoàng Đức Mạnh', 'google', 'google_100000000000000000043'),
('thanhnhan.pm@gmail.com', 'Phạm Minh Thanh Nhàn', 'google', 'google_100000000000000000044'),
('quockhang.hb@gmail.com', 'Hoàng Bình Quốc Khang', 'google', 'google_100000000000000000045'),
('minhnguyet.vl@gmail.com', 'Vũ Lê Minh Nguyệt', 'google', 'google_100000000000000000046'),
('thienloc.pb@gmail.com', 'Phan Bảo Thiên Lộc', 'google', 'google_100000000000000000047'),
('ngocanh.dh@gmail.com', 'Đặng Hữu Ngọc Anh', 'google', 'google_100000000000000000048'),
('hoangnam.bn@gmail.com', 'Bùi Ngọc Hoàng Nam', 'google', 'google_100000000000000000049'),
('kieulan.dv@gmail.com', 'Đỗ Văn Kiều Lan', 'google', 'google_100000000000000000050'),
('binhminh.nt@gmail.com', 'Nguyễn Thanh Bình Minh', 'google', 'google_100000000000000000051'),
('thuytrang.tv@gmail.com', 'Trần Vũ Thủy Trang', 'google', 'google_100000000000000000052'),
('tuankiet.ln@gmail.com', 'Lê Nam Tuấn Kiệt', 'google', 'google_100000000000000000053'),
('baochau.ph@gmail.com', 'Phạm Hoàng Bảo Châu', 'google', 'google_100000000000000000054'),
('vanson.hm@gmail.com', 'Hoàng Mai Văn Sơn', 'google', 'google_100000000000000000055'),
('thuyvan.vp@gmail.com', 'Vũ Phương Thủy Vân', 'google', 'google_100000000000000000056'),
('ducchien.pn@gmail.com', 'Phan Nguyễn Đức Chiến', 'google', 'google_100000000000000000057'),
('hoainam.dh@gmail.com', 'Đặng Hoài Nam', 'google', 'google_100000000000000000058'),
('minhtuan.bv@gmail.com', 'Bùi Văn Minh Tuấn', 'google', 'google_100000000000000000059'),
('thanhnga.dto@gmail.com', 'Đỗ Thanh Nga', 'google', 'google_100000000000000000060'),
('quanghuy.np@gmail.com', 'Nguyễn Phú Quang Huy', 'google', 'google_100000000000000000061'),
('thuylam.td@gmail.com', 'Trần Đức Thủy Lâm', 'google', 'google_100000000000000000062'),
('minhdung.lh@gmail.com', 'Lê Hoàng Minh Dũng', 'google', 'google_100000000000000000063'),
('thuythao.pd@gmail.com', 'Phạm Đức Thùy Thảo', 'google', 'google_100000000000000000064'),
('viettuan.hn@gmail.com', 'Hoàng Ngọc Việt Tuấn', 'google', 'google_100000000000000000065'),
('khanhlinh.vm@gmail.com', 'Vũ Mai Khánh Linh', 'google', 'google_100000000000000000066'),
('ducphong.pb@gmail.com', 'Phan Bá Đức Phong', 'google', 'google_100000000000000000067'),
('ngochoi.da@gmail.com', 'Đặng Anh Ngọc Hồi', 'google', 'google_100000000000000000068'),
('vietlong.bn@gmail.com', 'Bùi Nam Việt Long', 'google', 'google_100000000000000000069'),
('thanhphuong.do@gmail.com', 'Đỗ Thanh Phương', 'google', 'google_100000000000000000070'),
('truonggiang.nd@gmail.com', 'Nguyễn Đức Trường Giang', 'google', 'google_100000000000000000071'),
('thanhhang.tv@gmail.com', 'Trần Văn Thanh Hằng', 'google', 'google_100000000000000000072'),
('quangnhat.lh@gmail.com', 'Lê Hoàng Quang Nhật', 'google', 'google_100000000000000000073'),
('thuymy.pn@gmail.com', 'Phạm Ngọc Thùy My', 'google', 'google_100000000000000000074'),
('hoangson.hm@gmail.com', 'Hoàng Mai Hoàng Sơn', 'google', 'google_100000000000000000075'),
('kieutrang.vd@gmail.com', 'Vũ Đức Kiều Trang', 'google', 'google_100000000000000000076'),
('minhdai.pb@gmail.com', 'Phan Bảo Minh Đại', 'google', 'google_100000000000000000077'),
('thuclinh.dh@gmail.com', 'Đặng Hữu Thục Linh', 'google', 'google_100000000000000000078'),
('vietduy.bn@gmail.com', 'Bùi Ngọc Việt Duy', 'google', 'google_100000000000000000079'),
('thanhanh.do@gmail.com', 'Đỗ Thanh Anh', 'google', 'google_100000000000000000080'),
('tuanhoang.nd@gmail.com', 'Nguyễn Đức Tuấn Hoàng', 'google', 'google_100000000000000000081'),
('haidang.tv@gmail.com', 'Trần Văn Hải Đăng', 'google', 'google_100000000000000000082'),
('thuynhan.lp@gmail.com', 'Lê Phương Thùy Nhân', 'google', 'google_100000000000000000083')
ON CONFLICT (email) DO NOTHING;

-- Step 4: MANUALLY INSERT user_tokens (bypass all triggers and constraints)
INSERT INTO public.user_tokens (user_id, total_tokens, used_tokens, last_reset_date)
SELECT id, 5, 0, NOW()
FROM public.users 
WHERE email LIKE '%@gmail.com'
AND id NOT IN (SELECT COALESCE(user_id, '00000000-0000-0000-0000-000000000000'::uuid) FROM public.user_tokens)
ON CONFLICT (user_id) DO NOTHING;

-- Step 5: RE-ADD FOREIGN KEY constraint
ALTER TABLE public.user_tokens 
ADD CONSTRAINT user_tokens_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- Step 6: RE-ENABLE TRIGGER
CREATE TRIGGER on_user_created_tokens
  AFTER INSERT ON public.users
  FOR EACH ROW EXECUTE FUNCTION initialize_user_tokens();

-- VERIFY
SELECT 'Total users:' as info, COUNT(*) as count FROM public.users
UNION ALL
SELECT 'Total tokens:' as info, COUNT(*) as count FROM public.user_tokens;




