-- ============================================
-- CREATE 43 NEW USERS - COMPLETE SQL SCRIPT
-- ============================================
-- This script creates 43 users in auth.users and syncs to all related tables
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

-- Step 3: Create all 43 users
SELECT create_fake_user('tranphuonganh2025@gmail.com', 'Trần Phương Anh', 'google_150194');
SELECT create_fake_user('nguyenhoanglong1987@gmail.com', 'Nguyễn Hoàng Long', 'google_150195');
SELECT create_fake_user('phamthikimngan666@gmail.com', 'Phạm Thị Kim Ngân', 'google_150196');
SELECT create_fake_user('levanphuc420@gmail.com', 'Lê Văn Phúc', 'google_150197');
SELECT create_fake_user('hoangthuyduong911@gmail.com', 'Hoàng Thủy Dương', 'google_150198');
SELECT create_fake_user('dangquangvinh69@gmail.com', 'Đặng Quang Vinh', 'google_150199');
SELECT create_fake_user('vuthikimngan88@gmail.com', 'Vũ Thị Kim Ngân', 'google_150200');
SELECT create_fake_user('buixuanmai07@gmail.com', 'Bùi Xuân Mai', 'google_150201');
SELECT create_fake_user('trinhhoanganh404@gmail.com', 'Trịnh Hoàng Anh', 'google_150202');
SELECT create_fake_user('lyvandung23@gmail.com', 'Lý Văn Dũng', 'google_150203');
SELECT create_fake_user('phungthanhha101@gmail.com', 'Phùng Thanh Hà', 'google_150204');
SELECT create_fake_user('dohoangdiep55@gmail.com', 'Đỗ Hoàng Diệp', 'google_150205');
SELECT create_fake_user('taquanghuy666@gmail.com', 'Tạ Quang Huy', 'google_150206');
SELECT create_fake_user('vuthilinh13@gmail.com', 'Vũ Thị Linh', 'google_150207');
SELECT create_fake_user('nguyenxuanmai420@gmail.com', 'Nguyễn Xuân Mai', 'google_150208');
SELECT create_fake_user('tranthanhkhoi69@gmail.com', 'Trần Thanh Khôi', 'google_150209');
SELECT create_fake_user('phamvanduc88@gmail.com', 'Phạm Văn Đức', 'google_150210');
SELECT create_fake_user('lehoangphuc07@gmail.com', 'Lê Hoàng Phúc', 'google_150211');
SELECT create_fake_user('huynhthilan404@gmail.com', 'Huỳnh Thị Lan', 'google_150212');
SELECT create_fake_user('dangngocbich911@gmail.com', 'Đặng Ngọc Bích', 'google_150213');
SELECT create_fake_user('buivandong23@gmail.com', 'Bùi Văn Đông', 'google_150214');
SELECT create_fake_user('trinhthuytrang101@gmail.com', 'Trịnh Thủy Trang', 'google_150215');
SELECT create_fake_user('lyhoanganhkiet55@gmail.com', 'Lý Hoàng Anh Kiệt', 'google_150216');
SELECT create_fake_user('nguyenminhkhai666@gmail.com', 'Nguyễn Minh Khải', 'google_150217');
SELECT create_fake_user('phamthibaohan13@gmail.com', 'Phạm Thị Bảo Hân', 'google_150218');
SELECT create_fake_user('doquanghuy420@gmail.com', 'Đỗ Quang Huy', 'google_150219');
SELECT create_fake_user('taothilinh69@gmail.com', 'Tào Thị Linh', 'google_150220');
SELECT create_fake_user('vuvanduc88@gmail.com', 'Vũ Văn Đức', 'google_150221');
SELECT create_fake_user('tranngocdiep07@gmail.com', 'Trần Ngọc Diệp', 'google_150222');
SELECT create_fake_user('nguyenphuonganh404@gmail.com', 'Nguyễn Phương Anh', 'google_150223');
SELECT create_fake_user('phamvandung911@gmail.com', 'Phạm Văn Dũng', 'google_150224');
SELECT create_fake_user('lehoangkiet23@gmail.com', 'Lê Hoàng Kiệt', 'google_150225');
SELECT create_fake_user('huynhthuytrang101@gmail.com', 'Huỳnh Thủy Trang', 'google_150226');
SELECT create_fake_user('dangthanhha55@gmail.com', 'Đặng Thanh Hà', 'google_150227');
SELECT create_fake_user('vuongxuanmai666@gmail.com', 'Vương Xuân Mai', 'google_150228');
SELECT create_fake_user('buiquangvinh13@gmail.com', 'Bùi Quang Vinh', 'google_150229');
SELECT create_fake_user('trinhkimlien420@gmail.com', 'Trịnh Kim Liên', 'google_150230');
SELECT create_fake_user('lythibaohan69@gmail.com', 'Lý Thị Bảo Hân', 'google_150231');
SELECT create_fake_user('phungvanphuc88@gmail.com', 'Phùng Văn Phúc', 'google_150232');
SELECT create_fake_user('dohoanganh07@gmail.com', 'Đỗ Hoàng Anh', 'google_150233');
SELECT create_fake_user('taquangkiet404@gmail.com', 'Tạ Quang Kiệt', 'google_150234');
SELECT create_fake_user('vuthilinh911@gmail.com', 'Vũ Thị Linh', 'google_150235');
SELECT create_fake_user('nguyenminhkhai23@gmail.com', 'Nguyễn Minh Khải', 'google_150236');

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
WHERE u.provider_id LIKE 'google_15019%' OR u.provider_id LIKE 'google_1502%'
ORDER BY u.created_at DESC
LIMIT 10;

