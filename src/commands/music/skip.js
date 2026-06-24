import { SlashCommandBuilder, MessageFlags } from 'discord.js';
import { useQueue } from 'discord-player';

export default {
  data: new SlashCommandBuilder()
    .setName('skip')
    .setDescription('Pomiń aktualnie odtwarzany utwór'),

  async execute(interaction) {
    const queue = useQueue(interaction.guildId);

    if (!queue || !queue.isPlaying()) {
      return interaction.reply({
        content: '❌ Nic teraz nie gra!',
        flags: MessageFlags.Ephemeral,
      });
    }

    const currentTrack = queue.currentTrack;
    queue.node.skip();

    return interaction.reply({
      content: `⏭️ Pominięto **${currentTrack?.title ?? 'utwór'}**!`,
    });
  },
};
