import { Events, MessageFlags } from 'discord.js';
import { handleButton } from '../utils/buttonHandler.js';

export default {
  name: Events.InteractionCreate,
  async execute(interaction) {
    // Obsługa przycisków panelu sterowania
    if (interaction.isButton()) {
      try {
        await handleButton(interaction);
      } catch (error) {
        console.error('[BUTTON ERROR] Błąd podczas obsługi przycisku:', error);
      }
      return;
    }

    // Interesują nas tylko interakcje będące komendami ukośnika (Slash Commands)
    if (!interaction.isChatInputCommand()) return;

    // Odrzuć interakcje stworzone PRZED uruchomieniem bota — to stare zdarzenia z poprzedniej
    // sesji, których tokeny już wygasły. Porównujemy z readyTimestamp zamiast Date.now()-2500ms,
    // żeby uniknąć problemów z różnicą zegarów między maszyną a serwerami Discord.
    if (interaction.createdTimestamp < interaction.client.readyTimestamp) {
      console.warn(`[WARN] Pominięto przestarzałą interakcję: /${interaction.commandName} (stworzona przed startem bota)`);
      return;
    }

    const command = interaction.client.commands.get(interaction.commandName);

    if (!command) {
      console.error(`Nie znaleziono komendy pasującej do ${interaction.commandName}.`);
      return;
    }

    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(`Błąd podczas wykonywania komendy ${interaction.commandName}:`, error);

      // Próbujemy poinformować użytkownika o błędzie, ale ignorujemy wszelkie problemy
      // przy wysyłaniu (np. wygasły token, timeout sieci — te błędy już zalogowano wyżej).
      try {
        const errorMessage = {
          content: 'Wystąpił błąd podczas wykonywania tej komendy!',
          flags: MessageFlags.Ephemeral,
        };

        if (interaction.replied || interaction.deferred) {
          await interaction.followUp(errorMessage);
        } else {
          await interaction.reply(errorMessage);
        }
      } catch {
        // Nie udało się wysłać komunikatu o błędzie — token wygasł lub problem z siecią
      }
    }
  },
};
