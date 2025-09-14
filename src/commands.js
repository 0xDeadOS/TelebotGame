import { InlineKeyboard } from 'grammy';
// import {createGame} from './database.js'

function setupCommands(bot) {
  bot.api.setMyCommands([
    {
      command: 'start',
      description: 'Выбор режимa',
    }
  ]);
/*-----------------START-----------------*/
  bot.command('start', async (ctx) => {
    try {
      const chatId = await ctx.chat.id;
      const gameId = await createGame(chatId,0);
      let gameMessage = '🎲 Новая игра началась!\n\n'
      gameMessage += '📋 Правила:\n'
      gameMessage += '       • Каждый игрок может бросить кубик только один раз\n'
      gameMessage += '       • Результат зависит от погодных условий\n'
      gameMessage += '       • Погода определяется вашей статистикой в Dota 2\n'
      gameMessage += '\n🎯 Нажмите кнопку ниже, чтобы бросить кубик!'

      const keyboard = new InlineKeyboard().text('🎲 Бросить кубик',`roll_${gameId}`,)
      ctx.reply(gameMessage, {reply_markup:keyboard})
    } catch (error) {
      console.log('Ошибка при создании игры: ', error)
      await ctx.reply('❌ Произошла ошибка при создании игры. Попробуйте позже.')
    }
  });
/*-------------------help------------------------*/
  bot.command('help', async (ctx) => {
    const helpMessage = `
🎲 Справка по игре "Кубики с погодой"

📖 Правила игры:
• Каждый игрок может бросить кубик только один раз за игру
• Результат броска от 1 до 6
• Погодные условия могут изменить результат на ±0.5

🌤️ Погодные условия:
• ☀️ Ясная погода (+0.5): 80%+ побед в Dota 2
• 🌤️ Легкая облачность (+0.3): 60-79% побед
• ⛅ Переменная облачность (0): 40-59% побед
• 🌧️ Дождь (-0.3): 20-39% побед
• ⛈️ Гроза (-0.5): менее 20% побед

🎮 Интеграция с Dota 2:
• Бот анализирует ваши последние 10 матчей
• Использует STRATZ API для получения данных
• Погода обновляется автоматически

📊 Статистика:
• /stats - ваша личная статистика
• Результаты сохраняются в базе данных
• Можно отслеживать прогресс

💡 Советы:
• Играйте в Dota 2 для улучшения погоды
• Приглашайте друзей в игру
• Следите за статистикой
    `;

    await ctx.reply(helpMessage.trim());
  });
}

export default setupCommands;
