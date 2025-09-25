'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { useSupabase } from '../../components/SupabaseProvider'

type Step = 1 | 2 | 3 | 4 | 5

export default function OnboardingPage() {
  const router = useRouter()
  const { session } = useSupabase() as any
  const [step, setStep] = useState<Step>(1)
  const [loading, setLoading] = useState(false)

  const [gender, setGender] = useState<'male'|'female'|'other'|''>('')
  const [ageGroup, setAgeGroup] = useState('')
  const [height, setHeight] = useState<number | ''>('')
  const [weight, setWeight] = useState<number | ''>('')
  const [size, setSize] = useState('')
  const [styles, setStyles] = useState<string[]>([])
  const [occasions, setOccasions] = useState<string[]>([])
  const [styleOther, setStyleOther] = useState('')
  const [occasionOther, setOccasionOther] = useState('')
  const [budget, setBudget] = useState('')
  const [colors, setColors] = useState<string[]>([])
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [showStylePicker, setShowStylePicker] = useState(false)
  const [showOccasionPicker, setShowOccasionPicker] = useState(false)
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [showPhotoGuide, setShowPhotoGuide] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  const next = () => setStep((s): Step => (s < 5 ? ((s + 1) as Step) : (5 as Step)))
  const prev = () => setStep((s): Step => (s > 1 ? ((s - 1) as Step) : (1 as Step)))

  const toggle = (arr: string[], v: string, setter: (v: string[]) => void) => {
    setter(arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v])
  }

  const save = async () => {
    try {
      setLoading(true)
      const requiredOk = gender && (ageGroup || size || styles.length>0 || occasions.length>0)
      if (!requiredOk) {
        toast.error('Vui lòng chọn vài thông tin cơ bản trước khi tiếp tục')
        setLoading(false)
        return
      }
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          gender,
          age_group: ageGroup,
          height_cm: height === '' ? null : Number(height),
          weight_kg: weight === '' ? null : Number(weight),
          size,
          style_preferences: styles,
          favorite_colors: colors,
          occasions,
          budget_range: budget,
          try_on_photo_url: photoUrl,
        })
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error || 'Save failed')
      toast.success('Đã lưu hồ sơ!')
      // Show Style Card briefly, then go to try-on
      const styleCard = {
        gender, ageGroup, size, styles, occasions, budget, colors
      }
      console.log('🎴 Style Card:', styleCard)
      router.push('/try-on')
    } catch (e: any) {
      toast.error(e.message || 'Lỗi lưu hồ sơ')
    } finally {
      setLoading(false)
    }
  }

  // Prefill from existing profile if available
  useEffect(() => {
    const prefill = async () => {
      if (!session?.access_token) return
      try {
        const res = await fetch('/api/profile', { headers: { 'Authorization': `Bearer ${session.access_token}` }})
        const data = await res.json()
        const p = data?.profile
        if (res.ok && p) {
          setGender((p.gender || '') as any)
          setAgeGroup(p.age_group || '')
          setHeight(typeof p.height_cm === 'number' ? p.height_cm : '')
          setWeight(typeof p.weight_kg === 'number' ? p.weight_kg : '')
          setSize(p.size || '')
          setStyles(Array.isArray(p.style_preferences) ? p.style_preferences : [])
          setColors(Array.isArray(p.favorite_colors) ? p.favorite_colors : [])
          setOccasions(Array.isArray(p.occasions) ? p.occasions : [])
          setBudget(p.budget_range || '')
          setPhotoUrl(p.try_on_photo_url || null)
          setIsEditing(true)
        }
      } catch {}
    }
    prefill()
  }, [session?.access_token])

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-yellow-50" style={{ backgroundColor: '#f6f1e9' }}>
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-amber-800 mb-2">Thiết lập nhanh hồ sơ</h1>
        <p className="text-sm text-gray-600 mb-6">Hoàn tất hồ sơ trong 3–5 bước để chúng tôi có thể hỗ trợ bạn tốt nhất.</p>

        <div className="mb-6 flex items-center gap-2">
          {[1,2,3,4,5].map(n => (
            <div key={n} className={`h-2 flex-1 rounded-full ${n <= step ? 'bg-amber-500' : 'bg-amber-200'}`}></div>
          ))}
        </div>

        {step === 1 && (
          <div className="bg-white rounded-xl border p-5 space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-900 mb-2">Giới tính</p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  {k:'male', label:'Nam'},
                  {k:'female', label:'Nữ'},
                  {k:'other', label:'Khác'},
                ].map(o => (
                  <button key={o.k} onClick={() => setGender(o.k as any)} className={`py-3 rounded-lg border ${gender===o.k?'border-amber-500 bg-amber-50':'border-gray-200 hover:bg-gray-50'}`}>{o.label}</button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 mb-2">Nhóm tuổi</p>
              <div className="grid grid-cols-3 gap-2">
                {['18-24','25-34','35-44','45-54','55+'].map(a => (
                  <button key={a} onClick={() => setAgeGroup(a)} className={`py-3 rounded-lg border ${ageGroup===a?'border-amber-500 bg-amber-50':'border-gray-200 hover:bg-gray-50'}`}>{a}</button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="bg-white rounded-xl border p-5 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-gray-700 mb-1">Chiều cao (cm)</label>
                <input value={height} onChange={e=>setHeight(e.target.value?Number(e.target.value):'')} type="number" className="w-full border rounded-lg px-3 py-2" placeholder="170" />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Cân nặng (kg)</label>
                <input value={weight} onChange={e=>setWeight(e.target.value?Number(e.target.value):'')} type="number" className="w-full border rounded-lg px-3 py-2" placeholder="65" />
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 mb-2">Size thường mặc</p>
              <div className="grid grid-cols-5 gap-2">
                {['XS','S','M','L','XL'].map(s => (
                  <button key={s} onClick={()=>setSize(s)} className={`py-3 rounded-lg border ${size===s?'border-amber-500 bg-amber-50':'border-gray-200 hover:bg-gray-50'}`}>{s}</button>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">Gợi ý: ví dụ 170cm/65kg thường là size M</p>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="bg-white rounded-xl border p-5 space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-900 mb-2">Phong cách ưa thích</p>
              <button onClick={()=>setShowStylePicker(true)} className="px-4 py-2 rounded-lg border border-amber-300 text-amber-800">Chọn phong cách</button>
              {styles.length>0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {styles.map(s=> (
                    <span key={s} className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs">{s}</span>
                  ))}
                </div>
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 mb-2">Dịp thường mua đồ</p>
              <button onClick={()=>setShowOccasionPicker(true)} className="px-4 py-2 rounded-lg border border-amber-300 text-amber-800">Chọn dịp</button>
              {occasions.length>0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {occasions.map(s=> (
                    <span key={s} className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs">{s}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="bg-white rounded-xl border p-5 space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-900 mb-2">Ngân sách</p>
              <div className="grid grid-cols-3 gap-2">
                {['<300k','300k-500k','>500k'].map(b => (
                  <button key={b} onClick={()=>setBudget(b)} className={`py-3 rounded-lg border ${budget===b?'border-amber-500 bg-amber-50':'border-gray-200 hover:bg-gray-50'}`}>{b}</button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 mb-2">Màu yêu thích</p>
              <button onClick={()=>setShowColorPicker(true)} className="px-4 py-2 rounded-lg border border-amber-300 text-amber-800">Chọn màu</button>
              {colors.length>0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {colors.map(c => (
                    <span key={c} className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs">{c}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="bg-white rounded-xl border p-5 space-y-4">
            <div className="flex items-center gap-2">
              <p className="text-sm text-gray-700">(Tuỳ chọn) Tải ảnh để dùng Try‑on. Ảnh chỉ dùng nội bộ, không chia sẻ.</p>
              <button onClick={()=>setShowPhotoGuide(true)} className="w-5 h-5 rounded-full bg-amber-200 text-amber-800 text-xs">?</button>
            </div>
            <div className="flex items-center gap-3">
              <input type="file" accept="image/*" onChange={async (e)=>{
                const file = e.target.files?.[0]
                if(!file) return
                try{
                  const form = new FormData()
                  form.append('image', file)
                  const res = await fetch('/api/profile/upload-photo', { method:'POST', headers: { 'Authorization': `Bearer ${session?.access_token}` }, body: form })
                  const data = await res.json()
                  if (!res.ok || !data.success) throw new Error(data.error||'Upload failed')
                  setPhotoUrl(data.url)
                  toast.success('Đã tải ảnh lên')
                }catch(err){ toast.error('Tải ảnh thất bại') }
              }} className="flex-1 border rounded-lg px-3 py-2" />
            </div>
          </div>
        )}

        <div className="mt-6 flex items-center justify-between">
          <button onClick={prev} disabled={step===1 || loading} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 disabled:opacity-50">Quay lại</button>
          <div className="flex items-center gap-2">
            {isEditing && (
              <button onClick={()=>router.push('/try-on')} disabled={loading} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700">Huỷ</button>
            )}
            {step<5 ? (
              <button onClick={next} disabled={loading} className="px-4 py-2 rounded-lg bg-amber-600 text-white hover:bg-amber-700">Tiếp</button>
            ) : (
              <button onClick={save} disabled={loading} className="px-4 py-2 rounded-lg bg-amber-600 text-white hover:bg-amber-700">Hoàn tất</button>
            )}
          </div>
        </div>

        {/* Style Picker Modal */}
        {showStylePicker && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50" onClick={()=>setShowStylePicker(false)}>
            <div className="bg-white rounded-xl p-5 w-full max-w-lg" onClick={(e)=>e.stopPropagation()}>
              <h3 className="font-semibold mb-3">Chọn phong cách</h3>
              <div className="grid grid-cols-2 gap-2 max-h-80 overflow-y-auto">
                {['casual','work','sport','streetwear','minimal','vintage','preppy','smart-casual','elegant','classic','y2k','korean','boho','athleisure'].map(k => (
                  <button key={k} onClick={()=>toggle(styles,k,setStyles)} className={`py-2 rounded-lg border text-sm ${styles.includes(k)?'border-amber-500 bg-amber-50':'border-gray-200 hover:bg-gray-50'}`}>{k}</button>
                ))}
              </div>
              <div className="mt-3 flex items-center gap-2">
                <input value={styleOther} onChange={e=>setStyleOther(e.target.value)} placeholder="Khác..." className="flex-1 border rounded-lg px-3 py-2" />
                <button onClick={()=>{ if(styleOther.trim()){ toggle(styles, styleOther.trim(), setStyles); setStyleOther('') } }} className="px-3 py-2 rounded-lg bg-amber-600 text-white">Thêm</button>
              </div>
              <div className="mt-4 text-right"><button onClick={()=>setShowStylePicker(false)} className="px-4 py-2 rounded-lg border">Đóng</button></div>
            </div>
          </div>
        )}

        {/* Occasion Picker Modal */}
        {showOccasionPicker && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50" onClick={()=>setShowOccasionPicker(false)}>
            <div className="bg-white rounded-xl p-5 w-full max-w-lg" onClick={(e)=>e.stopPropagation()}>
              <h3 className="font-semibold mb-3">Chọn dịp</h3>
              <div className="grid grid-cols-2 gap-2 max-h-80 overflow-y-auto">
                {['work','hangout','dating','travel','party','wedding','interview','gym','school','festival','photoshoot'].map(k => (
                  <button key={k} onClick={()=>toggle(occasions,k,setOccasions)} className={`py-2 rounded-lg border text-sm ${occasions.includes(k)?'border-amber-500 bg-amber-50':'border-gray-200 hover:bg-gray-50'}`}>{k}</button>
                ))}
              </div>
              <div className="mt-3 flex items-center gap-2">
                <input value={occasionOther} onChange={e=>setOccasionOther(e.target.value)} placeholder="Khác..." className="flex-1 border rounded-lg px-3 py-2" />
                <button onClick={()=>{ if(occasionOther.trim()){ toggle(occasions, occasionOther.trim(), setOccasions); setOccasionOther('') } }} className="px-3 py-2 rounded-lg bg-amber-600 text-white">Thêm</button>
              </div>
              <div className="mt-4 text-right"><button onClick={()=>setShowOccasionPicker(false)} className="px-4 py-2 rounded-lg border">Đóng</button></div>
            </div>
          </div>
        )}

        {/* Color Picker Modal */}
        {showColorPicker && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50" onClick={()=>setShowColorPicker(false)}>
            <div className="bg-white rounded-xl p-5 w-full max-w-md" onClick={(e)=>e.stopPropagation()}>
              <h3 className="font-semibold mb-3">Chọn màu yêu thích</h3>
              <div className="grid grid-cols-3 gap-2">
                {['black','white','gray','beige','brown','pastel','vivid','red','blue','green','yellow','pink','purple'].map(c => (
                  <button key={c} onClick={()=>toggle(colors,c,setColors)} className={`py-2 rounded-lg border text-sm ${colors.includes(c)?'border-amber-500 bg-amber-50':'border-gray-200 hover:bg-gray-50'}`}>{c}</button>
                ))}
              </div>
              <div className="mt-4 text-right"><button onClick={()=>setShowColorPicker(false)} className="px-4 py-2 rounded-lg border">Đóng</button></div>
            </div>
          </div>
        )}

        {/* Photo Guide Modal */}
        {showPhotoGuide && (
          <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4" onClick={()=>setShowPhotoGuide(false)}>
            <div className="w-[80vw] aspect-video bg-amber-50 rounded-lg overflow-hidden border border-amber-200" onClick={(e)=>e.stopPropagation()}>
              <img src="https://qriiosvdowitaigzvwfo.supabase.co/storage/v1/object/public/Linh%20Tinh/1758378024766t6sh54kr.webp" alt="Model guide" className="w-full h-full object-cover" />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}


