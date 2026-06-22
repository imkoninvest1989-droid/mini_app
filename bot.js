import TelegramBot from 'node-telegram-bot-api'
import dotenv from 'dotenv'
import axios from 'axios'

dotenv.config()

const TOKEN        = process.env.TELEGRAM_BOT_TOKEN
const MINI_APP_URL = process.env.TELEGRAM_MINI_APP_URL || 'http://localhost:5173'
const BACKEND_URL  = process.env.BACKEND_URL || 'http://localhost:3000'

if (!TOKEN) { console.error('❌ TELEGRAM_BOT_TOKEN topilmadi!'); process.exit(1) }

const bot = new TelegramBot(TOKEN, { polling: true })
console.log('🤖 ZOYA Bot ishga tushdi...')

// ═══════════════════════════════════════════════════════════════════
// /START — darhol Mini App tugmasi, telefon so'ralmasdan
// ═══════════════════════════════════════════════════════════════════
bot.onText(/\/start(.*)/, async (msg, match) => {
  const chatId     = msg.chat.id
  const firstName  = msg.from.first_name || 'Foydalanuvchi'
  const telegramId = msg.from.id.toString()
  const param      = (match[1] || '').trim()

  // Statistika
  axios.post(`${BACKEND_URL}/api/stats/visit`, {
    telegramId, firstName,
    lastName: msg.from.last_name || '',
    username: msg.from.username  || '',
    source: 'start',
  }).catch(() => {})

  // Deep link: /start item_ITEMID
  if (param.startsWith('item_')) {
    const itemUrl = `${MINI_APP_URL}/listing/${param.replace('item_', '')}`
    return bot.sendMessage(chatId, `👗 E'lonni ko'rish uchun:`, {
      reply_markup: { inline_keyboard: [[{ text: "🛍️ ZOYA da ko'rish", web_app: { url: MINI_APP_URL } }]] }
    })
  }

  // Asosiy /start xabari
  bot.sendMessage(chatId,
    `👋 ZOYAga xush kelibsiz!\n\nBu yerda siz o'z kiyimlaringizni mutlaqo *bepul* va *xavfsiz* almashtirishingiz mumkin.\n\n👇 Quyidagi tugmani bosing va kiyimlar katalogini hoziroq tomosha qiling:`,
    {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [[
          { text: '🛍️ Kiyimlarni ko\'rish', web_app: { url: MINI_APP_URL } }
        ]]
      }
    }
  )
})

// ═══════════════════════════════════════════════════════════════════
// CONTACT — telefon raqam yuborildi (Modal tugmasidan keyin)
// ═══════════════════════════════════════════════════════════════════
bot.on('contact', async (msg) => {
  const chatId      = msg.chat.id
  const phoneNumber = msg.contact.phone_number
  const telegramId  = msg.from.id.toString()
  const firstName   = msg.from.first_name || ''
  const lastName    = msg.from.last_name  || ''
  const username    = msg.from.username   || ''

  console.log(`\n📞 Contact: ${phoneNumber} TG:${telegramId}`)

  // Statistika
  axios.post(`${BACKEND_URL}/api/stats/visit`, {
    telegramId, firstName, phoneNumber, source: 'phone_sent',
  }).catch(() => {})

  // Yuklanyapti xabari
  const loadingMsg = await bot.sendMessage(chatId, '⏳ Tekshirilmoqda...')

  try {
    const response = await axios.post(`${BACKEND_URL}/api/auth/telegram-login`, {
      phoneNumber, telegramId, firstName, lastName, username,
    })

    const { user } = response.data

    // Loading xabarni o'chirish
    bot.deleteMessage(chatId, loadingMsg.message_id).catch(() => {})

    // Muvaffaqiyatli
    await bot.sendMessage(chatId,
      `✅ Tabriklaymiz, ${user.fullName}!\n\nAkkauntingiz muvaffaqiyatli ulandi.\n💰 Balans: *${(user.balance?.coins || 0).toLocaleString()} koin*\n\nEndi e'lon joylash, almashtirish va sotib olish imkoniyatingiz bor!`,
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [[{ text: '🛍️ ZOYA Mini App', web_app: { url: MINI_APP_URL } }]],
          remove_keyboard: true
        }
      }
    )

    // Statistika
    axios.post(`${BACKEND_URL}/api/stats/visit`, {
      telegramId, firstName, phoneNumber, source: 'login_success',
    }).catch(() => {})

  } catch (error) {
    const status = error.response?.status
    bot.deleteMessage(chatId, loadingMsg.message_id).catch(() => {})

    // Statistika
    axios.post(`${BACKEND_URL}/api/stats/visit`, {
      telegramId, firstName, phoneNumber, source: status === 404 ? 'not_found' : 'error',
    }).catch(() => {})

    if (status === 404) {
      // Ilova test rejimida — Mini App ga yo'naltirish
      bot.sendMessage(chatId,
        `📱 Siz hali ZOYA ilovasida ro'yxatdan o'tmagansiz.\n\nIlova hozirda *test rejimida* — tez orada hammaga ochiladi!\n\nHozircha kiyimlar katalogini ko'rishingiz mumkin 👇`,
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [[{ text: "🛍️ Kiyimlarni ko'rish", web_app: { url: MINI_APP_URL } }]],
            remove_keyboard: true
          }
        }
      )
    } else {
      bot.sendMessage(chatId, `❌ Xato yuz berdi. Qaytadan urinib ko'ring: /start`)
    }
  }
})

