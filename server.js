import express from 'express'
import cors from 'cors'
import admin from 'firebase-admin'
import dotenv from 'dotenv'

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
  })
})
const db = admin.firestore()

// ═══════════════════════════════════════════════════════════════════
// EXPRESS SETUP
// ═══════════════════════════════════════════════════════════════════
const app = express()
app.use(cors())
app.use(express.json())
const PORT = process.env.PORT || 3000

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
    const { category, gender, limit = 20 } = req.query

    let query = db.collection('items').where('status', '==', 'active')

    if (category) query = query.where('category', '==', category)
    if (gender) query = query.where('gender', '==', gender)

    const snapshot = await query.limit(parseInt(limit)).get()
    const listings = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))

    console.log(`📋 GET /api/listings — ${listings.length} ta`)
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
      images: images || [],
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

    if (!telegramId) {
      return res.status(401).json({ success: false, error: 'Avtorizatsiya kerak' })
    }

    const snapshot = await db
      .collection('notifications')
      .where('telegramId', '==', telegramId)
      .orderBy('createdAt', 'desc')
      .limit(20)
      .get()

    const notifications = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    res.json({ success: true, notifications })

  } catch (error) {
    console.error('❌ notifications error:', error.message)
    res.status(500).json({ success: false, error: error.message })
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

    // ── NARX TAKLIFLARI ──────────────────────────────────────────────
    // Sotuvchi: pending takliflarni qabul/rad qiladi
    // Xaridor: pending (kutilmoqda) va accepted (sotib olish kerak) ko'radi
    const seenOffers = new Set()
    const priceOffers = [
      ...offerAsSellerSnap.docs.map(d => ({
        id: d.id, _myRole: 'seller', ...d.data()
      })),
      ...offerAsBuyerSnap.docs.map(d => ({
        id: d.id, _myRole: 'buyer', ...d.data()
      })),
    ]
      .filter(d => {
        if (seenOffers.has(d.id)) return false
        seenOffers.add(d.id)
        // Sotuvchi: faqat pending ko'radi
        if (d._myRole === 'seller') return d.status === 'pending'
        // Xaridor: pending va accepted ko'radi (purchased/declined/expired emas)
        if (d._myRole === 'buyer') return d.status === 'pending' || d.status === 'accepted'
        return false
      })
      .sort(sortByDate)
      .slice(0, 30)

    // ── SOTISH BUYURTMALARI ──────────────────────────────────────────
    // Sotuvchi: pending_seller → "Tasdiqlash" tugmasi
    // Xaridor: in_delivery → "Qabul qildim" tugmasi
    const seenOrders = new Set()
    const saleOrders = [
      ...orderAsSellerSnap.docs.map(d => ({
        id: d.id, _myRole: 'seller', ...d.data()
      })),
      ...orderAsBuyerSnap.docs.map(d => ({
        id: d.id, _myRole: 'buyer', ...d.data()
      })),
    ]
      .filter(d => {
        if (seenOrders.has(d.id)) return false
        seenOrders.add(d.id)
        if (d._myRole === 'seller') return d.status === 'pending_seller' || d.status === 'pending'
        if (d._myRole === 'buyer') return d.status === 'in_delivery' || d.status === 'pending_seller' || d.status === 'pending'
        return false
      })
      .sort(sortByDate)
      .slice(0, 30)

    // ── ALMASHINUV ───────────────────────────────────────────────────
    const seenSwaps = new Set()
    const exchanges = [...swapsToSnap.docs, ...swapsFromSnap.docs]
      .filter(d => {
        if (seenSwaps.has(d.id)) return false
        seenSwaps.add(d.id)
        return true
      })
      .map(d => ({
        id: d.id,
        _myRole: d.data().toUserId === uid ? 'receiver' : 'sender',
        ...d.data()
      }))
      .filter(d => d.status === 'pending')
      .sort(sortByDate)
      .slice(0, 30)

    console.log(`   narx:${priceOffers.length} sotish:${saleOrders.length} almashinuv:${exchanges.length}`)

    res.json({
      success: true,
      counts: {
        exchange: exchanges.length,
        sale:     saleOrders.length,
        price:    priceOffers.length,
        total:    exchanges.length + saleOrders.length + priceOffers.length,
      },
      data: { priceOffers, saleOrders, exchanges }
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
    res.json({ success: true, offerId: offerRef.id, message: 'Narx taklifingiz yuborildi!' })
  } catch (error) {
    console.error('price-offer error:', error.message)
    res.status(500).json({ success: false, error: error.message })
  }
})

// ═══════════════════════════════════════════════════════════════════
// 13. OFFER AMALLAR: accept / decline / buy
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
      return res.json({ success: true })
    }

    // ── decline: sotuvchi rad etadi ──
    if (action === 'decline') {
      if (offer.sellerId !== uid) return res.status(403).json({ success: false, error: 'Ruxsat yo\'q' })
      await offerRef.update({ status: 'declined', respondedAt: admin.firestore.FieldValue.serverTimestamp() })
      console.log(`❌ Offer declined: ${id}`)
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
      return res.json({ success: true })
    }

    // ── decline: rad etish ──
    if (action === 'decline') {
      if (swap.toUserId !== uid && swap.fromUserId !== uid)
        return res.status(403).json({ success: false, error: 'Ruxsat yo\'q' })
      await swapRef.update({ status: 'declined', declinedAt: admin.firestore.FieldValue.serverTimestamp() })
      console.log(`❌ Swap declined: ${id}`)
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
// SERVER START
// ═══════════════════════════════════════════════════════════════════
app.listen(PORT, () => {
  console.log(`\n🚀 ZOYA Server ${PORT} portda ishlamoqda`)
  console.log(`🔗 Health: http://localhost:${PORT}/health\n`)
})