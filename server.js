import express from 'express'
import cors from 'cors'
import admin from 'firebase-admin'
import dotenv from 'dotenv'
import TelegramBot from 'node-telegram-bot-api'
import axios from 'axios'

dotenv.config()

// ═══════════════════════════════════════════════════════════════════
// FIREBASE SETUP
// ═══════════════════════════════════════════════════════════════════
if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_PRIVATE_KEY || !process.env.FIREBASE_CLIENT_EMAIL) {
  console.error('❌ .env da FIREBASE_* o\'zgaruvchilar topilmadi!')
  process.exit(1)
}

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  }),
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
})
const db      = admin.firestore()
const bucket  = admin.storage().bucket()

// ═══════════════════════════════════════════════════════════════════
// BOT SETUP
// ═══════════════════════════════════════════════════════════════════
const BOT_TOKEN    = process.env.TELEGRAM_BOT_TOKEN
const MINI_APP_URL = process.env.TELEGRAM_MINI_APP_URL || 'http://localhost:5173'
const BACKEND_URL  = process.env.BACKEND_URL || 'http://localhost:3000'
const BOT_USERNAME = process.env.BOT_USERNAME || 'Zoya_app_bot'

const bot = new TelegramBot(BOT_TOKEN, { polling: true })
console.log('🤖 ZOYA Bot ishga tushdi...')

// /start
bot.onText(/\/start(.*)/, (msg, match) => {
  const chatId    = msg.chat.id
  const firstName = msg.from.first_name || 'Foydalanuvchi'
  const param     = (match[1] || '').trim()

  if (param.startsWith('item_')) {
    const itemId  = param.replace('item_', '')
    const itemUrl = `${MINI_APP_URL}/listing/${itemId}`
    return bot.sendMessage(chatId, `👗 E'lonni ko'rish uchun quyidagi tugmani bosing:`, {
      reply_markup: { inline_keyboard: [[{ text: "🛍️ ZOYA da ko'rish", web_app: { url: itemUrl } }]] }
    })
  }
  bot.sendMessage(chatId,
    `Salom ${firstName}! 👋\n\nZOYA kiyim almashish platformasiga xush kelibsiz!\n\n📱 Telefon raqamingizni ulang — shunda ilovadagi akkauntingiz bot bilan bog'lanadi.`,
    { reply_markup: { keyboard: [[{ text: '📱 Telefon raqamimni ulash', request_contact: true }]], one_time_keyboard: true, resize_keyboard: true } }
  )
})

// Contact
bot.on('contact', async (msg) => {
  const chatId      = msg.chat.id
  const phoneNumber = msg.contact.phone_number
  const telegramId  = msg.from.id.toString()
  const firstName   = msg.from.first_name || ''
  const lastName    = msg.from.last_name || ''
  const username    = msg.from.username || ''
  console.log(`\n📞 Contact: ${phoneNumber} TG:${telegramId}`)
  try {
    const response = await axios.post(`${BACKEND_URL}/api/auth/telegram-login`, { phoneNumber, telegramId, firstName, lastName, username })
    const { user } = response.data
    await bot.sendMessage(chatId, '✅ Akkauntingiz topildi!', { reply_markup: { remove_keyboard: true } })
    bot.sendMessage(chatId,
      `👤 ${user.fullName}\n📱 ${user.phoneNumber}\n💰 Balans: ${user.balance?.coins || 0} koin\n\nEndi Mini App dan foydalanishingiz mumkin!`,
      { reply_markup: { inline_keyboard: [[{ text: '🛍️ ZOYA Mini App', web_app: { url: MINI_APP_URL } }]] } }
    )
  } catch (error) {
    const status  = error.response?.status
    const message = error.response?.data?.error || error.message
    console.error(`❌ telegram-login error ${status}: ${message}`)
    if (status === 404) {
      bot.sendMessage(chatId, `❌ Bu raqam ZOYA ilovasida topilmadi.\n\nAvval ilovani yuklab, ro'yxatdan o'ting:\n👉 @zoya_app`, { reply_markup: { remove_keyboard: true } })
    } else {
      bot.sendMessage(chatId, `❌ Xato yuz berdi. Qaytadan urinib ko'ring: /start`)
    }
  }
})

// Inline query
bot.on('inline_query', async (query) => {
  const queryText = query.query.trim()
  try {
    const response = await axios.get(`${BACKEND_URL}/api/listings`, { params: { search: queryText || '', limit: 20 } })
    const listings = response.data.listings || []
    const results = listings.map(item => {
      const image     = item.images?.[0] || null
      const price     = (item.coinPrice || 0).toLocaleString()
      const condition = item.condition === 'new' ? '🆕 Yangi' : item.condition === 'like_new' ? '✨ Yangiday' : '👕 Ishlatilgan'
      const size      = item.size ? `  📐 ${item.size}` : ''
      const miniAppUrl = `${MINI_APP_URL}/listing/${item.id}`
      const caption = `👗 *${item.title}*\n\n💰 Narxi: *${price} koin*\n${condition}${size}\n👤 Sotuvchi: ${item.userName || "Noma'lum"}`
      const keyboard = { inline_keyboard: [[{ text: "🛍️ ZOYA da ochish", url: miniAppUrl }]] }
      const isValidUrl = image && image.startsWith('http')
      if (isValidUrl) {
        return { type: 'photo', id: item.id, photo_url: image, thumb_url: image, photo_width: 800, photo_height: 800, title: item.title, caption, parse_mode: 'Markdown', reply_markup: keyboard }
      } else {
        return { type: 'article', id: item.id, title: `${item.title} — ${price} koin`, description: `${condition}${size}`, input_message_content: { message_text: caption, parse_mode: 'Markdown' }, reply_markup: keyboard }
      }
    })
    console.log(`🔍 Inline: "${queryText}" → ${results.length} ta natija`)
    await bot.answerInlineQuery(query.id, results, { cache_time: 0, is_personal: true })
  } catch (error) {
    console.error('inline_query error:', error.message)
    await bot.answerInlineQuery(query.id, [], { cache_time: 5 })
  }
})

// /profile
bot.onText(/\/profile/, async (msg) => {
  const chatId = msg.chat.id
  const telegramId = msg.from.id.toString()
  try {
    const response = await axios.post(`${BACKEND_URL}/api/user-profile`, { initData: `user=${JSON.stringify({ id: parseInt(telegramId) })}` })
    const { user } = response.data
    bot.sendMessage(chatId,
      `👤 ${user.fullName}\n📱 ${user.phoneNumber}\n💰 ${user.balance?.coins || 0} koin\n⭐ Reyting: ${user.stats?.rating || 0}`,
      { reply_markup: { inline_keyboard: [[{ text: '🛍️ Mini App', web_app: { url: MINI_APP_URL } }]] } }
    )
  } catch { bot.sendMessage(chatId, '❌ Profil topilmadi. /start bosing.') }
})

bot.onText(/\/help/, (msg) => {
  bot.sendMessage(msg.chat.id, `/start — Boshlash\n/profile — Profilim\n/help — Yordam`,
    { reply_markup: { inline_keyboard: [[{ text: '🛍️ Mini App', web_app: { url: MINI_APP_URL } }]] } }
  )
})

bot.on('message', (msg) => {
  if (msg.contact || msg.text?.startsWith('/')) return
  bot.sendMessage(msg.chat.id, 'Boshlash uchun /start yozing.')
})

bot.on('polling_error', (error) => { console.error('🔴 Polling xatosi:', error.message) })

// ═══════════════════════════════════════════════════════════════════
// EXPRESS SETUP
// ═══════════════════════════════════════════════════════════════════
const app = express()
app.use(cors())
app.use(express.json({ limit: '20mb' }))
app.use(express.urlencoded({ limit: '20mb', extended: true }))
const PORT = process.env.PORT || 3000

