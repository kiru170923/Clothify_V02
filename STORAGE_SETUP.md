# 🗄️ Supabase Storage Setup for QR Feature

## Quick Fix for "Failed to upload image"

### Step 1: Create Images Bucket

**Vào Supabase Dashboard:**

1. Click **Storage** (sidebar)
2. Click **"New bucket"**
3. Fill in:
   - **Name**: `images`
   - **Public bucket**: ✅ Check this!
   - **File size limit**: 10 MB
   - **Allowed MIME types**: Leave empty (allow all images)
4. Click **"Create bucket"**

### Step 2: Setup Storage Policies

**Click on `images` bucket → Policies → "New Policy"**

#### Policy 1: Allow Authenticated Uploads

```sql
-- Name: Authenticated users can upload images
-- Policy for: INSERT
-- Target roles: authenticated

CREATE POLICY "Authenticated users can upload images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'images' AND
  (storage.foldername(name))[1] IN ('qr-clothing', 'qr-tryons', 'wardrobe', 'models')
);
```

#### Policy 2: Public Read Access

```sql
-- Name: Public can read all images
-- Policy for: SELECT
-- Target roles: public, authenticated

CREATE POLICY "Public can read all images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'images');
```

#### Policy 3: Users Can Delete Own Files

```sql
-- Name: Users can delete own files
-- Policy for: DELETE
-- Target roles: authenticated

CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'images' AND
  (storage.foldername(name))[1] IN ('qr-clothing', 'qr-tryons', 'wardrobe', 'models')
);
```

### Step 3: Verify

**Test upload in Supabase Dashboard:**

1. Go to Storage → images bucket
2. Click "Upload file"
3. Upload any image
4. Should succeed ✅

---

## Alternative: SQL Setup (Faster)

**Run this in Supabase SQL Editor:**

```sql
-- 1. Create bucket (if not exists)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'images',
  'images',
  true,
  10485760, -- 10MB
  NULL -- Allow all image types
)
ON CONFLICT (id) DO NOTHING;

-- 2. Drop existing policies (if any)
DROP POLICY IF EXISTS "Authenticated users can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Public can read all images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own files" ON storage.objects;

-- 3. Create upload policy
CREATE POLICY "Authenticated users can upload images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'images'
);

-- 4. Create read policy
CREATE POLICY "Public can read all images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'images');

-- 5. Create delete policy
CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'images');

-- 6. Verify
SELECT * FROM storage.buckets WHERE id = 'images';
SELECT * FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects';
```

---

## Common Issues

### Issue: "Bucket not found"

**Solution:**
```sql
-- Check if bucket exists
SELECT * FROM storage.buckets WHERE id = 'images';

-- If not found, create:
INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true);
```

### Issue: "New row violates policy"

**Solution:**
```sql
-- Check policies
SELECT * FROM pg_policies 
WHERE schemaname = 'storage' 
AND tablename = 'objects';

-- If empty, re-run the policy creation SQL above
```

### Issue: "File too large"

**Solution:**
```sql
-- Increase file size limit to 50MB
UPDATE storage.buckets
SET file_size_limit = 52428800 -- 50MB in bytes
WHERE id = 'images';
```

---

## File Size Limits

**Current Setup:**
- Max file size: 10 MB
- Recommended for web uploads

**For larger files:**
```sql
UPDATE storage.buckets
SET file_size_limit = 52428800 -- 50MB
WHERE id = 'images';
```

---

## Folder Structure

After setup, files will be organized:

```
images/
├── qr-clothing/          # Clothing images for QR
│   └── {user_id}/
│       └── {timestamp}.jpg
├── qr-tryons/            # Try-on results from QR scans
│   └── {qr_id}/
│       └── {timestamp}.jpg
├── wardrobe/             # Wardrobe items
│   └── {user_id}/
│       └── {item_id}.jpg
└── models/               # User model images
    └── {user_id}/
        └── model.jpg
```

---

## Testing Storage

**Test in browser console:**

```javascript
const { data: { session } } = await supabase.auth.getSession()

// Test upload
const file = new File(['test'], 'test.txt', { type: 'text/plain' })
const { data, error } = await supabase.storage
  .from('images')
  .upload(`test/${Date.now()}.txt`, file)

console.log('Upload result:', { data, error })

// If success, clean up
if (data) {
  await supabase.storage.from('images').remove([data.path])
}
```

---

## Quick Fix Script

**Run this to setup everything at once:**

```sql
-- Complete Storage Setup Script

-- 1. Create bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('images', 'images', true, 10485760)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Clear old policies
DROP POLICY IF EXISTS "Authenticated users can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Public can read all images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own files" ON storage.objects;
DROP POLICY IF EXISTS "Service role can do anything" ON storage.objects;

-- 3. Create new policies
CREATE POLICY "Authenticated users can upload images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'images');

CREATE POLICY "Public can read all images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'images');

CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'images');

CREATE POLICY "Service role can do anything"
ON storage.objects FOR ALL
TO service_role
USING (bucket_id = 'images')
WITH CHECK (bucket_id = 'images');

-- 4. Verify
SELECT 'Bucket created' as status, * FROM storage.buckets WHERE id = 'images'
UNION ALL
SELECT 'Policies created' as status, policyname::text as id, 'policy'::text as name, true as public, null::bigint as file_size_limit
FROM pg_policies 
WHERE schemaname = 'storage' AND tablename = 'objects';
```

**Copy toàn bộ script này → Paste vào Supabase SQL Editor → Run**

✅ Done! Try uploading again!

---

**Status: Storage should work now! 🎉**

