import axios from 'axios';
import 'dotenv/config.js';

const RADIANT_SLOT_MIN = 0;
const RADIANT_SLOT_MAX = 4;
const DIRE_SLOT_MIN = 128;
const DIRE_SLOT_MAX = 132;

class Dota2API{
  constructor(dotaUserID){
    this.dotaUserID = dotaUserID;
    this.dotaApi = axios.create({
    baseURL: 'https://api.opendota.com/api',
    timeout: 5000,
  });
  }
  

  async getPlayerRecentMatches() {
    try {
      const response = await this.dotaApi.get(`/players/${this.dotaUserID}/recentMatches`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching matches for player ${this.dotaUserID}:`, error.message);
      throw error;
    }
  }

  isRadiantWin(match) {
    return match.player_slot >= RADIANT_SLOT_MIN &&
      match.player_slot <= RADIANT_SLOT_MAX &&
      match.radiant_win === true;

  }

  isDireWin(match) {
    return match.player_slot >= DIRE_SLOT_MIN &&
      match.player_slot <= DIRE_SLOT_MAX &&
      match.radiant_win === false;
  }
  
  async getWinsFromRecentMatches() {
    if (typeof this.dotaUserID !== 'number') {
      throw new Error('dotaUserID должен быть числовым')
    }
    const matches = await this.getPlayerRecentMatches(this.dotaUserID);
    const wins = matches.filter((match) => this.isRadiantWin(match) || this.isDireWin(match));
    return wins;
  }
}

const dota2Api = new Dota2API(95857111);
const response = await dota2Api.getWinsFromRecentMatches();
// dota2Api.getWinsFromRecentMatches().then(response => console.log(response.length))
console.log(response)

export {Dota2API};