// ═══════════════════════════════════════════════════════════════════
// HELPER: base64 rasmni Firebase Storage ga yuklash
// ═══════════════════════════════════════════════════════════════════
async function uploadBase64Image(base64String, uid, filename) {
  // base64 dan buffer olish
  const matches = base64String.match(/^data:([A-Za-z-+/]+);base64,(.+)$/)
  if (!matches) throw new Error('Noto\'g\'ri rasm formati')

  const mimeType  = matches[1]
  const imageData = Buffer.from(matches[2], 'base64')
  const ext       = mimeType.includes('png') ? 'png' : 'jpg'
  const filePath  = `items/${uid}/${filename}.${ext}`

  const file = bucket.file(filePath)
  await file.save(imageData, {
    metadata: { contentType: mimeType },
    resumable: false,
  })

  // Public URL olish
  await file.makePublic()
  const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`
  return publicUrl
}

// ═══════════════════════════════════════════════════════════════════
// HELPER: Telegram bildirishnoma yuborish
// ═══════════════════════════════════════════════════════════════════
const TG_TOKEN   = process.env.TELEGRAM_BOT_TOKEN
const MINI_APP_URL = process.env.TELEGRAM_MINI_APP_URL || 'http://localhost:5173'

async function notify(telegramId, text, buttons = [], saveToFirestore = true) {
  if (!telegramId) return
  try {
    // 1. Telegram xabar yuborish
    if (TG_TOKEN) {
      const body = { chat_id: telegramId, text, parse_mode: 'Markdown' }
      if (buttons.length > 0) body.reply_markup = { inline_keyboard: [buttons] }
      await fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
    }

    // 2. Firestore ga saqlash (Mini App da ko'rinsin)
    if (saveToFirestore) {
      const userSnap = await db.collection('users').where('telegramId', '==', telegramId).limit(1).get()
      if (!userSnap.empty) {
        const uid = userSnap.docs[0].data().uid
        // Markdown belgilerini tozalash
        const cleanText = text.replace(/\*/g, '').replace(/\n/g, ' ').trim()
        await db.collection('notifications').add({
          userId:    uid,
          telegramId,
          message:   cleanText,
          rawText:   text,
          isRead:    false,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        })
      }
    }
  } catch (e) {
    console.error('notify error:', e.message)
  }
}

// telegramId ni uid orqali olish
async function getTelegramIdByUid(uid) {
  const snap = await db.collection('users').where('uid', '==', uid).limit(1).get()
  if (snap.empty) return null
  return snap.docs[0].data().telegramId || null
}

// ═══════════════════════════════════════════════════════════════════
// HELPER: telefon raqamni normalize qilish
// ═══════════════════════════════════════════════════════════════════
function normalizePhone(phone) {
  if (!phone) return null
  phone = phone.toString().trim()
  if (!phone.startsWith('+')) {
    phone = '+998' + phone.slice(-9)
  }
  return phone
}

// ═══════════════════════════════════════════════════════════════════
// HELPER: initData dan telegramId olish (Mini App)
// ═══════════════════════════════════════════════════════════════════
function getTelegramIdFromInitData(initData) {
  try {
    if (!initData) return null
    const params = new URLSearchParams(initData)
    const user = JSON.parse(params.get('user') || '{}')
    return user.id ? user.id.toString() : null
  } catch {
    return null
  }
}

// ═══════════════════════════════════════════════════════════════════
// 1. TELEGRAM LOGIN
//    Ikki rejim:
//    A) Bot → phoneNumber + telegramId yuboradi (birinchi bog'lash)
//    B) Mini App → initData yuboradi (har ochilganda)
// ═══════════════════════════════════════════════════════════════════
app.post('/api/auth/telegram-login', async (req, res) => {
  try {
    const { phoneNumber, telegramId: rawTgId, firstName, lastName, username, initData } = req.body

    console.log(`\n📲 TELEGRAM LOGIN`)

    let tgId = null
    let snapshot = null

    // ── REJIM B: Mini App initData bilan keldi ──────────────────────
    if (initData && !phoneNumber) {
      tgId = getTelegramIdFromInitData(initData)
      console.log(`   Rejim: Mini App`)
      console.log(`   TG ID: ${tgId}`)

      if (!tgId) {
        return res.status(400).json({ success: false, error: 'initData noto\'g\'ri' })
      }

      // telegramId bo'yicha qidirish
      snapshot = await db
        .collection('users')
        .where('telegramId', '==', tgId)
        .limit(1)
        .get()

      if (snapshot.empty) {
        console.log(`   ❌ telegramId topilmadi — bot orqali bog'lash kerak`)
        return res.status(404).json({
          success: false,
          requiresBotLink: true,
          error: 'Akkauntingiz bog\'lanmagan. Botda /start bosib, telefon raqamingizni ulang.'
        })
      }

      const userDoc = snapshot.docs[0]
      const userData = userDoc.data()
      console.log(`   ✅ User topildi: ${userData.fullName}`)

      return res.json({
        success: true,
        user: {
          uid: userData.uid,
          zoyaId: userData.zoyaId,
          fullName: userData.fullName,
          phoneNumber: userData.phoneNumber,
          telegramId: tgId,
          avatar: userData.avatar || '',
          balance: userData.balance,
          stats: userData.stats,
          isVerified: userData.isVerified,
          preferences: userData.preferences,
        }
      })
    }

    // ── REJIM A: Bot phoneNumber + telegramId bilan keldi ───────────
    console.log(`   Rejim: Bot (telefon bog'lash)`)
    console.log(`   Phone: ${phoneNumber}`)
    console.log(`   TG ID: ${rawTgId}`)

    if (!phoneNumber) {
      return res.status(400).json({ success: false, error: 'phoneNumber kerak' })
    }
    if (!rawTgId) {
      return res.status(400).json({ success: false, error: 'telegramId kerak' })
    }

    const normalizedPhone = normalizePhone(phoneNumber)
    tgId = rawTgId.toString()

    console.log(`   Normalized: ${normalizedPhone}`)

    snapshot = await db
      .collection('users')
      .where('phoneNumber', '==', normalizedPhone)
      .limit(1)
      .get()

    if (snapshot.empty) {
      console.log(`   ❌ User topilmadi: ${normalizedPhone}`)
      return res.status(404).json({
        success: false,
        requiresAppRegistration: true,
        error: 'Bu raqam ilovada ro\'yxatdan o\'tmagan. Avval ZOYA ilovasini yuklab, ro\'yxatdan o\'ting.'
      })
    }

    const userDoc = snapshot.docs[0]
    const userData = userDoc.data()

    console.log(`   ✅ User topildi: ${userData.fullName} (${userDoc.id})`)
    console.log(`   Avvalgi telegramId: ${userData.telegramId || 'yo\'q'}`)

    // telegramId ni yangilash (agar yo'q bo'lsa yoki boshqa bo'lsa)
    const needsUpdate = !userData.telegramId || userData.telegramId !== tgId

    if (needsUpdate) {
      await userDoc.ref.update({
        telegramId: tgId,
        telegramUsername: username || '',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        // loginMethods ga 'telegram' qo'shish (agar yo'q bo'lsa)
        loginMethods: admin.firestore.FieldValue.arrayUnion('telegram')
      })
      console.log(`   ✅ telegramId saqlandi: ${tgId}`)
    } else {
      console.log(`   ℹ️  telegramId allaqachon to'g'ri`)
    }

    // Yangilangan ma'lumotlarni qaytarish
    const updatedData = needsUpdate
      ? { ...userData, telegramId: tgId, telegramUsername: username || '' }
      : userData

    return res.json({
      success: true,
      isNewTelegramLink: needsUpdate,
      user: {
        uid: updatedData.uid,
        zoyaId: updatedData.zoyaId,
        fullName: updatedData.fullName,
        phoneNumber: updatedData.phoneNumber,
        telegramId: tgId,
        avatar: updatedData.avatar || '',
        balance: updatedData.balance,
        stats: updatedData.stats,
        isVerified: updatedData.isVerified,
        preferences: updatedData.preferences,
      }
    })

  } catch (error) {
    console.error('❌ telegram-login error:', error.message)
    res.status(500).json({ success: false, error: error.message })
  }
})

