import { Bot, InlineKeyboard } from "grammy";
import { Dota2Api } from "./dota2api.js"

const dota2api = new Dota2Api(95857111)

/**
 * 
 * @param {Bot} bot 
 */
function setupHandlers(bot){
  bot.on('callback_query',ctx => {
    
  })
}
