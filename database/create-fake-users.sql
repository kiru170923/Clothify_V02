-- Create 83 fake users in auth.users
-- Note: This script uses Supabase admin API approach
-- You may need to run this in your backend or use Supabase SQL editor with service role

-- Method 1: Using SQL (if you have direct access)
-- This creates users in the public.users table (if it exists)

INSERT INTO public.users (email, name, provider, provider_id) VALUES
('user1@clothify.com', 'Nguyễn Văn A', 'google', 'google_1'),
('user2@clothify.com', 'Trần Thị B', 'google', 'google_2'),
('user3@clothify.com', 'Phạm Văn C', 'google', 'google_3'),
('user4@clothify.com', 'Hoàng Thị D', 'google', 'google_4'),
('user5@clothify.com', 'Võ Văn E', 'google', 'google_5'),
('user6@clothify.com', 'Đặng Thị F', 'google', 'google_6'),
('user7@clothify.com', 'Bùi Văn G', 'google', 'google_7'),
('user8@clothify.com', 'Tạ Thị H', 'google', 'google_8'),
('user9@clothify.com', 'Dương Văn I', 'google', 'google_9'),
('user10@clothify.com', 'Giang Thị J', 'google', 'google_10'),
('user11@clothify.com', 'Hà Văn K', 'google', 'google_11'),
('user12@clothify.com', 'Lương Thị L', 'google', 'google_12'),
('user13@clothify.com', 'Mã Văn M', 'google', 'google_13'),
('user14@clothify.com', 'Nông Thị N', 'google', 'google_14'),
('user15@clothify.com', 'Ông Văn O', 'google', 'google_15'),
('user16@clothify.com', 'Phương Thị P', 'google', 'google_16'),
('user17@clothify.com', 'Quách Văn Q', 'google', 'google_17'),
('user18@clothify.com', 'Rồng Thị R', 'google', 'google_18'),
('user19@clothify.com', 'Sơn Văn S', 'google', 'google_19'),
('user20@clothify.com', 'Tuyết Thị T', 'google', 'google_20'),
('user21@clothify.com', 'Uyên Văn U', 'google', 'google_21'),
('user22@clothify.com', 'Văn Thị V', 'google', 'google_22'),
('user23@clothify.com', 'Xuân Văn W', 'google', 'google_23'),
('user24@clothify.com', 'Yến Thị X', 'google', 'google_24'),
('user25@clothify.com', 'Zoe Văn Z', 'google', 'google_25'),
('user26@clothify.com', 'Anh Thị AA', 'google', 'google_26'),
('user27@clothify.com', 'Bình Văn AB', 'google', 'google_27'),
('user28@clothify.com', 'Chi Thị AC', 'google', 'google_28'),
('user29@clothify.com', 'Dũng Văn AD', 'google', 'google_29'),
('user30@clothify.com', 'Ế Thị AE', 'google', 'google_30'),
('user31@clothify.com', 'Phong Văn AF', 'google', 'google_31'),
('user32@clothify.com', 'Giang Thị AG', 'google', 'google_32'),
('user33@clothify.com', 'Hiền Văn AH', 'google', 'google_33'),
('user34@clothify.com', 'Ích Thị AI', 'google', 'google_34'),
('user35@clothify.com', 'Khánh Văn AJ', 'google', 'google_35'),
('user36@clothify.com', 'Linh Thị AK', 'google', 'google_36'),
('user37@clothify.com', 'Minh Văn AL', 'google', 'google_37'),
('user38@clothify.com', 'Nhi Thị AM', 'google', 'google_38'),
('user39@clothify.com', 'Oái Văn AN', 'google', 'google_39'),
('user40@clothify.com', 'Phúc Thị AO', 'google', 'google_40'),
('user41@clothify.com', 'Quân Văn AP', 'google', 'google_41'),
('user42@clothify.com', 'Rơi Thị AQ', 'google', 'google_42'),
('user43@clothify.com', 'Sang Văn AR', 'google', 'google_43'),
('user44@clothify.com', 'Trang Thị AS', 'google', 'google_44'),
('user45@clothify.com', 'Uyên Văn AT', 'google', 'google_45'),
('user46@clothify.com', 'Vĩnh Thị AU', 'google', 'google_46'),
('user47@clothify.com', 'Xoan Văn AV', 'google', 'google_47'),
('user48@clothify.com', 'Yên Thị AW', 'google', 'google_48'),
('user49@clothify.com', 'Zâm Văn AX', 'google', 'google_49'),
('user50@clothify.com', 'Aline Thị AY', 'google', 'google_50'),
('user51@clothify.com', 'Bảo Văn AZ', 'google', 'google_51'),
('user52@clothify.com', 'Cẩm Thị BA', 'google', 'google_52'),
('user53@clothify.com', 'Đức Văn BB', 'google', 'google_53'),
('user54@clothify.com', 'Ều Thị BC', 'google', 'google_54'),
('user55@clothify.com', 'Phước Văn BD', 'google', 'google_55'),
('user56@clothify.com', 'Gấm Thị BE', 'google', 'google_56'),
('user57@clothify.com', 'Hương Văn BF', 'google', 'google_57'),
('user58@clothify.com', 'Ích Thị BG', 'google', 'google_58'),
('user59@clothify.com', 'Kimi Văn BH', 'google', 'google_59'),
('user60@clothify.com', 'Liên Thị BI', 'google', 'google_60'),
('user61@clothify.com', 'Miền Văn BJ', 'google', 'google_61'),
('user62@clothify.com', 'Nụ Thị BK', 'google', 'google_62'),
('user63@clothify.com', 'Oánh Văn BL', 'google', 'google_63'),
('user64@clothify.com', 'Phương Thị BM', 'google', 'google_64'),
('user65@clothify.com', 'Quỳnh Văn BN', 'google', 'google_65'),
('user66@clothify.com', 'Rút Thị BO', 'google', 'google_66'),
('user67@clothify.com', 'Sắc Văn BP', 'google', 'google_67'),
('user68@clothify.com', 'Thúy Thị BQ', 'google', 'google_68'),
('user69@clothify.com', 'Ưng Văn BR', 'google', 'google_69'),
('user70@clothify.com', 'Vân Thị BS', 'google', 'google_70'),
('user71@clothify.com', 'Xó Văn BT', 'google', 'google_71'),
('user72@clothify.com', 'Yến Thị BU', 'google', 'google_72'),
('user73@clothify.com', 'Zoe Văn BV', 'google', 'google_73'),
('user74@clothify.com', 'Anh Thị BW', 'google', 'google_74'),
('user75@clothify.com', 'Bích Văn BX', 'google', 'google_75'),
('user76@clothify.com', 'Cúc Thị BY', 'google', 'google_76'),
('user77@clothify.com', 'Dâm Văn BZ', 'google', 'google_77'),
('user78@clothify.com', 'Ế Thị CA', 'google', 'google_78'),
('user79@clothify.com', 'Phi Văn CB', 'google', 'google_79'),
('user80@clothify.com', 'Gái Thị CC', 'google', 'google_80'),
('user81@clothify.com', 'Hân Văn CD', 'google', 'google_81'),
('user82@clothify.com', 'Ích Thị CE', 'google', 'google_82'),
('user83@clothify.com', 'Khuê Văn CF', 'google', 'google_83')
ON CONFLICT DO NOTHING;

-- Verify count
SELECT COUNT(*) as total_users FROM public.users;

-- ============================================
-- ALTERNATIVE: Using Supabase Backend (Node.js)
-- ============================================
/*
const { createClient } = require('@supabase/supabase-js')

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function createFakeUsers() {
  const users = []
  for (let i = 1; i <= 83; i++) {
    users.push({
      email: `user${i}@clothify.com`,
      password: 'TempPassword123!',
      email_confirm: true,
      user_metadata: {
        name: `User ${i}`
      }
    })
  }

  // Use Supabase Admin API to create users
  for (const user of users) {
    try {
      await supabaseAdmin.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
        user_metadata: user.user_metadata
      })
    } catch (error) {
      console.error(`Error creating user ${user.email}:`, error)
    }
  }
}

createFakeUsers()
*/