// ═══════════════════════════════════════════════════════════════════
// 2. USER PROFIL — telegramId bo'yicha (Mini App ochilganda)
// ═══════════════════════════════════════════════════════════════════
app.post('/api/user-profile', async (req, res) => {
  try {
    const { initData } = req.body
    const telegramId = getTelegramIdFromInitData(initData)

    console.log(`\n👤 USER PROFILE — TG ID: ${telegramId}`)

    if (!telegramId) {
      return res.status(400).json({ success: false, error: 'initData yoki telegramId kerak' })
    }

    const snapshot = await db
      .collection('users')
      .where('telegramId', '==', telegramId)
      .limit(1)
      .get()

    if (snapshot.empty) {
      console.log(`   ❌ User topilmadi (telegramId: ${telegramId})`)
      return res.status(404).json({
        success: false,
        requiresPhone: true,
        error: 'Telegram akkauntingiz bog\'lanmagan. Botda /start bosing.'
      })
    }

    const userData = snapshot.docs[0].data()
    console.log(`   ✅ ${userData.fullName}`)

    res.json({ success: true, user: userData })

  } catch (error) {
    console.error('❌ user-profile error:', error.message)
    res.status(500).json({ success: false, error: error.message })
  }
})

// ═══════════════════════════════════════════════════════════════════
// 3. E'LONLAR — barcha active
// ═══════════════════════════════════════════════════════════════════
app.get('/api/listings', async (req, res) => {
  try {
    const { category, gender, search, limit = 20 } = req.query

    let query = db.collection('items').where('status', '==', 'active')

    if (category) query = query.where('category', '==', category)
    if (gender) query = query.where('gender', '==', gender)

    const snapshot = await query.limit(parseInt(limit) * 3).get()
    let listings = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))

    // Qidiruv — title va description bo'yicha (case-insensitive)
    if (search) {
      const q = search.toLowerCase()
      listings = listings.filter(l =>
        l.title?.toLowerCase().includes(q) ||
        l.description?.toLowerCase().includes(q) ||
        l.category?.toLowerCase().includes(q)
      ).slice(0, parseInt(limit))
    } else {
      listings = listings.slice(0, parseInt(limit))
    }

    console.log(`📋 GET /api/listings${search ? ` [${search}]` : ''} — ${listings.length} ta`)
    res.json({ success: true, listings })

  } catch (error) {
    console.error('❌ listings error:', error.message)
    res.status(500).json({ success: false, error: error.message })
  }
})

// ═══════════════════════════════════════════════════════════════════
// 4. BITTA E'LON
// ═══════════════════════════════════════════════════════════════════
app.get('/api/listings/:id', async (req, res) => {
  try {
    const doc = await db.collection('items').doc(req.params.id).get()

    if (!doc.exists) {
      return res.status(404).json({ success: false, error: 'E\'lon topilmadi' })
    }

    res.json({ success: true, listing: { id: doc.id, ...doc.data() } })

  } catch (error) {
    console.error('❌ listing/:id error:', error.message)
    res.status(500).json({ success: false, error: error.message })
  }
})

// ═══════════════════════════════════════════════════════════════════
// 5. YANGI E'LON JOYLASH
// ═══════════════════════════════════════════════════════════════════
app.post('/api/listings', async (req, res) => {
  try {
    const { initData, title, description, category, coinPrice, images, size, condition, gender } = req.body
    const telegramId = getTelegramIdFromInitData(initData)

    console.log(`\n📝 POST /api/listings — TG ID: ${telegramId}`)

    if (!telegramId) {
      return res.status(401).json({ success: false, error: 'Avtorizatsiya kerak' })
    }
    if (!title || !coinPrice) {
      return res.status(400).json({ success: false, error: 'title va coinPrice kerak' })
    }

    // Userni topish
    const userSnap = await db
      .collection('users')
      .where('telegramId', '==', telegramId)
      .limit(1)
      .get()

    if (userSnap.empty) {
      return res.status(401).json({ success: false, error: 'User topilmadi' })
    }

    const userData = userSnap.docs[0].data()

    // Rasmlarni Firebase Storage ga yuklash
    let imageUrls = []
    if (images && images.length > 0) {
      const timestamp = Date.now()
      imageUrls = await Promise.all(
        images.map((img, i) => {
          // Agar allaqachon URL bo'lsa (http) — to'g'ridan ishlatish
          if (img.startsWith('http')) return Promise.resolve(img)
          return uploadBase64Image(img, userData.uid, `${timestamp}_${i}`)
        })
      )
      console.log(`   📸 ${imageUrls.length} ta rasm Storage ga yuklandi`)
    }

    // E'lon yaratish
    const docRef = await db.collection('items').add({
      telegramId,
      phoneNumber: userData.phoneNumber,
      uid: userData.uid,
      userId: userData.uid,
      userName: userData.fullName,
      userAvatar: userData.avatar || '',
      title: title.trim(),
      description: description?.trim() || '',
      category: category || 'Libos',
      coinPrice: parseInt(coinPrice),
      images: imageUrls,
      size: size || '',
      condition: condition || 'Yaxshi',
      gender: gender || 'women',
      status: 'active',
      likes: 0,
      likedBy: [],
      views: 0,
      source: 'telegram_miniapp',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    })

    // User stats yangilash
    await userSnap.docs[0].ref.update({
      'stats.totalListings': admin.firestore.FieldValue.increment(1),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    })

    console.log(`   ✅ E'lon yaratildi: ${docRef.id}`)
    res.json({ success: true, id: docRef.id, message: 'E\'lon muvaffaqiyatli joylashtirildi!' })

  } catch (error) {
    console.error('❌ post listing error:', error.message)
    res.status(500).json({ success: false, error: error.message })
  }
})

// ═══════════════════════════════════════════════════════════════════
// 6. E'LONNI O'CHIRISH
// ═══════════════════════════════════════════════════════════════════
app.delete('/api/listings/:id', async (req, res) => {
  try {
    const { initData } = req.body
    const telegramId = getTelegramIdFromInitData(initData)

    if (!telegramId) {
      return res.status(401).json({ success: false, error: 'Avtorizatsiya kerak' })
    }

    const doc = await db.collection('items').doc(req.params.id).get()
    if (!doc.exists) {
      return res.status(404).json({ success: false, error: 'E\'lon topilmadi' })
    }

    const listing = doc.data()

    // Faqat o'z e'lonini o'chira oladi
    if (listing.telegramId !== telegramId) {
      return res.status(403).json({ success: false, error: 'Bu e\'lon sizga tegishli emas' })
    }

    await doc.ref.delete()

    // User stats yangilash
    const userSnap = await db.collection('users').where('telegramId', '==', telegramId).limit(1).get()
    if (!userSnap.empty) {
      await userSnap.docs[0].ref.update({
        'stats.totalListings': admin.firestore.FieldValue.increment(-1),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      })
    }

    console.log(`   ✅ E'lon o'chirildi: ${req.params.id}`)
    res.json({ success: true, message: 'E\'lon o\'chirildi' })

  } catch (error) {
    console.error('❌ delete listing error:', error.message)
    res.status(500).json({ success: false, error: error.message })
  }
})

// ═══════════════════════════════════════════════════════════════════
// 7. FOYDALANUVCHI E'LONLARI
// ═══════════════════════════════════════════════════════════════════
app.post('/api/user-listings', async (req, res) => {
  try {
    const { initData } = req.body
    const telegramId = getTelegramIdFromInitData(initData)

    if (!telegramId) {
      return res.status(401).json({ success: false, error: 'Avtorizatsiya kerak' })
    }

    // telegramId → uid (items da userId maydoni bor)
    const userSnap = await db
      .collection('users')
      .where('telegramId', '==', telegramId)
      .limit(1)
      .get()

    if (userSnap.empty) {
      return res.status(404).json({ success: false, error: 'User topilmadi' })
    }

    const uid = userSnap.docs[0].data().uid

    const snapshot = await db
      .collection('items')
      .where('userId', '==', uid)
      .orderBy('createdAt', 'desc')
      .get()

    const listings = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    console.log(`📋 user-listings — ${listings.length} ta (uid: ${uid})`)

    res.json({ success: true, listings })

  } catch (error) {
    console.error('❌ user-listings error:', error.message)
    res.status(500).json({ success: false, error: error.message })
  }
})

