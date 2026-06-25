import { SlashCommandBuilder, PermissionFlagsBits, ChannelType, MessageFlags } from 'discord.js';
import { setGuildConfig } from '../../utils/configHelper.js';
import { updatePanel } from '../../utils/panelHelper.js';

export default {
  data: new SlashCommandBuilder()
    .setName('setup')
    .setDescription('Konfiguruje dedykowany kanał muzyczny dla bota')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addChannelOption(option =>
      option
        .setName('kanal')
        .setDescription('Wybierz istniejący kanał tekstowy (opcjonalnie)')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(false)
    ),

  async execute(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const selectedChannel = interaction.options.getChannel('kanal');
    let targetChannel = selectedChannel;

    try {
      // Jeśli nie wybrano kanału, tworzymy nowy o nazwie 'kassadin-music'
      if (!targetChannel) {
        targetChannel = await interaction.guild.channels.create({
          name: 'kassadin-music',
          type: ChannelType.GuildText,
          topic: '🎵 Dedykowany kanał muzyczny Kassadin Bot. Wpisz nazwę piosenki lub link, aby odtworzyć.',
        });
      }

      // Zapisz podstawową konfigurację w bazie JSON (messageId zostanie dodane automatycznie w updatePanel)
      setGuildConfig(interaction.guildId, {
        channelId: targetChannel.id,
        messageId: null,
      });

      // Wyślij panel sterowania na dedykowanym kanale
      await updatePanel(interaction.guild);

      return interaction.editReply({
        content: `✅ Pomyślnie skonfigurowano! Dedykowany kanał bota to teraz ${targetChannel}.`,
      });

    } catch (error) {
      console.error('[SETUP] Błąd podczas konfiguracji:', error);
      return interaction.editReply({
        content: `❌ Wystąpił błąd podczas konfiguracji: \`${error.message}\``,
      });
    }
  },
};
