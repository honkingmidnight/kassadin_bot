import { Events } from 'discord.js';
import { useMainPlayer, useQueue } from 'discord-player';
import { getGuildConfig } from '../utils/configHelper.js';

export default {
  name: Events.MessageCreate,
  async execute(message) {
    // Ignorujemy wiadomości bezpośrednie (DM) oraz od botów
    if (!message.guild || message.author.bot) return;

    // Pobierz konfigurację dedykowanego kanału dla serwera
    const config = getGuildConfig(message.guild.id);
    if (!config || !config.channelId || message.channel.id !== config.channelId) {
      return;
    }

    // Natychmiast usuwamy wiadomość użytkownika, aby zachować porządek na kanale
    await message.delete().catch(() => null);

    const voiceChannel = message.member?.voice?.channel;
    if (!voiceChannel) {
      const errorMsg = await message.channel.send(`❌ ${message.author}, musisz być na kanale głosowym, aby włączyć muzykę!`);
      setTimeout(() => errorMsg.delete().catch(() => null), 5000);
      return;
    }

    const player = useMainPlayer();
    const query = message.content.trim();

    if (!query) return;

    // Rozwiązanie problemu ponownego bindowania portu UDP (identycznie jak w play.js)
    const existingQueue = useQueue(message.guild.id);
    if (existingQueue && !existingQueue.isPlaying()) {
      existingQueue.delete();
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    try {
      // Wyślij informację o wyszukiwaniu, którą usuniemy po dodaniu piosenki
      const loadingMsg = await message.channel.send(`🔍 Wyszukiwanie: \`${query}\`...`);

      const { track } = await player.play(voiceChannel, query, {
        requestedBy: message.author,
        nodeOptions: {
          metadata: {
            channel: message.channel,
            client: message.guild.members.me,
            requestedBy: message.author,
          },
          selfDeaf: true,
          volume: 80,
          leaveOnEmpty: true,
          leaveOnEmptyCooldown: 30000,
          leaveOnEnd: true,
          leaveOnEndCooldown: 30000,
        },
      });

      // Usuwamy komunikat o wyszukiwaniu
      await loadingMsg.delete().catch(() => null);

      // Wysyłamy informację o dodaniu do kolejki i usuwamy ją po 5 sekundach
      const successMsg = await message.channel.send(`✅ Dodano **${track.title}** do kolejki!`);
      setTimeout(() => successMsg.delete().catch(() => null), 5000);

    } catch (error) {
      console.error('[MESSAGE_PLAY] Błąd:', error);
      const errorMsg = await message.channel.send(`❌ Nie udało się odtworzyć: \`${error.message}\``);
      setTimeout(() => errorMsg.delete().catch(() => null), 5000);
    }
  },
};