// ═══════════════════════════════════════════════════════════════════
// 8. BILDIRISHNOMALAR
// ═══════════════════════════════════════════════════════════════════
app.post('/api/notifications', async (req, res) => {
  try {
    const { initData } = req.body
    const telegramId = getTelegramIdFromInitData(initData)
    if (!telegramId) return res.status(401).json({ success: false, error: 'Avtorizatsiya kerak' })

    const snapshot = await db.collection('notifications')
      .where('telegramId', '==', telegramId)
      .get()
      .catch(() => ({ docs: [] }))

    const notifications = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
      .slice(0, 30)

    const unreadCount = notifications.filter(n => !n.isRead).length

    res.json({ success: true, notifications, unreadCount })
  } catch (error) {
    console.error('❌ notifications error:', error.message)
    res.status(500).json({ success: false, error: error.message })
  }
})

// Bildirishnomani o'qildi deb belgilash
app.post('/api/notifications/read', async (req, res) => {
  try {
    const { initData, notificationId } = req.body
    const telegramId = getTelegramIdFromInitData(initData)
    if (!telegramId) return res.status(401).json({ success: false, error: 'Avtorizatsiya kerak' })

    if (notificationId) {
      // Bitta o'qildi
      await db.collection('notifications').doc(notificationId).update({ isRead: true })
    } else {
      // Hammasini o'qildi
      const snap = await db.collection('notifications').where('telegramId', '==', telegramId).where('isRead', '==', false).get()
      const batch = db.batch()
      snap.docs.forEach(doc => batch.update(doc.ref, { isRead: true }))
      await batch.commit()
    }
    res.json({ success: true })
  } catch (e) {
    res.status(500).json({ success: false, error: e.message })
  }
})

// ═══════════════════════════════════════════════════════════════════
// 9. TAKLIFLAR — uch tur, ikki rol (sotuvchi + xaridor):
//
//  "Narx" tab:
//    - Sotuvchi: offers da sellerId==uid, status:'pending' → qabul/rad qiladi
//    - Xaridor:  offers da buyerId==uid, status:'pending'|'accepted' → ko'radi va 'accepted' bo'lsa sotib oladi
//
//  "Sotish" tab:
//    - Sotuvchi: orders da sellerId==uid, status:'pending_seller' → tasdiqlaydi
//    - Xaridor:  orders da buyerId==uid, status:'in_delivery' → "Qabul qildim" bosadi
//
//  "Almashinuv" tab:
//    - Ikki tomon: swaps da toUserId==uid YOKI fromUserId==uid, status:'pending'
// ═══════════════════════════════════════════════════════════════════
app.post('/api/offers', async (req, res) => {
  try {
    const { initData } = req.body
    const telegramId = getTelegramIdFromInitData(initData)

    if (!telegramId) {
      return res.status(401).json({ success: false, error: 'Avtorizatsiya kerak' })
    }

    const userSnap = await db
      .collection('users')
      .where('telegramId', '==', telegramId)
      .limit(1)
      .get()

    if (userSnap.empty) {
      return res.status(404).json({ success: false, error: 'User topilmadi' })
    }

    const uid = userSnap.docs[0].data().uid
    console.log(`\n📨 OFFERS — telegramId: ${telegramId}, uid: ${uid}`)

    // Oltita so'rovni parallel yuboramiz
    const [
      offerAsSellerSnap,  // Narx: menga kelgan takliflar (sotuvchi)
      offerAsBuyerSnap,   // Narx: men yuborgan takliflar (xaridor)
      orderAsSellerSnap,  // Sotish: mening buyurtmalarim (sotuvchi)
      orderAsBuyerSnap,   // Sotish: men bergan buyurtmalarim (xaridor)
      swapsToSnap,        // Almashinuv: menga kelgan
      swapsFromSnap,      // Almashinuv: men yuborgan
    ] = await Promise.all([

      db.collection('offers').where('sellerId', '==', uid).get()
        .catch(e => { console.error('offerAsSeller error:', e.message); return { docs: [] } }),

      db.collection('offers').where('buyerId', '==', uid).get()
        .catch(e => { console.error('offerAsBuyer error:', e.message); return { docs: [] } }),

      db.collection('orders').where('sellerId', '==', uid).get()
        .catch(e => { console.error('orderAsSeller error:', e.message); return { docs: [] } }),

      db.collection('orders').where('buyerId', '==', uid).get()
        .catch(e => { console.error('orderAsBuyer error:', e.message); return { docs: [] } }),

      db.collection('swaps').where('toUserId', '==', uid).get()
        .catch(e => { console.error('swaps-to error:', e.message); return { docs: [] } }),

      db.collection('swaps').where('fromUserId', '==', uid).get()
        .catch(e => { console.error('swaps-from error:', e.message); return { docs: [] } }),
    ])

    console.log(`   DB natijalar — offerSeller:${offerAsSellerSnap.docs?.length} offerBuyer:${offerAsBuyerSnap.docs?.length} orderSeller:${orderAsSellerSnap.docs?.length} orderBuyer:${orderAsBuyerSnap.docs?.length} swapsTo:${swapsToSnap.docs?.length} swapsFrom:${swapsFromSnap.docs?.length}`)

    const sortByDate = (a, b) => {
      const at = a.createdAt?.seconds || 0
      const bt = b.createdAt?.seconds || 0
      return bt - at
    }

    // Faol va tarix statuslar
    const ACTIVE_OFFER  = ['pending', 'accepted']
    const ACTIVE_ORDER  = ['pending_seller', 'pending', 'in_delivery']
    const ACTIVE_SWAP   = ['pending']
    const HISTORY_OFFER = ['declined', 'expired', 'purchased']
    const HISTORY_ORDER = ['completed', 'cancelled', 'disputed']
    const HISTORY_SWAP  = ['accepted', 'declined', 'cancelled']

    // NARX TAKLIFLARI
    const seenOffers = new Set()
    const allPriceOffers = [
      ...offerAsSellerSnap.docs.map(d => ({ id: d.id, _myRole: 'seller', ...d.data() })),
      ...offerAsBuyerSnap.docs.map(d => ({ id: d.id, _myRole: 'buyer', ...d.data() })),
    ].filter(d => { if (seenOffers.has(d.id)) return false; seenOffers.add(d.id); return true })
     .sort(sortByDate).slice(0, 50)

    const priceOffers        = allPriceOffers.filter(d => ACTIVE_OFFER.includes(d.status))
    const priceOffersHistory = allPriceOffers.filter(d => HISTORY_OFFER.includes(d.status))

    // SOTISH BUYURTMALARI
    const seenOrders = new Set()
    const allSaleOrders = [
      ...orderAsSellerSnap.docs.map(d => ({ id: d.id, _myRole: 'seller', ...d.data() })),
      ...orderAsBuyerSnap.docs.map(d => ({ id: d.id, _myRole: 'buyer', ...d.data() })),
    ].filter(d => { if (seenOrders.has(d.id)) return false; seenOrders.add(d.id); return true })
     .sort(sortByDate).slice(0, 50)

    const saleOrders        = allSaleOrders.filter(d => ACTIVE_ORDER.includes(d.status))
    const saleOrdersHistory = allSaleOrders.filter(d => HISTORY_ORDER.includes(d.status))

    // ALMASHINUV
    const seenSwaps = new Set()
    const allExchanges = [...swapsToSnap.docs, ...swapsFromSnap.docs]
      .filter(d => { if (seenSwaps.has(d.id)) return false; seenSwaps.add(d.id); return true })
      .map(d => ({ id: d.id, _myRole: d.data().toUserId === uid ? 'receiver' : 'sender', ...d.data() }))
      .sort(sortByDate).slice(0, 50)

    const exchanges        = allExchanges.filter(d => ACTIVE_SWAP.includes(d.status))
    const exchangesHistory = allExchanges.filter(d => HISTORY_SWAP.includes(d.status))

    console.log(`   faol — narx:${priceOffers.length} sotish:${saleOrders.length} almashinuv:${exchanges.length}`)
    console.log(`   tarix — narx:${priceOffersHistory.length} sotish:${saleOrdersHistory.length} almashinuv:${exchangesHistory.length}`)

    res.json({
      success: true,
      counts: {
        exchange: exchanges.length,
        sale:     saleOrders.length,
        price:    priceOffers.length,
        total:    exchanges.length + saleOrders.length + priceOffers.length,
      },
      data: {
        priceOffers, saleOrders, exchanges,
        history: { priceOffers: priceOffersHistory, saleOrders: saleOrdersHistory, exchanges: exchangesHistory }
      }
    })
  } catch (error) {
    console.error('❌ offers error:', error.message)
    res.json({
      success: true,
      counts: { exchange: 0, sale: 0, price: 0, total: 0 },
      data: { priceOffers: [], saleOrders: [], exchanges: [] }
    })
  }
})

