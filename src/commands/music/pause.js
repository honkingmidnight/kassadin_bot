import { SlashCommandBuilder, MessageFlags } from 'discord.js';
import { useTimeline } from 'discord-player';

export default {
  data: new SlashCommandBuilder()
    .setName('pause')
    .setDescription('Wstrzymaj lub wznów odtwarzanie muzyki'),

  async execute(interaction) {
    const timeline = useTimeline({ node: interaction.guildId });

    if (!timeline) {
      return interaction.reply({
        content: '❌ Nic teraz nie gra!',
        flags: MessageFlags.Ephemeral,
      });
    }

    const wasPaused = timeline.paused;
    wasPaused ? timeline.resume() : timeline.pause();

    return interaction.reply({
      content: wasPaused ? '▶️ Wznowiono odtwarzanie!' : '⏸️ Wstrzymano odtwarzanie!',
    });
  },
};