// ═══════════════════════════════════════════════════════════════════
// INLINE MODE
// ═══════════════════════════════════════════════════════════════════
bot.on('inline_query', async (query) => {
  const queryText = query.query.trim()
  try {
    const response = await axios.get(`${BACKEND_URL}/api/listings`, {
      params: { search: queryText || '', limit: 20 }
    })
    const listings = response.data.listings || []
    const results = listings.map(item => {
      const image     = item.images?.[0] || null
      const price     = (item.coinPrice || 0).toLocaleString()
      const condition = item.condition === 'new' ? '🆕 Yangi' : item.condition === 'like_new' ? '✨ Yangiday' : '👕 Ishlatilgan'
      const size      = item.size ? `  📐 ${item.size}` : ''
      const miniAppUrl = `${MINI_APP_URL}/listing/${item.id}`
      const caption   = `👗 *${item.title}*\n\n💰 Narxi: *${price} koin*\n${condition}${size}\n👤 ${item.userName || "Noma'lum"}`
      const keyboard  = { inline_keyboard: [[{ text: "🛍️ ZOYA da ochish", url: miniAppUrl }]] }
      const isValidUrl = image && image.startsWith('http')
      if (isValidUrl) {
        return { type: 'photo', id: item.id, photo_url: image, thumb_url: image, photo_width: 800, photo_height: 800, title: item.title, caption, parse_mode: 'Markdown', reply_markup: keyboard }
      }
      return { type: 'article', id: item.id, title: `${item.title} — ${price} koin`, description: `${condition}${size}`, input_message_content: { message_text: caption, parse_mode: 'Markdown' }, reply_markup: keyboard }
    })
    await bot.answerInlineQuery(query.id, results, { cache_time: 0, is_personal: true })
  } catch (error) {
    await bot.answerInlineQuery(query.id, [], { cache_time: 5 })
  }
})

// ═══════════════════════════════════════════════════════════════════
// BOSHQA XABARLAR
// ═══════════════════════════════════════════════════════════════════
bot.on('message', (msg) => {
  if (msg.contact || msg.text?.startsWith('/')) return
  bot.sendMessage(msg.chat.id,
    `👋 Boshlash uchun /start yozing yoki quyidagi tugmani bosing:`,
    { reply_markup: { inline_keyboard: [[{ text: "🛍️ Kiyimlarni ko'rish", web_app: { url: MINI_APP_URL } }]] } }
  )
})

bot.on('polling_error', (error) => { console.error('🔴 Polling xatosi:', error.message) })