// ═══════════════════════════════════════════════════════════════════
// 10. SOTIB OLISH
// ═══════════════════════════════════════════════════════════════════
app.post('/api/orders', async (req, res) => {
  try {
    const { initData, itemId } = req.body
    const telegramId = getTelegramIdFromInitData(initData)
    if (!telegramId) return res.status(401).json({ success: false, error: 'Avtorizatsiya kerak' })

    const buyerSnap = await db.collection('users').where('telegramId', '==', telegramId).limit(1).get()
    if (buyerSnap.empty) return res.status(404).json({ success: false, error: 'User topilmadi' })
    const buyer = buyerSnap.docs[0].data()

    const itemDoc = await db.collection('items').doc(itemId).get()
    if (!itemDoc.exists) return res.status(404).json({ success: false, error: "E'lon topilmadi" })
    const item = itemDoc.data()

    const itemOwnerId = item.userId || item.uid
    if (itemOwnerId === buyer.uid) return res.status(400).json({ success: false, error: "O'z e'lonini sotib bo'lmaydi" })

    const coins = buyer.balance?.coins ?? 0
    if (coins < item.coinPrice) return res.status(400).json({ success: false, error: `Balansingiz yetarli emas. Kerak: ${item.coinPrice}, mavjud: ${coins}` })

    const sellerSnap = await db.collection('users').where('uid', '==', itemOwnerId).limit(1).get()
    const seller = sellerSnap.empty ? { fullName: "Noma'lum" } : sellerSnap.docs[0].data()

    const orderRef = await db.collection('orders').add({
      itemId, itemTitle: item.title, itemImages: item.images || [],
      itemCoinPrice: item.coinPrice,
      buyerId: buyer.uid, buyerName: buyer.fullName,
      sellerId: itemOwnerId, sellerName: seller.fullName,
      status: 'pending', deliveryMethod: 'meetup',
      isOfferOrder: false, offerPrice: null,
      escrowCoins: item.coinPrice,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    })

    await buyerSnap.docs[0].ref.update({
      'balance.coins': admin.firestore.FieldValue.increment(-item.coinPrice),
      'balance.escrow': admin.firestore.FieldValue.increment(item.coinPrice),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    })
    await itemDoc.ref.update({ status: 'reserved', updatedAt: admin.firestore.FieldValue.serverTimestamp() })

    console.log('Order yaratildi:', orderRef.id)
    // Sotuvchiga bildirishnoma
    const sellerTgForOrder = seller.telegramId || await getTelegramIdByUid(itemOwnerId)
    await notify(sellerTgForOrder,
      `🛍️ *Yangi buyurtma keldi!*\n\n` +
      `🏷️ Mahsulot: *${item.title}*\n` +
      `💰 Narx: *${item.coinPrice.toLocaleString()} koin*\n` +
      `👤 Xaridor: *${buyer.fullName}*\n\n` +
      `✅ Tasdiqlang va mahsulotni jo'nating!`,
      [{ text: "📦 Buyurtmani ko'rish", url: `${MINI_APP_URL}/offers/sale` }]
    )
    res.json({ success: true, orderId: orderRef.id, message: 'Buyurtma muvaffaqiyatli yuborildi!' })
  } catch (error) {
    console.error('order error:', error.message)
    res.status(500).json({ success: false, error: error.message })
  }
})

// ═══════════════════════════════════════════════════════════════════
// 11. ALMASHISH TAKLIFI
// ═══════════════════════════════════════════════════════════════════
app.post('/api/swaps', async (req, res) => {
  try {
    const { initData, toItemId, fromItemId, addCoins = 0 } = req.body
    const telegramId = getTelegramIdFromInitData(initData)
    if (!telegramId) return res.status(401).json({ success: false, error: 'Avtorizatsiya kerak' })

    const fromSnap = await db.collection('users').where('telegramId', '==', telegramId).limit(1).get()
    if (fromSnap.empty) return res.status(404).json({ success: false, error: 'User topilmadi' })
    const fromUser = fromSnap.docs[0].data()

    const [toItemDoc, fromItemDoc] = await Promise.all([
      db.collection('items').doc(toItemId).get(),
      db.collection('items').doc(fromItemId).get(),
    ])
    if (!toItemDoc.exists)   return res.status(404).json({ success: false, error: "Almashish so'ralgan e'lon topilmadi" })
    if (!fromItemDoc.exists) return res.status(404).json({ success: false, error: "O'z e'loningiz topilmadi" })

    const toItem = toItemDoc.data(), fromItem = fromItemDoc.data()
    const toItemOwnerId = toItem.userId || toItem.uid
    if (toItemOwnerId === fromUser.uid)   return res.status(400).json({ success: false, error: "O'z e'loni bilan almashib bo'lmaydi" })
    if (fromItem.userId !== fromUser.uid && fromItem.uid !== fromUser.uid) return res.status(400).json({ success: false, error: "Bu e'lon sizga tegishli emas" })

    const toSnap = await db.collection('users').where('uid', '==', toItemOwnerId).limit(1).get()
    const toUser = toSnap.empty ? { uid: toItemOwnerId, fullName: "Noma'lum" } : toSnap.docs[0].data()

    const priceDiff = (fromItem.coinPrice || 0) - (toItem.coinPrice || 0)
    const coinDifference = Math.abs(priceDiff) + (addCoins || 0)
    const payingUserId = priceDiff < 0 ? fromUser.uid : toUser.uid

    const swapRef = await db.collection('swaps').add({
      fromUserId: fromUser.uid, fromUserName: fromUser.fullName,
      fromItemId, fromItemTitle: fromItem.title,
      fromItemImages: fromItem.images || [], fromItemCoinValue: fromItem.coinPrice || 0,
      fromUserConfirmed: false,
      toUserId: toUser.uid, toUserName: toUser.fullName,
      toItemId, toItemTitle: toItem.title,
      toItemImages: toItem.images || [], toItemCoinValue: toItem.coinPrice || 0,
      toUserConfirmed: false,
      coinDifference, payingUserId,
      status: 'pending',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    })

    console.log('Swap yaratildi:', swapRef.id)
    // Qabul qiluvchiga bildirishnoma
    const toUserTg = await getTelegramIdByUid(toItemOwnerId)
    await notify(toUserTg,
      `🔄 *Yangi almashinuv taklifi keldi!*\n\n` +
      `👗 Sizning: *${toItem.title}*\n` +
      `👕 Taklif qildi: *${fromUser.fullName}*\n` +
      `👕 Ularnikiː *${fromItem.title}*\n\n` +
      `Qabul yoki rad qiling!`,
      [{ text: "🔄 Taklifni ko'rish", url: `${MINI_APP_URL}/offers/exchange` }]
    )
    res.json({ success: true, swapId: swapRef.id, message: 'Almashish taklifi yuborildi!' })
  } catch (error) {
    console.error('swap error:', error.message)
    res.status(500).json({ success: false, error: error.message })
  }
})

