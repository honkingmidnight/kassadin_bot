import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { Client, Collection, GatewayIntentBits } from 'discord.js';
import { Player } from 'discord-player';
import { YouTubeDlpExtractor, setYtDlpPath, setFFmpegPath } from 'discord-player-youtubedlp';
import 'dotenv/config';

// Ustawienie ścieżek do bundlowanych binarnych (yt-dlp + ffmpeg)
const require = createRequire(import.meta.url);
const ytdlpPath = path.resolve('node_modules', 'ytdlp-nodejs', 'bin', 'yt-dlp.exe');
const ffmpegPath = require('ffmpeg-static');
setYtDlpPath(ytdlpPath);
setFFmpegPath(ffmpegPath);
console.log('[PATHS] yt-dlp:', ytdlpPath);
console.log('[PATHS] ffmpeg:', ffmpegPath);

// Definiowanie __dirname dla ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Inicjalizacja klienta bota z uprawnieniami (Intents)
// GuildVoiceStates jest wymagane do obsługi kanałów głosowych
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
  ],
});

// Kolekcja przechowująca komendy bota
client.commands = new Collection();

// Funkcja do dynamicznego ładowania komend
async function loadCommands() {
  const foldersPath = path.join(__dirname, 'commands');
  if (!fs.existsSync(foldersPath)) return;

  const commandFolders = fs.readdirSync(foldersPath);

  for (const folder of commandFolders) {
    const commandsPath = path.join(foldersPath, folder);
    
    // Sprawdzamy czy to katalog
    if (fs.lstatSync(commandsPath).isDirectory()) {
      const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
      
      for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const fileUrl = pathToFileURL(filePath).href;
        
        try {
          const { default: command } = await import(fileUrl);
          
          // Weryfikacja struktury komendy
          if (command && 'data' in command && 'execute' in command) {
            client.commands.set(command.data.name, command);
            console.log(`[LOAD] Załadowano komendę: ${command.data.name}`);
          } else {
            console.warn(`[WARNING] Komenda w ${file} nie posiada wymaganych pól "data" lub "execute".`);
          }
        } catch (error) {
          console.error(`[ERROR] Błąd podczas ładowania komendy ${file}:`, error);
        }
      }
    }
  }
}

// Funkcja do dynamicznego ładowania zdarzeń (events)
async function loadEvents() {
  const eventsPath = path.join(__dirname, 'events');
  if (!fs.existsSync(eventsPath)) return;

  const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

  for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const fileUrl = pathToFileURL(filePath).href;

    try {
      const { default: event } = await import(fileUrl);
      
      if (event && event.name && typeof event.execute === 'function') {
        if (event.once) {
          client.once(event.name, (...args) => event.execute(...args));
        } else {
          client.on(event.name, (...args) => event.execute(...args));
        }
        console.log(`[LOAD] Załadowano zdarzenie: ${event.name}`);
      } else {
        console.warn(`[WARNING] Zdarzenie w ${file} nie posiada poprawnych pól "name" lub "execute".`);
      }
    } catch (error) {
      console.error(`[ERROR] Błąd podczas ładowania zdarzenia ${file}:`, error);
    }
  }
}

// Uruchomienie bota
async function startBot() {
  await loadCommands();
  await loadEvents();

  if (!process.env.DISCORD_TOKEN || process.env.DISCORD_TOKEN === 'your_bot_token_here') {
    console.error('[CRITICAL] Brak poprawnego tokenu DISCORD_TOKEN w pliku .env!');
    process.exit(1);
  }

  // Inicjalizacja discord-player
  const player = new Player(client);

  // Wymagane handlery błędów (discord-player v7)
  player.events.on('playerError', (queue, error) => {
    console.error('[PLAYER ERROR]', error.message);
  });
  player.events.on('error', (queue, error) => {
    console.error('[QUEUE ERROR]', error.message);
  });

  await player.extractors.register(YouTubeDlpExtractor, {
    // Wyłączamy automatyczne wykrywanie przeglądarki do cookies
    // (domyślnie próbuje Edge co powoduje HTTP 403)
    agent: { autoCookiesFromBrowser: false },
  });
  console.log('[PLAYER] discord-player zainicjalizowany z ekstraktorem YouTubeDlp.');

  client.login(process.env.DISCORD_TOKEN);
}

startBot();
