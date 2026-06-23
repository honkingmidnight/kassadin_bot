import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { REST, Routes } from 'discord.js';
import 'dotenv/config';

// Definiowanie __dirname dla ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const commands = [];
const foldersPath = path.join(__dirname, 'commands');

async function gatherCommands() {
  if (!fs.existsSync(foldersPath)) return;
  const commandFolders = fs.readdirSync(foldersPath);

  for (const folder of commandFolders) {
    const commandsPath = path.join(foldersPath, folder);
    
    if (fs.lstatSync(commandsPath).isDirectory()) {
      const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
      
      for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const fileUrl = pathToFileURL(filePath).href;
        
        try {
          const { default: command } = await import(fileUrl);
          if (command && 'data' in command && 'execute' in command) {
            commands.push(command.data.toJSON());
          } else {
            console.warn(`[WARNING] Komenda w ${file} nie posiada wymaganych pól "data" lub "execute".`);
          }
        } catch (error) {
          console.error(`[ERROR] Błąd ładowania komendy w ${file}:`, error);
        }
      }
    }
  }
}

async function deploy() {
  await gatherCommands();

  const token = process.env.DISCORD_TOKEN;
  const clientId = process.env.CLIENT_ID;
  const guildId = process.env.GUILD_ID;

  if (!token || token === 'your_bot_token_here') {
    console.error('[CRITICAL] Brak poprawnego tokenu DISCORD_TOKEN w .env!');
    process.exit(1);
  }

  if (!clientId || clientId === 'your_client_id_here') {
    console.error('[CRITICAL] Brak poprawnego CLIENT_ID w .env!');
    process.exit(1);
  }

  const rest = new REST().setToken(token);

  try {
    console.log(`Rozpoczęto odświeżanie ${commands.length} komend aplikacji (/).`);

    // Jeśli podano GUILD_ID w .env, wdrażamy lokalnie (odświeża się natychmiast na wybranym serwerze)
    if (guildId && guildId !== 'your_guild_id_here') {
      console.log(`Rejestracja komend lokalnie na serwerze o ID: ${guildId}`);
      const data = await rest.put(
        Routes.applicationGuildCommands(clientId, guildId),
        { body: commands }
      );
      console.log(`Pomyślnie zarejestrowano ${data.length} komend lokalnie.`);
    } else {
      // W przeciwnym wypadku wdrażamy globalnie
      console.log('Rejestracja komend globalnie (może minąć do godziny, zanim komendy będą widoczne)...');
      const data = await rest.put(
        Routes.applicationCommands(clientId),
        { body: commands }
      );
      console.log(`Pomyślnie zarejestrowano ${data.length} komend globalnie.`);
    }
  } catch (error) {
    console.error('[CRITICAL] Wystąpił błąd podczas rejestracji komend:', error);
  }
}

deploy();