// ═══════════════════════════════════════════════════════════════════
// 12. NARX TAKLIFI
// ═══════════════════════════════════════════════════════════════════
app.post('/api/price-offer', async (req, res) => {
  try {
    const { initData, itemId, offerPrice } = req.body
    const telegramId = getTelegramIdFromInitData(initData)
    if (!telegramId) return res.status(401).json({ success: false, error: 'Avtorizatsiya kerak' })
    if (!offerPrice || offerPrice <= 0) return res.status(400).json({ success: false, error: "Narx taklifi 0 dan katta bo'lishi kerak" })

    const buyerSnap = await db.collection('users').where('telegramId', '==', telegramId).limit(1).get()
    if (buyerSnap.empty) return res.status(404).json({ success: false, error: 'User topilmadi' })
    const buyer = buyerSnap.docs[0].data()

    const itemDoc = await db.collection('items').doc(itemId).get()
    if (!itemDoc.exists) return res.status(404).json({ success: false, error: "E'lon topilmadi" })
    const item = itemDoc.data()

    const itemOwnerId2 = item.userId || item.uid
    if (itemOwnerId2 === buyer.uid) return res.status(400).json({ success: false, error: "O'z e'loniga taklif berish mumkin emas" })
    if (offerPrice >= item.coinPrice) return res.status(400).json({ success: false, error: "Taklif narxi joriy narxdan past bo'lishi kerak" })

    const sellerSnap = await db.collection('users').where('uid', '==', itemOwnerId2).limit(1).get()
    const seller = sellerSnap.empty ? { fullName: "Noma'lum" } : sellerSnap.docs[0].data()

    const offerRef = await db.collection('offers').add({
      itemId, itemTitle: item.title, itemImages: item.images || [],
      originalPrice: item.coinPrice, offerPrice,
      buyerId: buyer.uid, buyerName: buyer.fullName,
      sellerId: itemOwnerId2, sellerName: seller.fullName,
      status: 'pending', isOfferOrder: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
    })

    console.log('Narx taklifi yaratildi:', offerRef.id)
    // Sotuvchiga bildirishnoma
    const sellerTgForOffer = await getTelegramIdByUid(itemOwnerId2)
    await notify(sellerTgForOffer,
      `🏷️ *Yangi narx taklifi keldi!*\n\n` +
      `🏷️ Mahsulot: *${item.title}*\n` +
      `💰 Asl narx: *${(item.coinPrice||0).toLocaleString()} koin*\n` +
      `💸 Taklif narxi: *${offerPrice.toLocaleString()} koin*\n` +
      `👤 Xaridor: *${buyer.fullName}*\n\n` +
      `Qabul yoki rad qiling!`,
      [{ text: "🏷️ Taklifni ko'rish", url: `${MINI_APP_URL}/offers/price` }]
    )
    res.json({ success: true, offerId: offerRef.id, message: 'Narx taklifingiz yuborildi!' })
  } catch (error) {
    console.error('price-offer error:', error.message)
    res.status(500).json({ success: false, error: error.message })
  }
})

// ═══════════════════════════════════════════════════════════════════
// 13. COIN SO'ROV — foydalanuvchi to'lov yuboradi, admin tasdiqlaydi
// ═══════════════════════════════════════════════════════════════════
app.post('/api/coin-request', async (req, res) => {
  try {
    const { initData, coins, bonus, price } = req.body
    const telegramId = getTelegramIdFromInitData(initData)
    if (!telegramId) return res.status(401).json({ success: false, error: 'Avtorizatsiya kerak' })

    const userSnap = await db.collection('users').where('telegramId', '==', telegramId).limit(1).get()
    if (userSnap.empty) return res.status(404).json({ success: false, error: 'User topilmadi' })
    const userData = userSnap.docs[0].data()

    await db.collection('coin_requests').add({
      userId:      userData.uid,
      telegramId,
      fullName:    userData.fullName || '',
      phoneNumber: userData.phoneNumber || '',
      zoyaId:      userData.zoyaId || '',
      coins:       parseInt(coins),
      bonus:       parseInt(bonus) || 0,
      totalCoins:  parseInt(coins) + (parseInt(bonus) || 0),
      price:       parseInt(price),
      status:      'pending',
      createdAt:   admin.firestore.FieldValue.serverTimestamp(),
    })

    console.log(`🪙 Coin so'rov: ${userData.fullName} — ${coins} coin, ${price} so'm`)
    res.json({ success: true })
  } catch (e) {
    console.error('coin-request error:', e.message)
    res.status(500).json({ success: false, error: e.message })
  }
})

// ═══════════════════════════════════════════════════════════════════
// 14. OFFER AMALLAR: accept / decline / buy
// ═══════════════════════════════════════════════════════════════════
app.post('/api/offers/:id/:action', async (req, res) => {
  try {
    const { id, action } = req.params
    const { initData } = req.body
    const telegramId = getTelegramIdFromInitData(initData)
    if (!telegramId) return res.status(401).json({ success: false, error: 'Avtorizatsiya kerak' })

    const userSnap = await db.collection('users').where('telegramId', '==', telegramId).limit(1).get()
    if (userSnap.empty) return res.status(404).json({ success: false, error: 'User topilmadi' })
    const userData = userSnap.docs[0].data()
    const uid = userData.uid

    const offerRef = db.collection('offers').doc(id)
    const offerSnap = await offerRef.get()
    if (!offerSnap.exists) return res.status(404).json({ success: false, error: 'Taklif topilmadi' })
    const offer = offerSnap.data()

    // ── accept: sotuvchi qabul qiladi ──
    if (action === 'accept') {
      if (offer.sellerId !== uid) return res.status(403).json({ success: false, error: 'Ruxsat yo\'q' })
      if (offer.status !== 'pending') return res.status(400).json({ success: false, error: 'Taklif allaqachon ko\'rib chiqilgan' })

      const itemSnap = await db.collection('items').doc(offer.itemId).get()
      if (itemSnap.data()?.status !== 'active') return res.status(400).json({ success: false, error: 'Mahsulot sotib olingan' })

      await offerRef.update({
        status: 'accepted',
        respondedAt: admin.firestore.FieldValue.serverTimestamp(),
        purchaseDeadline: admin.firestore.Timestamp.fromDate(new Date(Date.now() + 48 * 3600 * 1000)),
      })
      console.log(`✅ Offer accepted: ${id}`)
      // Xaridorga bildirishnoma
      const buyerTgId = await getTelegramIdByUid(offer.buyerId)
      await notify(buyerTgId,
        `✅ *Narx taklifingiz qabul qilindi!*\n\n` +
        `🏷️ Mahsulot: *${offer.itemTitle}*\n` +
        `💰 Taklif narxi: *${(offer.offerPrice||0).toLocaleString()} koin*\n\n` +
        `⏰ 48 soat ichida sotib oling!`,
        [{ text: "🛍️ Sotib olish", url: `${MINI_APP_URL}/offers/price` }]
      )
      return res.json({ success: true })
    }

    // ── decline: sotuvchi rad etadi ──
    if (action === 'decline') {
      if (offer.sellerId !== uid) return res.status(403).json({ success: false, error: 'Ruxsat yo\'q' })
      await offerRef.update({ status: 'declined', respondedAt: admin.firestore.FieldValue.serverTimestamp() })
      console.log(`❌ Offer declined: ${id}`)
      // Xaridorga bildirishnoma
      const buyerTgId = await getTelegramIdByUid(offer.buyerId)
      await notify(buyerTgId,
        `❌ *Narx taklifingiz rad etildi*\n\n` +
        `🏷️ Mahsulot: *${offer.itemTitle}*\n` +
        `💰 Taklif narxi: *${(offer.offerPrice||0).toLocaleString()} koin*\n\n` +
        `Boshqa e'lonlarni ko'rib chiqing.`,
        [{ text: "🔍 E'lonlar", url: `${MINI_APP_URL}` }]
      )
      return res.json({ success: true })
    }

    // ── buy: xaridor qabul qilingan taklif bo'yicha sotib oladi (escrow) ──
    if (action === 'buy') {
      if (offer.buyerId !== uid) return res.status(403).json({ success: false, error: 'Ruxsat yo\'q' })
      if (offer.status !== 'accepted') return res.status(400).json({ success: false, error: 'Taklif hali qabul qilinmagan' })

      const itemId    = offer.itemId
      const sellerId  = offer.sellerId
      const price     = offer.offerPrice

      // Xaridor balansini tekshirish
      const buyerRef  = db.collection('users').doc(uid)
      const buyerSnap = await buyerRef.get()
      const buyerData = buyerSnap.data()
      const coins     = buyerData?.balance?.coins ?? 0
      if (coins < price) return res.status(400).json({ success: false, error: `Yetarli koin yo'q. Kerak: ${price}, mavjud: ${coins}` })

      // Item hali active
      const itemRef  = db.collection('items').doc(itemId)
      const itemSnap = await itemRef.get()
      if (itemSnap.data()?.status !== 'active') return res.status(400).json({ success: false, error: 'Mahsulot allaqachon sotib olingan' })

      const sellerSnap = await db.collection('users').where('uid', '==', sellerId).limit(1).get()
      const sellerName = sellerSnap.empty ? 'Sotuvchi' : sellerSnap.docs[0].data().fullName

      // Buyurtma yaratish + coin escrowga o'tkazish (transaction)
      const orderRef = db.collection('orders').doc()
      await db.runTransaction(async txn => {
        txn.update(buyerRef, {
          'balance.coins': admin.firestore.FieldValue.increment(-price),
          'balance.escrow': admin.firestore.FieldValue.increment(price),
          'balance.lastUpdated': admin.firestore.FieldValue.serverTimestamp(),
        })
        txn.set(orderRef, {
          itemId, itemTitle: itemSnap.data().title, itemImages: itemSnap.data().images || [],
          itemCoinPrice: offer.originalPrice, escrowCoins: price,
          isOfferOrder: true, offerPrice: price, offerId: id,
          buyerId: uid, buyerName: buyerData.fullName || 'Xaridor',
          sellerId, sellerName,
          status: 'pending_seller',
          deliveryMethod: 'meetup',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          autoReleaseAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 3600 * 1000)),
        })
        txn.update(itemRef, { status: 'reserved', orderId: orderRef.id })
        txn.update(offerRef, { status: 'purchased', orderId: orderRef.id, purchasedAt: admin.firestore.FieldValue.serverTimestamp() })
      })
      console.log(`✅ Offer buy → order created: ${orderRef.id}`)
      // Sotuvchiga bildirishnoma
      const sellerTgId = await getTelegramIdByUid(sellerId)
      await notify(sellerTgId,
        `🛍️ *Yangi buyurtma keldi!*\n\n` +
        `🏷️ Mahsulot: *${itemSnap.data().title}*\n` +
        `💰 Narx: *${price.toLocaleString()} koin* (escrowda)\n` +
        `👤 Xaridor: *${buyerData.fullName}*\n\n` +
        `✅ Tasdiqlang va mahsulotni jo'nating!`,
        [{ text: "📦 Buyurtmani ko'rish", url: `${MINI_APP_URL}/offers/sale` }]
      )
      return res.json({ success: true, orderId: orderRef.id })
    }

    return res.status(400).json({ success: false, error: `Noma'lum amal: ${action}` })
  } catch (e) {
    console.error('offer action error:', e.message)
    res.status(500).json({ success: false, error: e.message })
  }
})

