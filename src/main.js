import { Telegraf, session } from 'telegraf';
import { message } from 'telegraf/filters';
import config from 'config';
import { telegramFormat } from './convert.js'
import { openai } from './openai.js';
import { code } from 'telegraf/format';

const MAXIMUM_QUESTIONS = 8
const INITIAL_SESSION = {
    messages: []
}
const bot = new Telegraf(config.get('TELEGRAM_TOKEN'))

bot.use(session())

bot.command('new', async (ctx)=>{
    ctx.session = INITIAL_SESSION
    
    await ctx.reply('Введите голосовое, либо текстовое сообщение')
})
bot.command('start', async (ctx)=>{
    ctx.session = INITIAL_SESSION
    await ctx.reply('Введите голосовое, либо текстовое сообщение')
})

bot.on(message('voice'), async contex => {
    contex.session ??= INITIAL_SESSION   
    try { 
    if (contex.session.messages.length >= 10) {
        contex.session.messages.splice(0, contex.session.messages.length - MAXIMUM_QUESTIONS)
    }
await contex.reply(code('Обрабатываю сообщение...'))
        const link = await contex.telegram.getFileLink(contex.message.voice.file_id)
        const userId = String(contex.message.from.id)
        const oggPath = await telegramFormat.create(link.href, userId)
        const mp3Path = await telegramFormat.convertToMp3(oggPath, userId)
        const text = await openai.transcription(mp3Path)
        await contex.reply(`Ваш запрос: ${text}`)
       contex.session.messages.push({ role: openai.roles.USER, content: text })
        const response = await openai.chat(contex.session.messages)
        contex.session.messages.push({ role: openai.roles.ASSISTANT, content: response.content })
        await contex.reply(response.content)
    } catch (e) {
        console.log('Error voice', e.message)
    }
})

bot.on(message('text'), async contex => {
    contex.session ??= INITIAL_SESSION
    try {
        if (contex.session.messages.length >= 10) {
            contex.session.messages.splice(0, contex.session.messages.length - MAXIMUM_QUESTIONS)
        }
await contex.reply(code('Обрабатываю сообщение...'))

       contex.session.messages.push({ role: openai.roles.USER, content: contex.message.text })
        const response = await openai.chat(contex.session.messages)
        contex.session.messages.push({ role: openai.roles.ASSISTANT, content: response.content })
        await contex.reply(response.content)
    } catch (e) {
        console.log('Error text', e.message)
    }
})

bot.launch()

process.once('SIGINT', ()=>bot.stop('SIGINT'))
process.once('SIGTERM', ()=>bot.stop('SIGTERM'))