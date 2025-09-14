import "dotenv/config";
import { Bot, GrammyError, HttpError } from 'grammy';
import { initDatabase } from './database.js'
import setupCommands from './commands.js';

async function main() {
    const bot = new Bot(process.env.BOT_API_KEY);

    // Загрузка команд
    setupCommands(bot);

    initDatabase();

    // Обработка ошибок
    bot.catch((err) => {
        console.error('Error while handling update:', err);

        if (err instanceof GrammyError) {
            console.error('Grammy error:', err.description);
        } else if (err instanceof HttpError) {
            console.error('Telegram error:', err.response.description);
        } else {
            console.error('Unknown error:', err);
        }
    });

    // Запуск бота
    bot.start();
    console.log('Бот запущен...');
}

main();