// ═══════════════════════════════════════════════════════════════════
// 14. ORDER AMALLAR: confirm (sotuvchi) / received (xaridor) / cancel
// ═══════════════════════════════════════════════════════════════════
app.post('/api/orders/:id/:action', async (req, res) => {
  try {
    const { id, action } = req.params
    const { initData } = req.body
    const telegramId = getTelegramIdFromInitData(initData)
    if (!telegramId) return res.status(401).json({ success: false, error: 'Avtorizatsiya kerak' })

    const userSnap = await db.collection('users').where('telegramId', '==', telegramId).limit(1).get()
    if (userSnap.empty) return res.status(404).json({ success: false, error: 'User topilmadi' })
    const uid = userSnap.docs[0].data().uid

    const orderRef  = db.collection('orders').doc(id)
    const orderSnap = await orderRef.get()
    if (!orderSnap.exists) return res.status(404).json({ success: false, error: 'Buyurtma topilmadi' })
    const order = orderSnap.data()

    // ── confirm: sotuvchi tasdiqlaydi → in_delivery ──
    if (action === 'confirm') {
      if (order.sellerId !== uid) return res.status(403).json({ success: false, error: 'Ruxsat yo\'q' })
      if (order.status !== 'pending_seller' && order.status !== 'pending')
        return res.status(400).json({ success: false, error: 'Buyurtma allaqachon tasdiqlangan' })
      await orderRef.update({ status: 'in_delivery', sellerConfirmedAt: admin.firestore.FieldValue.serverTimestamp() })
      console.log(`✅ Order confirmed: ${id}`)
      // Xaridorga bildirishnoma
      const buyerTgId2 = await getTelegramIdByUid(order.buyerId)
      await notify(buyerTgId2,
        `📦 *Mahsulot yo'lga chiqdi!*\n\n` +
        `🏷️ Mahsulot: *${order.itemTitle}*\n` +
        `👤 Sotuvchi: *${order.sellerName}*\n\n` +
        `Mahsulotni olgach "Qabul qildim" tugmasini bosing — coinlar sotuvchiga o'tkaziladi.`,
        [{ text: "✅ Qabul qildim", url: `${MINI_APP_URL}/offers/sale` }]
      )
      return res.json({ success: true })
    }

    // ── received: xaridor qabul qildi → coinlar sotuvchiga ──
    if (action === 'received') {
      if (order.buyerId !== uid) return res.status(403).json({ success: false, error: 'Ruxsat yo\'q' })
      if (order.status !== 'in_delivery') return res.status(400).json({ success: false, error: 'Buyurtma hali yetkazilmagan' })

      const price          = order.escrowCoins || 0
      const sellerId       = order.sellerId
      const commission     = Math.floor(price * 0.02)
      const sellerReceives = price - commission

      await db.runTransaction(async txn => {
        const sellerRef = db.collection('users').doc(sellerId)
        const buyerRef  = db.collection('users').doc(uid)

        txn.update(sellerRef, {
          'balance.coins': admin.firestore.FieldValue.increment(sellerReceives),
          'balance.lastUpdated': admin.firestore.FieldValue.serverTimestamp(),
          'stats.totalSales': admin.firestore.FieldValue.increment(1),
        })
        txn.update(buyerRef, {
          'balance.escrow': admin.firestore.FieldValue.increment(-price),
          'balance.lastUpdated': admin.firestore.FieldValue.serverTimestamp(),
          'stats.totalPurchases': admin.firestore.FieldValue.increment(1),
        })
        txn.update(db.collection('items').doc(order.itemId), {
          status: 'sold', soldAt: admin.firestore.FieldValue.serverTimestamp(), buyerId: uid,
        })
        txn.update(orderRef, {
          status: 'completed',
          buyerConfirmedAt: admin.firestore.FieldValue.serverTimestamp(),
          completedAt: admin.firestore.FieldValue.serverTimestamp(),
          escrowCoins: 0,
        })
      })
      console.log(`✅ Order received → completed: ${id}, seller gets ${sellerReceives} coins`)
      // Sotuvchiga bildirishnoma
      const sellerTgId2 = await getTelegramIdByUid(order.sellerId)
      await notify(sellerTgId2,
        `🎉 *Sotildi! Coinlar hisobingizga o'tkazildi*\n\n` +
        `🏷️ Mahsulot: *${order.itemTitle}*\n` +
        `💰 Olgan summangiz: *${sellerReceives.toLocaleString()} koin*\n` +
        `📊 Komissiya (2%): *${commission.toLocaleString()} koin*`,
        [{ text: "👤 Profilim", url: `${MINI_APP_URL}/profile` }]
      )
      return res.json({ success: true })
    }

    // ── cancel: bekor qilish (faqat pending_seller holatida) ──
    if (action === 'cancel') {
      if (order.buyerId !== uid && order.sellerId !== uid)
        return res.status(403).json({ success: false, error: 'Ruxsat yo\'q' })
      if (order.status !== 'pending_seller' && order.status !== 'pending')
        return res.status(400).json({ success: false, error: 'Yetkazib berish boshlangandan keyin bekor qilib bo\'lmaydi' })

      const price   = order.escrowCoins || 0
      const buyerId = order.buyerId

      await db.runTransaction(async txn => {
        txn.update(db.collection('users').doc(buyerId), {
          'balance.coins':  admin.firestore.FieldValue.increment(price),
          'balance.escrow': admin.firestore.FieldValue.increment(-price),
          'balance.lastUpdated': admin.firestore.FieldValue.serverTimestamp(),
        })
        txn.update(db.collection('items').doc(order.itemId), { status: 'active', orderId: admin.firestore.FieldValue.delete() })
        txn.update(orderRef, { status: 'cancelled', cancelledAt: admin.firestore.FieldValue.serverTimestamp(), escrowCoins: 0 })
      })
      console.log(`✅ Order cancelled: ${id}, ${price} coins refunded`)
      // Sotuvchiga bildirishnoma (agar xaridor bekor qilsa)
      if (uid === order.buyerId) {
        const sellerTgId3 = await getTelegramIdByUid(order.sellerId)
        await notify(sellerTgId3,
          `❌ *Buyurtma bekor qilindi*\n\n` +
          `🏷️ Mahsulot: *${order.itemTitle}*\n` +
          `👤 Xaridor bekor qildi.\n\n` +
          `E'lon yana faol holatga qaytdi.`
        )
      }
      return res.json({ success: true })
    }

    return res.status(400).json({ success: false, error: `Noma'lum amal: ${action}` })
  } catch (e) {
    console.error('order action error:', e.message)
    res.status(500).json({ success: false, error: e.message })
  }
})

