import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { useQueue } from 'discord-player';
import { getGuildConfig, setGuildConfig } from './configHelper.js';

/**
 * Aktualizuje wiadomość z panelem sterowania na dedykowanym kanale.
 * Jeśli wiadomość nie istnieje, wysyła nową i zapisuje jej ID w konfiguracji.
 * @param {import('discord.js').Guild} guild 
 */
export async function updatePanel(guild) {
  const config = getGuildConfig(guild.id);
  if (!config || !config.channelId) return;

  // Pobierz kanał
  const channel = guild.channels.cache.get(config.channelId) || await guild.channels.fetch(config.channelId).catch(() => null);
  if (!channel) {
    console.error(`[PANEL] Nie znaleziono kanału o ID ${config.channelId} na serwerze ${guild.name}`);
    return;
  }

  const queue = useQueue(guild.id);
  const isPlaying = queue && queue.isPlaying();
  const currentTrack = isPlaying ? queue.currentTrack : null;

  const embed = new EmbedBuilder();
  const row = new ActionRowBuilder();

  const isIdle = !currentTrack;
  
  // Przycisk Pauza/Wznów
  const isPaused = queue && queue.node.isPaused();
  const pauseResumeBtn = new ButtonBuilder()
    .setCustomId('music_pause_resume')
    .setLabel(isPaused ? '▶️ Wznów' : '⏸️ Pauza')
    .setStyle(isPaused ? ButtonStyle.Success : ButtonStyle.Primary)
    .setDisabled(isIdle);

  // Przycisk Pomiń
  const skipBtn = new ButtonBuilder()
    .setCustomId('music_skip')
    .setLabel('⏭️ Pomiń')
    .setStyle(ButtonStyle.Secondary)
    .setDisabled(isIdle);

  // Przycisk Zatrzymaj
  const stopBtn = new ButtonBuilder()
    .setCustomId('music_stop')
    .setLabel('⏹️ Zatrzymaj')
    .setStyle(ButtonStyle.Danger)
    .setDisabled(isIdle);

  // Przycisk Pętla
  let loopLabel = '🔁 Pętla';
  let loopStyle = ButtonStyle.Secondary;
  if (queue) {
    if (queue.repeatMode === 1) {
      loopLabel = '🔂 Utwór';
      loopStyle = ButtonStyle.Success;
    } else if (queue.repeatMode === 2) {
      loopLabel = '🔁 Kolejka';
      loopStyle = ButtonStyle.Success;
    }
  }
  const loopBtn = new ButtonBuilder()
    .setCustomId('music_loop')
    .setLabel(loopLabel)
    .setStyle(loopStyle)
    .setDisabled(isIdle);

  // Przycisk Kolejka
  const queueBtn = new ButtonBuilder()
    .setCustomId('music_queue')
    .setLabel('📜 Kolejka')
    .setStyle(ButtonStyle.Secondary)
    .setDisabled(isIdle);

  row.addComponents(pauseResumeBtn, skipBtn, stopBtn, loopBtn, queueBtn);

  if (isIdle) {
    embed
      .setColor(0x2b2d31)
      .setTitle('Kassadin Bot | Panel Muzyczny')
      .setDescription('Dołącz do kanału głosowego i wpisz nazwę utworu lub link poniżej, aby rozpocząć odtwarzanie!\n\n*Wszystkie komendy na tym kanale są obsługiwane automatycznie.*')
      .setThumbnail(guild.client.user.displayAvatarURL());
  } else {
    let loopText = 'Wyłączona';
    if (queue.repeatMode === 1) loopText = 'Powtarzaj utwór';
    else if (queue.repeatMode === 2) loopText = 'Powtarzaj kolejkę';

    embed
      .setColor(0x5865f2)
      .setTitle('🎵 Teraz odtwarzane')
      .setDescription(`**[${currentTrack.title}](${currentTrack.url})**`)
      .setThumbnail(currentTrack.thumbnail)
      .addFields(
        { name: '👤 Autor', value: currentTrack.author || 'Nieznany', inline: true },
        { name: '⏱️ Czas trwania', value: currentTrack.duration || 'Live', inline: true },
        { name: '🙋 Zamówione przez', value: `${currentTrack.requestedBy || 'System'}`, inline: true },
        { name: '🔁 Pętla', value: loopText, inline: true }
      )
      .setFooter({ text: 'discord-player • Kassadin Bot Control Panel' });
  }

  // Pobierz lub wyślij wiadomość panelu
  let message = null;
  if (config.messageId) {
    message = await channel.messages.fetch(config.messageId).catch(() => null);
  }

  try {
    if (message) {
      await message.edit({ embeds: [embed], components: [row] });
    } else {
      // Usuń wszelkie stare wiadomości bota na tym kanale przed wysłaniem nowego panelu, aby utrzymać porządek
      const messages = await channel.messages.fetch({ limit: 50 }).catch(() => null);
      if (messages) {
        const botMessages = messages.filter(m => m.author.id === guild.client.user.id);
        for (const m of botMessages.values()) {
          await m.delete().catch(() => null);
        }
      }

      const newMsg = await channel.send({ embeds: [embed], components: [row] });
      config.messageId = newMsg.id;
      setGuildConfig(guild.id, config);
    }
  } catch (error) {
    console.error('[PANEL] Wystąpił błąd przy aktualizacji panelu sterowania:', error);
  }
}
