import { SlashCommandBuilder, MessageFlags } from 'discord.js';
import { useQueue } from 'discord-player';

export default {
  data: new SlashCommandBuilder()
    .setName('stop')
    .setDescription('Zatrzymaj muzykę i wyrzuć bota z kanału głosowego'),

  async execute(interaction) {
    const queue = useQueue(interaction.guildId);

    if (!queue) {
      return interaction.reply({
        content: '❌ Nic teraz nie gra!',
        flags: MessageFlags.Ephemeral,
      });
    }

    queue.delete();

    return interaction.reply({
      content: '⏹️ Zatrzymano muzykę i opuszczono kanał głosowy.',
    });
  },
};