// ═══════════════════════════════════════════════════════════════════
// 15. SWAP AMALLAR: accept / decline / cancel
// ═══════════════════════════════════════════════════════════════════
app.post('/api/swaps/:id/:action', async (req, res) => {
  try {
    const { id, action } = req.params
    const { initData } = req.body
    const telegramId = getTelegramIdFromInitData(initData)
    if (!telegramId) return res.status(401).json({ success: false, error: 'Avtorizatsiya kerak' })

    const userSnap = await db.collection('users').where('telegramId', '==', telegramId).limit(1).get()
    if (userSnap.empty) return res.status(404).json({ success: false, error: 'User topilmadi' })
    const uid = userSnap.docs[0].data().uid

    const swapRef  = db.collection('swaps').doc(id)
    const swapSnap = await swapRef.get()
    if (!swapSnap.exists) return res.status(404).json({ success: false, error: 'Swap topilmadi' })
    const swap = swapSnap.data()

    // ── accept: qabul qiluvchi tasdiqlaydi ──
    if (action === 'accept') {
      if (swap.toUserId !== uid) return res.status(403).json({ success: false, error: 'Bu swap sizga yuborilmagan' })
      if (swap.status !== 'pending') return res.status(400).json({ success: false, error: `Swap allaqachon ${swap.status}` })

      const diff         = swap.coinDifference || 0
      const payingUserId = swap.payingUserId || ''

      await db.runTransaction(async txn => {
        // Coin farqi bo'lsa o'tkazish
        if (diff > 0 && payingUserId) {
          const payerRef  = db.collection('users').doc(payingUserId)
          const payerSnap = await txn.get(payerRef)
          const payerData = payerSnap.data() || {}
          const currentBal = payerData.balance?.coins ?? 0
          if (currentBal < diff) throw new Error(`Yetarli koin yo'q. Kerak: ${diff}, mavjud: ${currentBal}`)

          const receivingUserId = payingUserId === swap.fromUserId ? swap.toUserId : swap.fromUserId
          txn.update(payerRef, {
            'balance.coins': currentBal - diff,
            'balance.lastUpdated': admin.firestore.FieldValue.serverTimestamp(),
          })
          txn.update(db.collection('users').doc(receivingUserId), {
            'balance.coins': admin.firestore.FieldValue.increment(diff),
            'balance.lastUpdated': admin.firestore.FieldValue.serverTimestamp(),
          })
        }

        txn.update(swapRef, { status: 'accepted', acceptedAt: admin.firestore.FieldValue.serverTimestamp() })
        txn.update(db.collection('items').doc(swap.fromItemId), { status: 'exchanged', swapId: id, exchangedAt: admin.firestore.FieldValue.serverTimestamp() })
        txn.update(db.collection('items').doc(swap.toItemId), { status: 'exchanged', swapId: id, exchangedAt: admin.firestore.FieldValue.serverTimestamp() })
        txn.update(db.collection('users').doc(swap.fromUserId), { 'stats.totalExchanges': admin.firestore.FieldValue.increment(1) })
        txn.update(db.collection('users').doc(swap.toUserId), { 'stats.totalExchanges': admin.firestore.FieldValue.increment(1) })
      })
      console.log(`✅ Swap accepted: ${id}`)
      // Yuboruvchiga bildirishnoma
      const fromTgId = await getTelegramIdByUid(swap.fromUserId)
      await notify(fromTgId,
        `🔄 *Almashinuv qabul qilindi!*\n\n` +
        `👕 Siz: *${swap.fromItemTitle}*\n` +
        `👗 Ularnikiː *${swap.toItemTitle}*\n` +
        `👤 Qabul qildi: *${swap.toUserName}*\n\n` +
        `${swap.coinDifference > 0 ? `💰 Farq: *${swap.coinDifference.toLocaleString()} koin* o'tkazildi\n\n` : ''}` +
        `✅ Almashinuv yakunlandi — komissiyasiz!`
      )
      return res.json({ success: true })
    }

    // ── decline: rad etish ──
    if (action === 'decline') {
      if (swap.toUserId !== uid && swap.fromUserId !== uid)
        return res.status(403).json({ success: false, error: 'Ruxsat yo\'q' })
      await swapRef.update({ status: 'declined', declinedAt: admin.firestore.FieldValue.serverTimestamp() })
      console.log(`❌ Swap declined: ${id}`)
      // Yuboruvchiga bildirishnoma
      const fromTgId2 = await getTelegramIdByUid(swap.fromUserId)
      await notify(fromTgId2,
        `❌ *Almashinuv taklifi rad etildi*\n\n` +
        `👕 Siz: *${swap.fromItemTitle}*\n` +
        `👗 Ularnikiː *${swap.toItemTitle}*\n` +
        `👤 Rad etdi: *${swap.toUserName}*`
      )
      return res.json({ success: true })
    }

    // ── cancel: bekor qilish (faqat yuborgan kishi) ──
    if (action === 'cancel') {
      if (swap.fromUserId !== uid) return res.status(403).json({ success: false, error: 'Faqat taklif qilgan kishi bekor qila oladi' })
      if (swap.status !== 'pending') return res.status(400).json({ success: false, error: `Swap bekor qilinmaydi (holat: ${swap.status})` })
      await swapRef.update({ status: 'cancelled', cancelledAt: admin.firestore.FieldValue.serverTimestamp() })
      console.log(`✅ Swap cancelled: ${id}`)
      return res.json({ success: true })
    }

    return res.status(400).json({ success: false, error: `Noma'lum amal: ${action}` })
  } catch (e) {
    console.error('swap action error:', e.message)
    res.status(500).json({ success: false, error: e.message })
  }
})

// ═══════════════════════════════════════════════════════════════════
// 16. HEALTH CHECK
// ═══════════════════════════════════════════════════════════════════
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() })
})

// ═══════════════════════════════════════════════════════════════════
// 17. MINI APP STATIC FILES
// ═══════════════════════════════════════════════════════════════════
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname  = dirname(__filename)
const distPath   = join(__dirname, 'zoya-telegram-mini-app', 'dist')

if (fs.existsSync(distPath)) {
  app.use(express.static(distPath))
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api') && !req.path.startsWith('/health')) {
      res.sendFile(join(distPath, 'index.html'))
    }
  })
  console.log('📱 Mini App static files served from dist/')
} else {
  console.log('⚠️  Mini App dist/ papkasi topilmadi')
}

// ═══════════════════════════════════════════════════════════════════
// SERVER START
// ═══════════════════════════════════════════════════════════════════
app.listen(PORT, () => {
  console.log(`\n🚀 ZOYA Server ${PORT} portda ishlamoqda`)
  console.log(`🔗 Health: http://localhost:${PORT}/health\n`)
})