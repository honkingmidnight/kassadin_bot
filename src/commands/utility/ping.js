import { SlashCommandBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Sprawdza opóźnienie bota (ping).'),
  async execute(interaction) {
    // Wysyłamy tymczasową odpowiedź i pobieramy ją, aby obliczyć czas rundy (RTT)
    await interaction.reply({ 
      content: 'Mierzenie opóźnienia...' 
    });
    const sent = await interaction.fetchReply();

    const latency = sent.createdTimestamp - interaction.createdTimestamp;
    const apiPing = Math.round(interaction.client.ws.ping);

    // Edytujemy pierwszą odpowiedź podając dokładne dane
    await interaction.editReply(
      `🏓 Pong!\n• Opóźnienie bota (RTT): \`${latency}ms\`\n• Opóźnienie API Discorda: \`${apiPing}ms\``
    );
  },
};
