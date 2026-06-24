import { SlashCommandBuilder, EmbedBuilder, MessageFlags } from 'discord.js';
import { useQueue } from 'discord-player';

const TRACKS_PER_PAGE = 10;

export default {
  data: new SlashCommandBuilder()
    .setName('queue')
    .setDescription('Pokaż aktualną kolejkę utworów')
    .addIntegerOption(option =>
      option
        .setName('strona')
        .setDescription('Numer strony kolejki')
        .setMinValue(1),
    ),

  async execute(interaction) {
    const queue = useQueue(interaction.guildId);

    if (!queue || (!queue.isPlaying() && queue.tracks.size === 0)) {
      return interaction.reply({
        content: '❌ Kolejka jest pusta!',
        flags: MessageFlags.Ephemeral,
      });
    }

    const page = (interaction.options.getInteger('strona') ?? 1) - 1;
    const tracks = queue.tracks.toArray();
    const totalPages = Math.max(1, Math.ceil(tracks.length / TRACKS_PER_PAGE));

    if (page >= totalPages) {
      return interaction.reply({
        content: `❌ Ta strona nie istnieje! Dostępne strony: 1–${totalPages}`,
        flags: MessageFlags.Ephemeral,
      });
    }

    const pageTracks = tracks.slice(page * TRACKS_PER_PAGE, (page + 1) * TRACKS_PER_PAGE);
    const current = queue.currentTrack;

    const trackList = pageTracks.length > 0
      ? pageTracks
          .map((track, i) => `\`${page * TRACKS_PER_PAGE + i + 1}.\` **[${track.title}](${track.url})** — *${track.author}* \`${track.duration}\``)
          .join('\n')
      : '*Brak kolejnych utworów*';

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle('🎶 Kolejka utworów')
      .setDescription(trackList)
      .setFooter({ text: `Strona ${page + 1}/${totalPages} • ${tracks.length} utwór(ów) w kolejce` });

    if (current) {
      embed.addFields({
        name: '▶️ Teraz gra',
        value: `**[${current.title}](${current.url})** — *${current.author}* \`${current.duration}\``,
      });
    }

    return interaction.reply({ embeds: [embed] });
  },
};
