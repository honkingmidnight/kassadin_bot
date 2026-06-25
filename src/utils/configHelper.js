import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '..', 'data');
const CONFIG_FILE = path.join(DATA_DIR, 'guildConfigs.json');

// Upewnij się, że katalog data istnieje
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

/**
 * Odczytuje wszystkie konfiguracje z pliku JSON.
 * @returns {Record<string, { channelId: string, messageId: string }>}
 */
export function loadConfigs() {
  if (!fs.existsSync(CONFIG_FILE)) {
    return {};
  }
  try {
    const data = fs.readFileSync(CONFIG_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('[CONFIG] Błąd podczas odczytu pliku konfiguracji:', error);
    return {};
  }
}

/**
 * Zapisuje wszystkie konfiguracje do pliku JSON.
 * @param {Record<string, { channelId: string, messageId: string }>} configs 
 */
export function saveConfigs(configs) {
  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(configs, null, 2), 'utf-8');
  } catch (error) {
    console.error('[CONFIG] Błąd podczas zapisu pliku konfiguracji:', error);
  }
}

/**
 * Pobiera konfigurację dla konkretnej gildii.
 * @param {string} guildId 
 * @returns {{ channelId: string, messageId: string }|null}
 */
export function getGuildConfig(guildId) {
  const configs = loadConfigs();
  return configs[guildId] || null;
}

/**
 * Zapisuje konfigurację dla konkretnej gildii.
 * @param {string} guildId 
 * @param {{ channelId: string, messageId: string }} config 
 */
export function setGuildConfig(guildId, config) {
  const configs = loadConfigs();
  configs[guildId] = config;
  saveConfigs(configs);
}

/**
 * Usuwa konfigurację dla konkretnej gildii.
 * @param {string} guildId 
 */
export function deleteGuildConfig(guildId) {
  const configs = loadConfigs();
  if (configs[guildId]) {
    delete configs[guildId];
    saveConfigs(configs);
  }
}
