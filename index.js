const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const bodyParser = require('body-parser');

const token = process.env.BOT_TOKEN;
const bot = new TelegramBot(token);

let botUsername = process.env.BOT_USERNAME || '';
bot.getMe().then(me => {
    if (me && me.username) {
        botUsername = me.username;
        console.log(`Bot Username loaded: @${botUsername}`);
    }
}).catch(err => console.error("Failed to get bot username:", err));

const app = express();
app.use(bodyParser.json());

const strings = {
    welcome: (name) => 
        `<blockquote>👋 <b>Hello, ${name}!</b></blockquote>\n` +
        `<blockquote>Welcome to <b>TG Meta69 Bot!</b> You have successfully verified. Choose an option below: 🚀</blockquote>`,
    
    help: 
        `<blockquote>👑 <b>TG Meta69 Bot - Help Menu</b></blockquote>\n` +
        `<blockquote>📋 <b>User Commands:</b>\n` +
        ` · /start - Start the bot & verification\n` +
        ` · /help - Show this help menu</blockquote>`,

    infoPrompt: 
        `<blockquote>ℹ️ <b>Information & Assistance</b></blockquote>\n` +
        `<blockquote>If you need any information or assistance, please tap the button below to connect with our official bot. 👇</blockquote>`
};

async function checkUserVerification(userId) {
    const channelUsername = '@SRmodxPremium';
    try {
        const chatMember = await bot.getChatMember(channelUsername, userId);
        const status = chatMember.status;
        return ['creator', 'administrator', 'member'].includes(status);
    } catch (e) {
        return false;
    }
}

async function sendVerificationMessage(chatId) {
    await bot.sendMessage(chatId, 
        `<blockquote>⚠️ <b>Channel Verification Required</b></blockquote>\n` +
        `<blockquote>Please join our official channel first to use this bot! 👇</blockquote>`, {
        parse_mode: 'HTML',
        reply_markup: {
            inline_keyboard: [
                [{ text: '📢 Join Channel', url: 'https://t.me/SRmodxPremium', style: 'primary' }],
                [{ text: '✅ Verify', callback_data: 'check_subscription', style: 'success' }]
            ]
        }
    });
}

// 5 Verified Inline Buttons Layout with distinct styles/colors for each button
const verifiedInlineKeyboard = {
    inline_keyboard: [
        [{ text: '📢 SR PREMIUM APP', url: 'https://t.me/sr_premiumApp', style: 'primary' }],
        [{ text: '📦 Modx- Application', url: 'https://t.me/modxApplication', style: 'success' }],
        [{ text: '💬 Modx- CHAT Group', url: 'https://t.me/srmodxChat', style: 'primary' }],
        [{ text: '🤖 Get TG InfoX Bot', url: 'https://t.me/tg_infox_bof', style: 'success' }],
        [{ text: '💰 Real time earning bot', url: 'https://t.me/earncash_pro_bot', style: 'primary' }]
    ]
};

// TG InfoX Bot Single Button Layout for other texts
const infoXButtonKeyboard = {
    inline_keyboard: [
        [{ text: '🤖 TG InfoX Bot', url: 'https://t.me/tg_infox_bof', style: 'success' }]
    ]
};

app.post(`/api/webhook`, async (req, res) => {
    try {
        const update = req.body;

        if (update.callback_query) {
            const callbackQuery = update.callback_query;
            const chatId = callbackQuery.message.chat.id;
            const userId = callbackQuery.from.id;
            const data = callbackQuery.data;

            if (data === 'check_subscription') {
                const isMember = await checkUserVerification(userId);

                if (isMember) {
                    await bot.answerCallbackQuery(callbackQuery.id, { text: '✅ Verified successfully!', show_alert: false });
                    await bot.deleteMessage(chatId, callbackQuery.message.message_id).catch(() => {});
                    await bot.sendMessage(chatId, strings.welcome(callbackQuery.from.first_name), {
                        parse_mode: 'HTML',
                        reply_markup: verifiedInlineKeyboard
                    });
                } else {
                    await bot.answerCallbackQuery(callbackQuery.id, { text: '❌ You have not joined the channel yet!', show_alert: true });
                }
            }
            return res.status(200).send('OK');
        }

        const msg = update.message;
        if (!msg) return res.status(200).send('OK');

        const chatId = msg.chat.id;
        const userId = msg.from.id;
        const text = msg.text || "";

        const hideKeyboard = {
            remove_keyboard: true
        };

        if (text.startsWith('/start')) {
            const isMember = await checkUserVerification(userId);
            if (isMember) {
                await bot.sendMessage(chatId, strings.welcome(msg.from.first_name), {
                    parse_mode: 'HTML',
                    reply_markup: verifiedInlineKeyboard
                });
            } else {
                await sendVerificationMessage(chatId);
            }
            return;
        }

        const isVerified = await checkUserVerification(userId);
        if (!isVerified) {
            await sendVerificationMessage(chatId);
            return;
        }

        if (text.startsWith('/help')) {
            await bot.sendMessage(chatId, strings.help, { 
                parse_mode: 'HTML',
                reply_markup: hideKeyboard
            });
        } else {
            await bot.sendMessage(chatId, strings.infoPrompt, { 
                parse_mode: 'HTML',
                reply_markup: infoXButtonKeyboard
            });
        }

    } catch (err) {
        console.error("Critical Error:", err);
    } finally {
        if (!res.headersSent) res.status(200).send('OK');
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`TG Meta69 Bot Active on Port ${PORT}`));
