import TelegramBot from 'node-telegram-bot-api'
import dotenv from 'dotenv'
import axios from 'axios'

dotenv.config()

const TOKEN       = process.env.TELEGRAM_BOT_TOKEN
const MINI_APP_URL = process.env.TELEGRAM_MINI_APP_URL || 'http://localhost:5173'
const BACKEND_URL  = process.env.BACKEND_URL || 'http://localhost:3000'
const BOT_USERNAME = process.env.BOT_USERNAME || 'Zoya_app_bot'

if (!TOKEN) { console.error('❌ TELEGRAM_BOT_TOKEN topilmadi!'); process.exit(1) }

const bot = new TelegramBot(TOKEN, { polling: true })
console.log('🤖 ZOYA Bot ishga tushdi...')

// ═══════════════════════════════════════════════════════════════════
// /START — kuzatuvchi sifatida Mini App ochiladi
// ═══════════════════════════════════════════════════════════════════
bot.onText(/\/start(.*)/, async (msg, match) => {
  const chatId    = msg.chat.id
  const firstName = msg.from.first_name || 'Foydalanuvchi'
  const telegramId = msg.from.id.toString()
  const param     = (match[1] || '').trim()

  // Statistika: /start bosdi
  try {
    await axios.post(`${BACKEND_URL}/api/stats/visit`, {
      telegramId, firstName,
      lastName:  msg.from.last_name  || '',
      username:  msg.from.username   || '',
      source:    'start',
    }).catch(() => {})
  } catch {}

  // Deep link: /start item_ITEMID
  if (param.startsWith('item_')) {
    const itemId  = param.replace('item_', '')
    const itemUrl = `${MINI_APP_URL}/listing/${itemId}`
    return bot.sendMessage(chatId, `👗 E'lonni ko'rish uchun:`, {
      reply_markup: { inline_keyboard: [[{ text: "🛍️ ZOYA da ko'rish", web_app: { url: itemUrl } }]] }
    })
  }

  // Asosiy /start — Mini App tugmasi + ro'yxatdan o'tish tugmasi
  bot.sendMessage(chatId,
    `Salom ${firstName}! 👋\n\n🛍️ *ZOYA* — Uzbekistondagi kiyim almashish platformasi.\n\nE'lonlarni ko'rish uchun Mini App ni oching:\n👇`,
    {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '🛍️ ZOYA Mini App ni ochish', web_app: { url: MINI_APP_URL } }],
          [{ text: '📱 Ro\'yxatdan o\'tish', callback_data: 'register' }],
        ]
      }
    }
  )
})

// ═══════════════════════════════════════════════════════════════════
// CALLBACK — "Ro'yxatdan o'tish" tugmasi bosildi
// ═══════════════════════════════════════════════════════════════════
bot.on('callback_query', async (query) => {
  const chatId    = query.message.chat.id
  const telegramId = query.from.id.toString()

  if (query.data === 'register') {
    // Statistika: ro'yxatdan o'tishga urindi
    axios.post(`${BACKEND_URL}/api/stats/visit`, {
      telegramId,
      firstName: query.from.first_name || '',
      source: 'register_attempt',
    }).catch(() => {})

    await bot.answerCallbackQuery(query.id)
    bot.sendMessage(chatId,
      `📱 Ro'yxatdan o'tish uchun telefon raqamingizni yuboring:`,
      {
        reply_markup: {
          keyboard: [[{ text: '📱 Telefon raqamimni ulash', request_contact: true }]],
          one_time_keyboard: true,
          resize_keyboard: true
        }
      }
    )
  }
})

// ═══════════════════════════════════════════════════════════════════
// CONTACT HANDLER — telefon raqam yuborildi
// ═══════════════════════════════════════════════════════════════════
bot.on('contact', async (msg) => {
  const chatId     = msg.chat.id
  const phoneNumber = msg.contact.phone_number
  const telegramId  = msg.from.id.toString()
  const firstName   = msg.from.first_name || ''
  const lastName    = msg.from.last_name  || ''
  const username    = msg.from.username   || ''

  console.log(`\n📞 Contact: ${phoneNumber} TG:${telegramId}`)

  // Statistika: telefon yubordi
  axios.post(`${BACKEND_URL}/api/stats/visit`, {
    telegramId, firstName, phoneNumber, source: 'phone_sent',
  }).catch(() => {})

  try {
    const response = await axios.post(`${BACKEND_URL}/api/auth/telegram-login`, {
      phoneNumber, telegramId, firstName, lastName, username,
    })

    const { user } = response.data
    await bot.sendMessage(chatId, '✅ Akkauntingiz topildi!', { reply_markup: { remove_keyboard: true } })
    bot.sendMessage(chatId,
      `👤 ${user.fullName}\n📱 ${user.phoneNumber}\n💰 Balans: ${user.balance?.coins || 0} koin\n\nEndi Mini App dan foydalanishingiz mumkin!`,
      { reply_markup: { inline_keyboard: [[{ text: '🛍️ ZOYA Mini App', web_app: { url: MINI_APP_URL } }]] } }
    )

    // Statistika: muvaffaqiyatli login
    axios.post(`${BACKEND_URL}/api/stats/visit`, {
      telegramId, firstName, phoneNumber, source: 'login_success',
    }).catch(() => {})

  } catch (error) {
    const status  = error.response?.status
    const message = error.response?.data?.error || error.message
    console.error(`❌ telegram-login error ${status}: ${message}`)

    // Statistika: topilmadi
    axios.post(`${BACKEND_URL}/api/stats/visit`, {
      telegramId, firstName, phoneNumber, source: 'not_found',
    }).catch(() => {})

    if (status === 404) {
      bot.sendMessage(chatId,
        `❌ Bu raqam ZOYA ilovasida topilmadi.\n\nIlova test bosqichida — tez orada ochiq bo'ladi!\n\n📲 Hozircha Mini App orqali e'lonlarni ko'rishingiz mumkin:`,
        {
          reply_markup: {
            inline_keyboard: [[{ text: '🛍️ E\'lonlarni ko\'rish', web_app: { url: MINI_APP_URL } }]],
            remove_keyboard: true
          }
        }
      )
    } else {
      bot.sendMessage(chatId, `❌ Xato yuz berdi. Qaytadan: /start`)
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
      const image    = item.images?.[0] || null
      const price    = (item.coinPrice || 0).toLocaleString()
      const condition = item.condition === 'new' ? '🆕 Yangi' : item.condition === 'like_new' ? '✨ Yangiday' : '👕 Ishlatilgan'
      const size     = item.size ? `  📐 ${item.size}` : ''
      const miniAppUrl = `${MINI_APP_URL}/listing/${item.id}`
      const caption  = `👗 *${item.title}*\n\n💰 Narxi: *${price} koin*\n${condition}${size}\n👤 ${item.userName || "Noma'lum"}`
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

// ═══════════════════════════════════════════════════════════════════
// /HELP
// ═══════════════════════════════════════════════════════════════════
bot.onText(/\/help/, (msg) => {
  bot.sendMessage(msg.chat.id, `/start — Boshlash\n/help — Yordam`, {
    reply_markup: { inline_keyboard: [[{ text: '🛍️ Mini App', web_app: { url: MINI_APP_URL } }]] }
  })
})

bot.on('message', (msg) => {
  if (msg.contact || msg.text?.startsWith('/')) return
  bot.sendMessage(msg.chat.id, 'Boshlash uchun /start yozing.')
})

bot.on('polling_error', (error) => { console.error('🔴 Polling xatosi:', error.message) })