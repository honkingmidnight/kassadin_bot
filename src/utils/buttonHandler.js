import { EmbedBuilder, MessageFlags } from 'discord.js';
import { useQueue, useTimeline } from 'discord-player';
import { updatePanel } from './panelHelper.js';

/**
 * Obsługuje interakcje z przyciskami pod panelem sterowania.
 * @param {import('discord.js').ButtonInteraction} interaction 
 */
export async function handleButton(interaction) {
  const { customId, guild } = interaction;
  
  // Sprawdzamy czy użytkownik jest na kanale głosowym
  const voiceChannel = interaction.member?.voice?.channel;
  if (!voiceChannel) {
    return interaction.reply({
      content: '❌ Musisz być na kanale głosowym, aby sterować muzyką!',
      flags: MessageFlags.Ephemeral,
    });
  }

  // Sprawdzamy czy bot jest na jakimś kanale i czy to ten sam kanał
  const botVoiceChannel = guild.members.me?.voice?.channel;
  if (botVoiceChannel && voiceChannel.id !== botVoiceChannel.id) {
    return interaction.reply({
      content: '❌ Musisz być na tym samym kanale głosowym co bot!',
      flags: MessageFlags.Ephemeral,
    });
  }

  const queue = useQueue(guild.id);
  const timeline = useTimeline({ node: guild.id });

  switch (customId) {
    case 'music_pause_resume': {
      if (!timeline) {
        return interaction.reply({ content: '❌ Nic teraz nie gra!', flags: MessageFlags.Ephemeral });
      }
      const wasPaused = timeline.paused;
      wasPaused ? timeline.resume() : timeline.pause();
      
      // Aprobujemy kliknięcie i natychmiast aktualizujemy panel
      await interaction.deferUpdate();
      await updatePanel(guild);
      break;
    }

    case 'music_skip': {
      if (!queue || !queue.isPlaying()) {
        return interaction.reply({ content: '❌ Nic teraz nie gra!', flags: MessageFlags.Ephemeral });
      }
      const currentTrack = queue.currentTrack;
      queue.node.skip();
      
      await interaction.reply({
        content: `⏭️ Pominięto **${currentTrack?.title || 'utwór'}**!`,
        flags: MessageFlags.Ephemeral,
      });
      break;
    }

    case 'music_stop': {
      if (!queue) {
        return interaction.reply({ content: '❌ Bot nie jest połączony z żadnym kanałem!', flags: MessageFlags.Ephemeral });
      }
      queue.delete();
      
      await interaction.reply({
        content: '⏹️ Zatrzymano muzykę i opuszczono kanał głosowy.',
        flags: MessageFlags.Ephemeral,
      });
      
      // Dla pewności wymuszamy aktualizację panelu do stanu spoczynku
      await updatePanel(guild);
      break;
    }

    case 'music_loop': {
      if (!queue || !queue.isPlaying()) {
        return interaction.reply({ content: '❌ Nic teraz nie gra!', flags: MessageFlags.Ephemeral });
      }
      
      // Tryby: 0 = off, 1 = track, 2 = queue
      let nextMode = 0;
      let modeName = 'wyłączona ❌';
      
      if (queue.repeatMode === 0) {
        nextMode = 1;
        modeName = 'powtarzanie utworu 🔂';
      } else if (queue.repeatMode === 1) {
        nextMode = 2;
        modeName = 'powtarzanie kolejki 🔁';
      }
      
      queue.setRepeatMode(nextMode);
      
      await interaction.reply({
        content: `🔁 Ustawiono pętlę na: **${modeName}**`,
        flags: MessageFlags.Ephemeral,
      });
      
      await updatePanel(guild);
      break;
    }

    case 'music_queue': {
      if (!queue || (!queue.isPlaying() && queue.tracks.size === 0)) {
        return interaction.reply({ content: '❌ Kolejka jest pusta!', flags: MessageFlags.Ephemeral });
      }
      
      const tracks = queue.tracks.toArray();
      const pageTracks = tracks.slice(0, 10);
      const current = queue.currentTrack;

      const trackList = pageTracks.length > 0
        ? pageTracks
            .map((track, i) => `\`${i + 1}.\` **[${track.title}](${track.url})** — *${track.author}* \`${track.duration}\``)
            .join('\n')
        : '*Brak kolejnych utworów*';

      const embed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle('🎶 Kolejka utworów (Pierwsze 10)')
        .setDescription(trackList);

      if (current) {
        embed.addFields({
          name: '▶️ Teraz gra',
          value: `**[${current.title}](${current.url})** — *${current.author}* \`${current.duration}\``,
        });
      }

      if (tracks.length > 10) {
        embed.setFooter({ text: `i ${tracks.length - 10} więcej utworów w kolejce...` });
      }

      return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    }

    default:
      return interaction.reply({ content: '❌ Nieznana akcja przycisku.', flags: MessageFlags.Ephemeral });
  }
}
