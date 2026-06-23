import { Events } from 'discord.js';

export default {
  name: Events.InteractionCreate,
  async execute(interaction) {
    // Interesują nas tylko interakcje będące komendami ukośnika (Slash Commands)
    if (!interaction.isChatInputCommand()) return;

    const command = interaction.client.commands.get(interaction.commandName);

    if (!command) {
      console.error(`Nie znaleziono komendy pasującej do ${interaction.commandName}.`);
      return;
    }

    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(`Błąd podczas wykonywania komendy ${interaction.commandName}:`, error);
      
      const errorMessage = { 
        content: 'Wystąpił błąd podczas wykonywania tej komendy!', 
        ephemeral: true 
      };

      // Jeśli zdążyliśmy już odpowiedzieć (replied) lub odroczyć odpowiedź (deferred), 
      // musimy wysłać followUp zamiast zwykłej odpowiedzi.
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(errorMessage);
      } else {
        await interaction.reply(errorMessage);
      }
    }
  },
};
