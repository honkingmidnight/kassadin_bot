import { Events } from 'discord.js';

export default {
  name: Events.ClientReady,
  once: true,
  execute(client) {
    console.log(`[READY] Zalogowano pomyślnie jako ${client.user.tag}!`);
    console.log(`[INFO] Bot jest teraz gotowy do pracy.`);
  },
};
