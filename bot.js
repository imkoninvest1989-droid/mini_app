import TelegramBot from 'node-telegram-bot-api'
import dotenv from 'dotenv'
import axios from 'axios'

dotenv.config()

const TOKEN = process.env.TELEGRAM_BOT_TOKEN
const MINI_APP_URL = process.env.TELEGRAM_MINI_APP_URL || 'http://localhost:5173'
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000'

if (!TOKEN) {
  console.error('❌ TELEGRAM_BOT_TOKEN topilmadi!')
  process.exit(1)
}

const bot = new TelegramBot(TOKEN, { polling: true })
console.log('🤖 ZOYA Bot ishga tushdi...')

// ═══════════════════════════════════════════════════════════════════
// /START
// ═══════════════════════════════════════════════════════════════════
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id
  const firstName = msg.from.first_name || 'Foydalanuvchi'

  bot.sendMessage(
    chatId,
    `Salom ${firstName}! 👋\n\nZOYA kiyim almashish platformasiga xush kelibsiz!\n\n📱 Telefon raqamingizni ulang — shunda ilovadagi akkauntingiz bot bilan bog'lanadi.`,
    {
      reply_markup: {
        keyboard: [[{ text: '📱 Telefon raqamimni ulash', request_contact: true }]],
        one_time_keyboard: true,
        resize_keyboard: true
      }
    }
  )
})

// ═══════════════════════════════════════════════════════════════════
// CONTACT HANDLER
// ═══════════════════════════════════════════════════════════════════
bot.on('contact', async (msg) => {
  const chatId = msg.chat.id
  const phoneNumber = msg.contact.phone_number   // Telegram: "998991993089" yoki "79001234567"
  const telegramId = msg.from.id.toString()
  const firstName = msg.from.first_name || ''
  const lastName = msg.from.last_name || ''
  const username = msg.from.username || ''

  console.log(`\n📞 Contact keldi`)
  console.log(`   Raw phone: ${phoneNumber}`)
  console.log(`   TG ID: ${telegramId}`)

  try {
    const response = await axios.post(`${BACKEND_URL}/api/auth/telegram-login`, {
      phoneNumber,
      telegramId,
      firstName,
      lastName,
      username,
    })

    const { user } = response.data

    // Keyboard ni olib tashlash
    await bot.sendMessage(chatId, '✅ Akkauntingiz topildi!', {
      reply_markup: { remove_keyboard: true }
    })

    // Xush kelibsiz xabari
    const text =
      `👤 ${user.fullName}\n` +
      `📱 ${user.phoneNumber}\n` +
      `💰 Balans: ${user.balance?.coins || 0} koin\n\n` +
      `Endi Mini App dan foydalanishingiz mumkin!`

    bot.sendMessage(chatId, text, {
      reply_markup: {
        inline_keyboard: [[{
          text: '🛍️ ZOYA Mini App',
          web_app: { url: MINI_APP_URL }
        }]]
      }
    })

  } catch (error) {
    const status = error.response?.status
    const message = error.response?.data?.error || error.message

    console.error(`❌ telegram-login error ${status}: ${message}`)

    if (status === 404) {
      bot.sendMessage(
        chatId,
        `❌ Bu raqam ZOYA ilovasida topilmadi.\n\nAvval ilovani yuklab, ro'yxatdan o'ting:\n👉 @zoya_app`,
        { reply_markup: { remove_keyboard: true } }
      )
    } else {
      bot.sendMessage(chatId, `❌ Xato yuz berdi. Qaytadan urinib ko'ring: /start`)
    }
  }
})

// ═══════════════════════════════════════════════════════════════════
// /PROFILE
// ═══════════════════════════════════════════════════════════════════
bot.onText(/\/profile/, async (msg) => {
  const chatId = msg.chat.id
  const telegramId = msg.from.id.toString()

  try {
    // initData yo'q, to'g'ridan telegramId bilan so'raymiz
    const response = await axios.post(`${BACKEND_URL}/api/user-profile`, {
      initData: `user=${JSON.stringify({ id: parseInt(telegramId) })}`
    })

    const { user } = response.data
    const text =
      `👤 Profil\n\n` +
      `Ism: ${user.fullName}\n` +
      `Raqam: ${user.phoneNumber}\n` +
      `Koin: ${user.balance?.coins || 0}\n` +
      `E'lonlar: ${user.stats?.totalListings || 0}\n` +
      `Reyting: ${user.stats?.rating || 0}`

    bot.sendMessage(chatId, text, {
      reply_markup: {
        inline_keyboard: [[{ text: '🛍️ Mini App', web_app: { url: MINI_APP_URL } }]]
      }
    })
  } catch {
    bot.sendMessage(chatId, '❌ Profil topilmadi. /start bosing va telefon raqamingizni ulang.')
  }
})

// ═══════════════════════════════════════════════════════════════════
// /HELP
// ═══════════════════════════════════════════════════════════════════
bot.onText(/\/help/, (msg) => {
  bot.sendMessage(
    msg.chat.id,
    `/start — Boshlash\n/profile — Profilim\n/help — Yordam`,
    {
      reply_markup: {
        inline_keyboard: [[{ text: '🛍️ Mini App', web_app: { url: MINI_APP_URL } }]]
      }
    }
  )
})

// ═══════════════════════════════════════════════════════════════════
// BOSHQA XABARLAR
// ═══════════════════════════════════════════════════════════════════
bot.on('message', (msg) => {
  if (msg.contact || msg.text?.startsWith('/')) return

  bot.sendMessage(msg.chat.id, 'Boshlash uchun /start yozing.')
})

bot.on('polling_error', (error) => {
  console.error('🔴 Polling xatosi:', error.message)
})