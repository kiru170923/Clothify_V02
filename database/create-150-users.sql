-- ============================================
-- CREATE 150 NEW USERS - COMPLETE SQL SCRIPT
-- ============================================
-- This script creates 150 users in auth.users and syncs to all related tables
-- Run this in Supabase SQL Editor
-- ============================================

-- Step 1: Temporarily disable triggers that might interfere
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE;
DROP TRIGGER IF EXISTS on_user_created_tokens ON public.users CASCADE;

-- Step 2: Create function to insert users manually
CREATE OR REPLACE FUNCTION create_fake_user(
  p_email TEXT,
  p_name TEXT,
  p_provider_id TEXT,
  p_user_id UUID DEFAULT gen_random_uuid()
)
RETURNS UUID AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Check if user with this email already exists
  SELECT id INTO v_user_id FROM auth.users WHERE email = p_email;
  
  -- If user doesn't exist, create new one
  IF v_user_id IS NULL THEN
    -- Insert into auth.users (using SECURITY DEFINER to bypass RLS)
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      recovery_token,
      email_change_token_new,
      email_change,
      aud,
      role
    ) VALUES (
      p_user_id,
      '00000000-0000-0000-0000-000000000000',
      p_email,
      crypt('TempPassword123!', gen_salt('bf')),
      NOW(),
      jsonb_build_object('name', p_name, 'full_name', p_name),
      NOW(),
      NOW(),
      '',
      '',
      '',
      '',
      'authenticated',
      'authenticated'
    )
    ON CONFLICT (id) DO NOTHING
    RETURNING id INTO v_user_id;

    -- If still NULL (conflict on id), get by email
    IF v_user_id IS NULL THEN
      SELECT id INTO v_user_id FROM auth.users WHERE email = p_email;
    END IF;
  END IF;

  -- Insert into public.users
  INSERT INTO public.users (
    id,
    email,
    name,
    provider,
    provider_id,
    created_at,
    updated_at
  ) VALUES (
    v_user_id,
    p_email,
    p_name,
    'google',
    p_provider_id,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    updated_at = NOW();

  -- Insert into user_profiles
  INSERT INTO public.user_profiles (
    user_id,
    gender,
    age_group,
    height_cm,
    weight_kg,
    size,
    style_preferences,
    favorite_colors,
    created_at,
    updated_at
  ) VALUES (
    v_user_id,
    CASE WHEN random() > 0.5 THEN 'male' ELSE 'female' END,
    (ARRAY['18-25', '26-35', '36-45', '46+'])[floor(random() * 4 + 1)],
    floor(random() * 40 + 150),
    floor(random() * 40 + 50),
    (ARRAY['S', 'M', 'L', 'XL'])[floor(random() * 4 + 1)],
    ARRAY['casual', 'formal', 'sporty'],
    ARRAY['blue', 'black', 'white'],
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id) DO NOTHING;

  -- Insert into user_tokens
  INSERT INTO public.user_tokens (
    user_id,
    total_tokens,
    used_tokens,
    last_reset_date,
    created_at,
    updated_at
  ) VALUES (
    v_user_id,
    3,
    0,
    NOW(),
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id) DO NOTHING;

  RETURN v_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Create all 150 users
SELECT create_fake_user('kieudang2015@gmail.com', 'Kiều Đăng Đoàn', 'google_150001');
SELECT create_fake_user('chubengoknek1@gmail.com', 'Chu Bền Gok Nek', 'google_150002');
SELECT create_fake_user('tranhalinh1029@gmail.com', 'Trần Hà Linh', 'google_150003');
SELECT create_fake_user('djqiqjiw@gmail.com', 'Đỗ Quang Huy', 'google_150004');
SELECT create_fake_user('ngocbich87@gmail.com', 'Ngọc Bích', 'google_150005');
SELECT create_fake_user('phamvandong204@gmail.com', 'Phạm Văn Đông', 'google_150006');
SELECT create_fake_user('huynhthiba69@gmail.com', 'Huỳnh Thị Ba', 'google_150007');
SELECT create_fake_user('lequanghuy1995@gmail.com', 'Lê Quang Huy', 'google_150008');
SELECT create_fake_user('tranminhkhai07@gmail.com', 'Trần Minh Khải', 'google_150009');
SELECT create_fake_user('vuongthilinh420@gmail.com', 'Vương Thị Linh', 'google_150010');
SELECT create_fake_user('danghoangnam666@gmail.com', 'Đặng Hoàng Nam', 'google_150011');
SELECT create_fake_user('buithanhha88@gmail.com', 'Bùi Thanh Hà', 'google_150012');
SELECT create_fake_user('hoangngocdiep13@gmail.com', 'Hoàng Ngọc Diệp', 'google_150013');
SELECT create_fake_user('nguyenphuonganh911@gmail.com', 'Nguyễn Phương Anh', 'google_150014');
SELECT create_fake_user('trinhvanduc007@gmail.com', 'Trịnh Văn Đức', 'google_150015');
SELECT create_fake_user('lythikimlien69@gmail.com', 'Lý Thị Kim Liên', 'google_150016');
SELECT create_fake_user('phungxuanmai404@gmail.com', 'Phùng Xuân Mai', 'google_150017');
SELECT create_fake_user('doanquangvinh23@gmail.com', 'Đoàn Quang Vinh', 'google_150018');
SELECT create_fake_user('taothuytrang101@gmail.com', 'Tào Thủy Trang', 'google_150019');
SELECT create_fake_user('vuhoanganhkiet55@gmail.com', 'Vũ Hoàng Anh Kiệt', 'google_150020');
SELECT create_fake_user('qpjfowpq@gmail.com', 'Quang Phạm', 'google_150021');
SELECT create_fake_user('xkdieowp@gmail.com', 'Xuân Kiều', 'google_150022');
SELECT create_fake_user('mnbvcxza1@gmail.com', 'Minh Nguyễn', 'google_150023');
SELECT create_fake_user('poiuytrewq9@gmail.com', 'Phương Oanh', 'google_150024');
SELECT create_fake_user('asdfghjkl77@gmail.com', 'Anh Sơn', 'google_150025');
SELECT create_fake_user('zxcvbnm123@gmail.com', 'Xuân Cường', 'google_150026');
SELECT create_fake_user('qwertyuiop666@gmail.com', 'Quỳnh Vân', 'google_150027');
SELECT create_fake_user('lkjihgfedc0@gmail.com', 'Linh Kiều', 'google_150028');
SELECT create_fake_user('plmoknijb666@gmail.com', 'Phương Linh', 'google_150029');
SELECT create_fake_user('hgfdsapoiu420@gmail.com', 'Hương Giang', 'google_150030');
SELECT create_fake_user('tranthithuy99@gmail.com', 'Trần Thị Thủy', 'google_150031');
SELECT create_fake_user('nguyenhoanglong88@gmail.com', 'Nguyễn Hoàng Long', 'google_150032');
SELECT create_fake_user('phamthikimngan07@gmail.com', 'Phạm Thị Kim Ngân', 'google_150033');
SELECT create_fake_user('levananhkhoi69@gmail.com', 'Lê Văn Anh Khôi', 'google_150034');
SELECT create_fake_user('hoangthibaohan404@gmail.com', 'Hoàng Thị Bảo Hân', 'google_150035');
SELECT create_fake_user('dangquanghuy911@gmail.com', 'Đặng Quang Huy', 'google_150036');
SELECT create_fake_user('vuthithuyduong23@gmail.com', 'Vũ Thị Thủy Dương', 'google_150037');
SELECT create_fake_user('buivandung101@gmail.com', 'Bùi Văn Dũng', 'google_150038');
SELECT create_fake_user('trinhhoangmai55@gmail.com', 'Trịnh Hoàng Mai', 'google_150039');
SELECT create_fake_user('lyvanphuc666@gmail.com', 'Lý Văn Phúc', 'google_150040');
SELECT create_fake_user('phungthilan13@gmail.com', 'Phùng Thị Lan', 'google_150041');
SELECT create_fake_user('dohoanganh420@gmail.com', 'Đỗ Hoàng Anh', 'google_150042');
SELECT create_fake_user('taquangvinh69@gmail.com', 'Tạ Quang Vinh', 'google_150043');
SELECT create_fake_user('vuthikimlien88@gmail.com', 'Vũ Thị Kim Liên', 'google_150044');
SELECT create_fake_user('nguyenxuanmai07@gmail.com', 'Nguyễn Xuân Mai', 'google_150045');
SELECT create_fake_user('tranthanhha404@gmail.com', 'Trần Thanh Hà', 'google_150046');
SELECT create_fake_user('phamvanduc911@gmail.com', 'Phạm Văn Đức', 'google_150047');
SELECT create_fake_user('lehoangkiet23@gmail.com', 'Lê Hoàng Kiệt', 'google_150048');
SELECT create_fake_user('huynhthilinh101@gmail.com', 'Huỳnh Thị Linh', 'google_150049');
SELECT create_fake_user('dangngocdiep55@gmail.com', 'Đặng Ngọc Diệp', 'google_150050');
SELECT create_fake_user('kjhgfdsq@gmail.com', 'Khánh Giang', 'google_150051');
SELECT create_fake_user('poiuytrx@gmail.com', 'Phương Oanh', 'google_150052');
SELECT create_fake_user('mnbvcxzl@gmail.com', 'Minh Ngọc', 'google_150053');
SELECT create_fake_user('asdfghjkp@gmail.com', 'Anh Sơn', 'google_150054');
SELECT create_fake_user('qwertyuio9@gmail.com', 'Quỳnh Vân', 'google_150055');
SELECT create_fake_user('zxcvbnmk1@gmail.com', 'Xuân Cường', 'google_150056');
SELECT create_fake_user('plmoknijb8@gmail.com', 'Phương Linh', 'google_150057');
SELECT create_fake_user('hgfdsapoi7@gmail.com', 'Hương Giang', 'google_150058');
SELECT create_fake_user('lkjihgfed6@gmail.com', 'Linh Kiều', 'google_150059');
SELECT create_fake_user('ujvfdksl@gmail.com', 'Uyên Vân', 'google_150060');
SELECT create_fake_user('buithanhha2025@gmail.com', 'Bùi Thanh Hà', 'google_150061');
SELECT create_fake_user('hoangngocdiep1987@gmail.com', 'Hoàng Ngọc Diệp', 'google_150062');
SELECT create_fake_user('nguyenphuonganh666@gmail.com', 'Nguyễn Phương Anh', 'google_150063');
SELECT create_fake_user('trinhvanduc420@gmail.com', 'Trịnh Văn Đức', 'google_150064');
SELECT create_fake_user('lythikimlien911@gmail.com', 'Lý Thị Kim Liên', 'google_150065');
SELECT create_fake_user('phungxuanmai69@gmail.com', 'Phùng Xuân Mai', 'google_150066');
SELECT create_fake_user('doanquangvinh88@gmail.com', 'Đoàn Quang Vinh', 'google_150067');
SELECT create_fake_user('taothuytrang07@gmail.com', 'Tào Thủy Trang', 'google_150068');
SELECT create_fake_user('vuhoanganhkiet404@gmail.com', 'Vũ Hoàng Anh Kiệt', 'google_150069');
SELECT create_fake_user('danghoangnam23@gmail.com', 'Đặng Hoàng Nam', 'google_150070');
SELECT create_fake_user('tranminhkhai101@gmail.com', 'Trần Minh Khải', 'google_150071');
SELECT create_fake_user('phamvandong55@gmail.com', 'Phạm Văn Đông', 'google_150072');
SELECT create_fake_user('huynhthiba666@gmail.com', 'Huỳnh Thị Ba', 'google_150073');
SELECT create_fake_user('lequanghuy13@gmail.com', 'Lê Quang Huy', 'google_150074');
SELECT create_fake_user('fdsapoiuq@gmail.com', 'Phương Oanh', 'google_150075');
SELECT create_fake_user('xkdieowpql@gmail.com', 'Xuân Kiều', 'google_150076');
SELECT create_fake_user('poiuytrew1@gmail.com', 'Phương Oanh', 'google_150077');
SELECT create_fake_user('asdfghjkl9@gmail.com', 'Anh Sơn', 'google_150078');
SELECT create_fake_user('zxcvbnm12@gmail.com', 'Xuân Cường', 'google_150079');
SELECT create_fake_user('qwertyuio7@gmail.com', 'Quỳnh Vân', 'google_150080');
SELECT create_fake_user('lkjihgfed5@gmail.com', 'Linh Kiều', 'google_150081');
SELECT create_fake_user('plmoknij4@gmail.com', 'Phương Linh', 'google_150082');
SELECT create_fake_user('hgfdsapo3@gmail.com', 'Hương Giang', 'google_150083');
SELECT create_fake_user('mnbvcxza2@gmail.com', 'Minh Nguyễn', 'google_150084');
SELECT create_fake_user('ngocbichthuy69@gmail.com', 'Ngọc Bích Thủy', 'google_150085');
SELECT create_fake_user('phamvandongkhoi88@gmail.com', 'Phạm Văn Đông Khôi', 'google_150086');
SELECT create_fake_user('huynhthibahan07@gmail.com', 'Huỳnh Thị Bảo Hân', 'google_150087');
SELECT create_fake_user('lequanghuyduong404@gmail.com', 'Lê Quang Huy Dương', 'google_150088');
SELECT create_fake_user('tranminhkhaidung911@gmail.com', 'Trần Minh Khải Dũng', 'google_150089');
SELECT create_fake_user('vuongthilinhphuc23@gmail.com', 'Vương Thị Linh Phúc', 'google_150090');
SELECT create_fake_user('danghoangnamlan101@gmail.com', 'Đặng Hoàng Nam Lan', 'google_150091');
SELECT create_fake_user('buithanhhaanh55@gmail.com', 'Bùi Thanh Hà Anh', 'google_150092');
SELECT create_fake_user('hoangngocdiepmai666@gmail.com', 'Hoàng Ngọc Diệp Mai', 'google_150093');
SELECT create_fake_user('nguyenphuonganhvinh13@gmail.com', 'Nguyễn Phương Anh Vinh', 'google_150094');
SELECT create_fake_user('trinhvanduckien420@gmail.com', 'Trịnh Văn Đức Kiên', 'google_150095');
SELECT create_fake_user('lythikimlienhoang69@gmail.com', 'Lý Thị Kim Liên Hoàng', 'google_150096');
SELECT create_fake_user('phungxuanmaithanh88@gmail.com', 'Phùng Xuân Mai Thanh', 'google_150097');
SELECT create_fake_user('doanquangvinhngoc07@gmail.com', 'Đoàn Quang Vinh Ngọc', 'google_150098');
SELECT create_fake_user('taothuytrangpham404@gmail.com', 'Tào Thủy Trang Phạm', 'google_150099');
SELECT create_fake_user('vuhoanganhkiethu23@gmail.com', 'Vũ Hoàng Anh Kiệt Hư', 'google_150100');
SELECT create_fake_user('danghoangnamdang101@gmail.com', 'Đặng Hoàng Nam Đặng', 'google_150101');
SELECT create_fake_user('tranminhkhaihuynh55@gmail.com', 'Trần Minh Khải Huỳnh', 'google_150102');
SELECT create_fake_user('phamvandongle666@gmail.com', 'Phạm Văn Đông Lê', 'google_150103');
SELECT create_fake_user('huynhthibavu13@gmail.com', 'Huỳnh Thị Ba Vũ', 'google_150104');
SELECT create_fake_user('lequanghuytran420@gmail.com', 'Lê Quang Huy Trần', 'google_150105');
SELECT create_fake_user('vuongthilinhpham69@gmail.com', 'Vương Thị Linh Phạm', 'google_150106');
SELECT create_fake_user('danghoangnamnguyen88@gmail.com', 'Đặng Hoàng Nam Nguyễn', 'google_150107');
SELECT create_fake_user('buithanhhahoang07@gmail.com', 'Bùi Thanh Hà Hoàng', 'google_150108');
SELECT create_fake_user('hoangngocdieptran404@gmail.com', 'Hoàng Ngọc Diệp Trần', 'google_150109');
SELECT create_fake_user('nguyenphuonganhle911@gmail.com', 'Nguyễn Phương Anh Lê', 'google_150110');
SELECT create_fake_user('trinhvanduchuynh23@gmail.com', 'Trịnh Văn Đức Huỳnh', 'google_150111');
SELECT create_fake_user('lythikimlienpham101@gmail.com', 'Lý Thị Kim Liên Phạm', 'google_150112');
SELECT create_fake_user('phungxuanmainguyen55@gmail.com', 'Phùng Xuân Mai Nguyễn', 'google_150113');
SELECT create_fake_user('doanquangvinhdang666@gmail.com', 'Đoàn Quang Vinh Đặng', 'google_150114');
SELECT create_fake_user('taothuytranghoang13@gmail.com', 'Tào Thủy Trang Hoàng', 'google_150115');
SELECT create_fake_user('vuhoanganhkiettran420@gmail.com', 'Vũ Hoàng Anh Kiệt Trần', 'google_150116');
SELECT create_fake_user('qpjfowpqk@gmail.com', 'Quang Phạm', 'google_150117');
SELECT create_fake_user('xkdieowpql@gmail.com', 'Xuân Kiều', 'google_150118');
SELECT create_fake_user('mnbvcxzalm@gmail.com', 'Minh Nguyễn', 'google_150119');
SELECT create_fake_user('poiuytrewqp@gmail.com', 'Phương Oanh', 'google_150120');
SELECT create_fake_user('asdfghjklpo@gmail.com', 'Anh Sơn', 'google_150121');
SELECT create_fake_user('zxcvbnmkij@gmail.com', 'Xuân Cường', 'google_150122');
SELECT create_fake_user('qwertyuiopiu@gmail.com', 'Quỳnh Vân', 'google_150123');
SELECT create_fake_user('lkjihgfedcyu@gmail.com', 'Linh Kiều', 'google_150124');
SELECT create_fake_user('plmoknijbuh@gmail.com', 'Phương Linh', 'google_150125');
SELECT create_fake_user('hgfdsapoiugf@gmail.com', 'Hương Giang', 'google_150126');
SELECT create_fake_user('tranthibaohan2025@gmail.com', 'Trần Thị Bảo Hân', 'google_150127');
SELECT create_fake_user('nguyenhoangkiet1987@gmail.com', 'Nguyễn Hoàng Kiệt', 'google_150128');
SELECT create_fake_user('phamthilan666@gmail.com', 'Phạm Thị Lan', 'google_150129');
SELECT create_fake_user('levanphuc420@gmail.com', 'Lê Văn Phúc', 'google_150130');
SELECT create_fake_user('hoangthuyduong911@gmail.com', 'Hoàng Thủy Dương', 'google_150131');
SELECT create_fake_user('dangquangvinh69@gmail.com', 'Đặng Quang Vinh', 'google_150132');
SELECT create_fake_user('vuthikimngan88@gmail.com', 'Vũ Thị Kim Ngân', 'google_150133');
SELECT create_fake_user('buixuanmai07@gmail.com', 'Bùi Xuân Mai', 'google_150134');
SELECT create_fake_user('trinhhoanganh404@gmail.com', 'Trịnh Hoàng Anh', 'google_150135');
SELECT create_fake_user('lyvandung23@gmail.com', 'Lý Văn Dũng', 'google_150136');
SELECT create_fake_user('phungthanhha101@gmail.com', 'Phùng Thanh Hà', 'google_150137');
SELECT create_fake_user('dohoangdiep55@gmail.com', 'Đỗ Hoàng Diệp', 'google_150138');
SELECT create_fake_user('taquanghuy666@gmail.com', 'Tạ Quang Huy', 'google_150139');
SELECT create_fake_user('vuthilinh13@gmail.com', 'Vũ Thị Linh', 'google_150140');
SELECT create_fake_user('nguyenxuanmai420@gmail.com', 'Nguyễn Xuân Mai', 'google_150141');
SELECT create_fake_user('tranthanhkhoi69@gmail.com', 'Trần Thanh Khôi', 'google_150142');
SELECT create_fake_user('phamvanduc88@gmail.com', 'Phạm Văn Đức', 'google_150143');
SELECT create_fake_user('lehoangphuc07@gmail.com', 'Lê Hoàng Phúc', 'google_150144');
SELECT create_fake_user('huynhthilan404@gmail.com', 'Huỳnh Thị Lan', 'google_150145');
SELECT create_fake_user('dangngocbich911@gmail.com', 'Đặng Ngọc Bích', 'google_150146');
SELECT create_fake_user('buivandong23@gmail.com', 'Bùi Văn Đông', 'google_150147');
SELECT create_fake_user('trinhthuytrang101@gmail.com', 'Trịnh Thủy Trang', 'google_150148');
SELECT create_fake_user('lyhoanganhkiet55@gmail.com', 'Lý Hoàng Anh Kiệt', 'google_150149');

-- Step 4: Clean up function
DROP FUNCTION IF EXISTS create_fake_user(TEXT, TEXT, TEXT, UUID);

-- Step 5: Re-enable triggers
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER on_user_created_tokens
  AFTER INSERT ON public.users
  FOR EACH ROW EXECUTE FUNCTION initialize_user_tokens();

-- Step 6: Verify counts
SELECT 'Total users in auth.users:' as info, COUNT(*) as count FROM auth.users
UNION ALL
SELECT 'Total users in public.users:' as info, COUNT(*) as count FROM public.users
UNION ALL
SELECT 'Total users in user_profiles:' as info, COUNT(*) as count FROM public.user_profiles
UNION ALL
SELECT 'Total users in user_tokens:' as info, COUNT(*) as count FROM public.user_tokens;

-- Show sample users
SELECT 
  u.id,
  u.email,
  u.name,
  up.gender,
  up.age_group,
  ut.total_tokens
FROM public.users u
LEFT JOIN public.user_profiles up ON u.id = up.user_id
LEFT JOIN public.user_tokens ut ON u.id = ut.user_id
ORDER BY u.created_at DESC
LIMIT 10;

