-- ============================================
-- CREATE 83 FAKE USERS - COMPLETE SQL SCRIPT
-- ============================================
-- This script creates users in auth.users and syncs to all related tables
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

  IF v_user_id IS NULL THEN
    SELECT id INTO v_user_id FROM auth.users WHERE email = p_email;
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
    5,
    0,
    NOW(),
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id) DO NOTHING;

  RETURN v_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Create all 83 users
SELECT create_fake_user('user1@clothify.com', 'Nguyễn Văn A', 'google_1');
SELECT create_fake_user('user2@clothify.com', 'Trần Thị B', 'google_2');
SELECT create_fake_user('user3@clothify.com', 'Phạm Văn C', 'google_3');
SELECT create_fake_user('user4@clothify.com', 'Hoàng Thị D', 'google_4');
SELECT create_fake_user('user5@clothify.com', 'Võ Văn E', 'google_5');
SELECT create_fake_user('user6@clothify.com', 'Đặng Thị F', 'google_6');
SELECT create_fake_user('user7@clothify.com', 'Bùi Văn G', 'google_7');
SELECT create_fake_user('user8@clothify.com', 'Tạ Thị H', 'google_8');
SELECT create_fake_user('user9@clothify.com', 'Dương Văn I', 'google_9');
SELECT create_fake_user('user10@clothify.com', 'Giang Thị J', 'google_10');
SELECT create_fake_user('user11@clothify.com', 'Hà Văn K', 'google_11');
SELECT create_fake_user('user12@clothify.com', 'Lương Thị L', 'google_12');
SELECT create_fake_user('user13@clothify.com', 'Mã Văn M', 'google_13');
SELECT create_fake_user('user14@clothify.com', 'Nông Thị N', 'google_14');
SELECT create_fake_user('user15@clothify.com', 'Ông Văn O', 'google_15');
SELECT create_fake_user('user16@clothify.com', 'Phương Thị P', 'google_16');
SELECT create_fake_user('user17@clothify.com', 'Quách Văn Q', 'google_17');
SELECT create_fake_user('user18@clothify.com', 'Rồng Thị R', 'google_18');
SELECT create_fake_user('user19@clothify.com', 'Sơn Văn S', 'google_19');
SELECT create_fake_user('user20@clothify.com', 'Tuyết Thị T', 'google_20');
SELECT create_fake_user('user21@clothify.com', 'Uyên Văn U', 'google_21');
SELECT create_fake_user('user22@clothify.com', 'Văn Thị V', 'google_22');
SELECT create_fake_user('user23@clothify.com', 'Xuân Văn W', 'google_23');
SELECT create_fake_user('user24@clothify.com', 'Yến Thị X', 'google_24');
SELECT create_fake_user('user25@clothify.com', 'Zoe Văn Z', 'google_25');
SELECT create_fake_user('user26@clothify.com', 'Anh Thị AA', 'google_26');
SELECT create_fake_user('user27@clothify.com', 'Bình Văn AB', 'google_27');
SELECT create_fake_user('user28@clothify.com', 'Chi Thị AC', 'google_28');
SELECT create_fake_user('user29@clothify.com', 'Dũng Văn AD', 'google_29');
SELECT create_fake_user('user30@clothify.com', 'Ế Thị AE', 'google_30');
SELECT create_fake_user('user31@clothify.com', 'Phong Văn AF', 'google_31');
SELECT create_fake_user('user32@clothify.com', 'Giang Thị AG', 'google_32');
SELECT create_fake_user('user33@clothify.com', 'Hiền Văn AH', 'google_33');
SELECT create_fake_user('user34@clothify.com', 'Ích Thị AI', 'google_34');
SELECT create_fake_user('user35@clothify.com', 'Khánh Văn AJ', 'google_35');
SELECT create_fake_user('user36@clothify.com', 'Linh Thị AK', 'google_36');
SELECT create_fake_user('user37@clothify.com', 'Minh Văn AL', 'google_37');
SELECT create_fake_user('user38@clothify.com', 'Nhi Thị AM', 'google_38');
SELECT create_fake_user('user39@clothify.com', 'Oái Văn AN', 'google_39');
SELECT create_fake_user('user40@clothify.com', 'Phúc Thị AO', 'google_40');
SELECT create_fake_user('user41@clothify.com', 'Quân Văn AP', 'google_41');
SELECT create_fake_user('user42@clothify.com', 'Rơi Thị AQ', 'google_42');
SELECT create_fake_user('user43@clothify.com', 'Sang Văn AR', 'google_43');
SELECT create_fake_user('user44@clothify.com', 'Trang Thị AS', 'google_44');
SELECT create_fake_user('user45@clothify.com', 'Uyên Văn AT', 'google_45');
SELECT create_fake_user('user46@clothify.com', 'Vĩnh Thị AU', 'google_46');
SELECT create_fake_user('user47@clothify.com', 'Xoan Văn AV', 'google_47');
SELECT create_fake_user('user48@clothify.com', 'Yên Thị AW', 'google_48');
SELECT create_fake_user('user49@clothify.com', 'Zâm Văn AX', 'google_49');
SELECT create_fake_user('user50@clothify.com', 'Aline Thị AY', 'google_50');
SELECT create_fake_user('user51@clothify.com', 'Bảo Văn AZ', 'google_51');
SELECT create_fake_user('user52@clothify.com', 'Cẩm Thị BA', 'google_52');
SELECT create_fake_user('user53@clothify.com', 'Đức Văn BB', 'google_53');
SELECT create_fake_user('user54@clothify.com', 'Ều Thị BC', 'google_54');
SELECT create_fake_user('user55@clothify.com', 'Phước Văn BD', 'google_55');
SELECT create_fake_user('user56@clothify.com', 'Gấm Thị BE', 'google_56');
SELECT create_fake_user('user57@clothify.com', 'Hương Văn BF', 'google_57');
SELECT create_fake_user('user58@clothify.com', 'Ích Thị BG', 'google_58');
SELECT create_fake_user('user59@clothify.com', 'Kimi Văn BH', 'google_59');
SELECT create_fake_user('user60@clothify.com', 'Liên Thị BI', 'google_60');
SELECT create_fake_user('user61@clothify.com', 'Miền Văn BJ', 'google_61');
SELECT create_fake_user('user62@clothify.com', 'Nụ Thị BK', 'google_62');
SELECT create_fake_user('user63@clothify.com', 'Oánh Văn BL', 'google_63');
SELECT create_fake_user('user64@clothify.com', 'Phương Thị BM', 'google_64');
SELECT create_fake_user('user65@clothify.com', 'Quỳnh Văn BN', 'google_65');
SELECT create_fake_user('user66@clothify.com', 'Rút Thị BO', 'google_66');
SELECT create_fake_user('user67@clothify.com', 'Sắc Văn BP', 'google_67');
SELECT create_fake_user('user68@clothify.com', 'Thúy Thị BQ', 'google_68');
SELECT create_fake_user('user69@clothify.com', 'Ưng Văn BR', 'google_69');
SELECT create_fake_user('user70@clothify.com', 'Vân Thị BS', 'google_70');
SELECT create_fake_user('user71@clothify.com', 'Xó Văn BT', 'google_71');
SELECT create_fake_user('user72@clothify.com', 'Yến Thị BU', 'google_72');
SELECT create_fake_user('user73@clothify.com', 'Zoe Văn BV', 'google_73');
SELECT create_fake_user('user74@clothify.com', 'Anh Thị BW', 'google_74');
SELECT create_fake_user('user75@clothify.com', 'Bích Văn BX', 'google_75');
SELECT create_fake_user('user76@clothify.com', 'Cúc Thị BY', 'google_76');
SELECT create_fake_user('user77@clothify.com', 'Dâm Văn BZ', 'google_77');
SELECT create_fake_user('user78@clothify.com', 'Ế Thị CA', 'google_78');
SELECT create_fake_user('user79@clothify.com', 'Phi Văn CB', 'google_79');
SELECT create_fake_user('user80@clothify.com', 'Gái Thị CC', 'google_80');
SELECT create_fake_user('user81@clothify.com', 'Hân Văn CD', 'google_81');
SELECT create_fake_user('user82@clothify.com', 'Ích Thị CE', 'google_82');
SELECT create_fake_user('user83@clothify.com', 'Khuê Văn CF', 'google_83');

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

