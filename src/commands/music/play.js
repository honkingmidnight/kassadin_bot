import { SlashCommandBuilder, EmbedBuilder, MessageFlags } from 'discord.js';
import { useMainPlayer, useQueue } from 'discord-player';

export default {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Odtwórz muzykę z YouTube (link lub wyszukiwanie)')
    .addStringOption(option =>
      option
        .setName('query')
        .setDescription('Tytuł piosenki, artysta lub link YouTube')
        .setRequired(true),
    ),

  async execute(interaction) {
    // deferReply musi być PIERWSZĄ operacją — Discord daje 3 sekundy na odpowiedź
    await interaction.deferReply();

    const query = interaction.options.getString('query', true);
    const voiceChannel = interaction.member?.voice?.channel;

    if (!voiceChannel) {
      return interaction.editReply({
        content: '❌ Musisz być na kanale głosowym, żeby włączyć muzykę!',
      });
    }

    const player = useMainPlayer();

    // Jeśli istnieje pusta/zakończona kolejka, usuń ją i daj chwilę na zwolnienie
    // zasobów sieciowych (socket UDP) — bez tego jest błąd "Cannot perform IP discovery"
    const existingQueue = useQueue(interaction.guildId);
    if (existingQueue && !existingQueue.isPlaying()) {
      existingQueue.delete();
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    try {
      const { track } = await player.play(voiceChannel, query, {
        requestedBy: interaction.user,
        nodeOptions: {
          metadata: {
            channel: interaction.channel,
            client: interaction.guild.members.me,
            requestedBy: interaction.user,
          },
          selfDeaf: true,
          volume: 80,
          leaveOnEmpty: true,
          leaveOnEmptyCooldown: 30000,
          leaveOnEnd: true,
          leaveOnEndCooldown: 30000,
        },
      });

      const embed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle('🎵 Dodano do kolejki')
        .setDescription(`**[${track.title}](${track.url})**`)
        .addFields(
          { name: '👤 Autor', value: track.author || 'Nieznany', inline: true },
          { name: '⏱️ Czas', value: track.duration || 'Live', inline: true },
          { name: '🙋 Dodane przez', value: `${interaction.user}`, inline: true },
        )
        .setThumbnail(track.thumbnail)
        .setFooter({ text: 'discord-player • yt-dlp' });

      return interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('[PLAY] Błąd:', error);
      return interaction.editReply({
        content: `❌ Nie udało się odtworzyć: \`${error.message}\``,
      });
    }
  },
};
