import * as fs from 'fs';
import path from 'path';

// Путь к файлу базы данных
const DB_PATH1 = path.dirname()
const DB_PATH = '../database/gameDatabase.json';

// Инициализация базы данных
async function initDatabase() {
    try {
        await fs.access(DB_PATH);
    } catch (error) {
        // Файл не существует, создаем новый
        const initialData = {
            games: {},
            players: {},
            statistics: {}
        };
        await fs.writeFile(DB_PATH, JSON.stringify(initialData, null, 2));
        console.log('База данных инициализирована');
    }
}

// Чтение данных из базы
async function readDatabase() {
    try {
        const data = await fs.readFile(DB_PATH, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Ошибка при чтении базы данных:', error);
        return { games: {}, players: {}, statistics: {} };
    }
}

// Запись данных в базу
async function writeDatabase(data) {
    try {
        await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Ошибка при записи в базу данных:', error);
        throw error;
    }
}

// Создание новой игры
async function createGame(chatId, initialScore = 0) {
    try {
        const db = await readDatabase();
        const gameId = `game_${chatId}_${Date.now()}`;
        
        db.games[gameId] = {
            id: gameId,
            chatId: chatId,
            createdAt: new Date().toISOString(),
            status: 'active', // active, completed, cancelled
            players: {},
            currentScore: initialScore,
            rounds: []
        };

        await writeDatabase(db);
        console.log(`Игра создана: ${gameId}`);
        return gameId;
    } catch (error) {
        console.error('Ошибка при создании игры:', error);
        throw error;
    }
}

// Получение игры по ID
async function getGame(gameId) {
    try {
        const db = await readDatabase();
        return db.games[gameId] || null;
    } catch (error) {
        console.error('Ошибка при получении игры:', error);
        return null;
    }
}

// Получение активной игры для чата
async function getActiveGameForChat(chatId) {
    try {
        const db = await readDatabase();
        const games = Object.values(db.games);
        
        return games.find(game => 
            game.chatId === chatId && 
            game.status === 'active'
        ) || null;
    } catch (error) {
        console.error('Ошибка при поиске активной игры:', error);
        return null;
    }
}

// Обновление игры
async function updateGame(gameId, updates) {
    try {
        const db = await readDatabase();
        
        if (!db.games[gameId]) {
            throw new Error(`Игра с ID ${gameId} не найдена`);
        }

        db.games[gameId] = { ...db.games[gameId], ...updates };
        await writeDatabase(db);
        
        return db.games[gameId];
    } catch (error) {
        console.error('Ошибка при обновлении игры:', error);
        throw error;
    }
}

// Добавление игрока в игру
async function addPlayerToGame(gameId, userId, username = null) {
    try {
        const db = await readDatabase();
        
        if (!db.games[gameId]) {
            throw new Error(`Игра с ID ${gameId} не найдена`);
        }

        const player = {
            userId: userId,
            username: username,
            joinedAt: new Date().toISOString(),
            hasRolled: false,
            lastRoll: null,
            totalScore: 0
        };

        db.games[gameId].players[userId] = player;

        // Также добавляем/обновляем в общей таблице игроков
        if (!db.players[userId]) {
            db.players[userId] = {
                userId: userId,
                username: username,
                gamesPlayed: 0,
                totalWins: 0,
                createdAt: new Date().toISOString()
            };
        }

        db.players[userId].gamesPlayed += 1;
        if (username) {
            db.players[userId].username = username;
        }

        await writeDatabase(db);
        return player;
    } catch (error) {
        console.error('Ошибка при добавлении игрока:', error);
        throw error;
    }
}

// Запись результата броска кубика
async function recordDiceRoll(gameId, userId, rollResult, weatherModifier = 0) {
    try {
        const db = await readDatabase();
        
        if (!db.games[gameId] || !db.games[gameId].players[userId]) {
            throw new Error('Игра или игрок не найдены');
        }

        const finalScore = rollResult + weatherModifier;
        const rollData = {
            userId: userId,
            originalRoll: rollResult,
            weatherModifier: weatherModifier,
            finalScore: finalScore,
            timestamp: new Date().toISOString()
        };

        // Обновляем данные игрока в игре
        db.games[gameId].players[userId].hasRolled = true;
        db.games[gameId].players[userId].lastRoll = rollData;
        db.games[gameId].players[userId].totalScore += finalScore;

        // Добавляем раунд в историю игры
        db.games[gameId].rounds.push(rollData);

        await writeDatabase(db);
        return rollData;
    } catch (error) {
        console.error('Ошибка при записи броска:', error);
        throw error;
    }
}

// Получение игрока
async function getPlayer(userId) {
    try {
        const db = await readDatabase();
        return db.players[userId] || null;
    } catch (error) {
        console.error('Ошибка при получении игрока:', error);
        return null;
    }
}

// Завершение игры
async function finishGame(gameId, winnerId = null) {
    try {
        const db = await readDatabase();
        
        if (!db.games[gameId]) {
            throw new Error(`Игра с ID ${gameId} не найдена`);
        }

        db.games[gameId].status = 'completed';
        db.games[gameId].finishedAt = new Date().toISOString();
        
        if (winnerId) {
            db.games[gameId].winnerId = winnerId;
            
            // Обновляем статистику победителя
            if (db.players[winnerId]) {
                db.players[winnerId].totalWins += 1;
            }
        }

        await writeDatabase(db);
        return db.games[gameId];
    } catch (error) {
        console.error('Ошибка при завершении игры:', error);
        throw error;
    }
}

// Получение статистики игрока
async function getPlayerStats(userId) {
    try {
        const db = await readDatabase();
        const player = db.players[userId];
        
        if (!player) {
            return null;
        }

        // Подсчитываем дополнительную статистику
        const games = Object.values(db.games);
        const playerGames = games.filter(game => 
            game.players[userId] && game.status === 'completed'
        );

        const totalRolls = playerGames.reduce((sum, game) => {
            return sum + (game.rounds ? game.rounds.filter(round => round.userId === userId).length : 0);
        }, 0);

        const averageScore = totalRolls > 0 ? 
            playerGames.reduce((sum, game) => {
                const playerRounds = game.rounds ? game.rounds.filter(round => round.userId === userId) : [];
                return sum + playerRounds.reduce((roundSum, round) => roundSum + round.finalScore, 0);
            }, 0) / totalRolls : 0;

        return {
            ...player,
            totalRolls,
            averageScore: Math.round(averageScore * 100) / 100,
            winRate: player.gamesPlayed > 0 ? Math.round((player.totalWins / player.gamesPlayed) * 100) : 0
        };
    } catch (error) {
        console.error('Ошибка при получении статистики:', error);
        return null;
    }
}

// Очистка старых игр (например, старше 24 часов)
async function cleanupOldGames(hoursOld = 24) {
    try {
        const db = await readDatabase();
        const cutoffTime = new Date(Date.now() - (hoursOld * 60 * 60 * 1000));
        
        let deletedCount = 0;
        Object.keys(db.games).forEach(gameId => {
            const game = db.games[gameId];
            const gameTime = new Date(game.createdAt);
            
            if (gameTime < cutoffTime && game.status !== 'completed') {
                delete db.games[gameId];
                deletedCount++;
            }
        });

        if (deletedCount > 0) {
            await writeDatabase(db);
            console.log(`Удалено старых игр: ${deletedCount}`);
        }

        return deletedCount;
    } catch (error) {
        console.error('Ошибка при очистке старых игр:', error);
        return 0;
    }
}

// Экспорт всех методов
export {
    initDatabase,
    createGame,
    getGame,
    getActiveGameForChat,
    updateGame,
    addPlayerToGame,
    recordDiceRoll,
    getPlayer,
    finishGame,
    getPlayerStats,
    cleanupOldGames
};