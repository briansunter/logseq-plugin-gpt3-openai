// src/lib/audio.ts
import "@logseq/libs";

export interface AudioConversionConfig {
  converterHost?: string;
  converterPort?: number;
  timeout?: number;
}

export class AudioConverter {
  private serverUrl: string;
  private timeout: number;

  constructor(config: AudioConversionConfig = {}) {
    const host = config.converterHost || '127.0.0.1';
    const port = config.converterPort || 3456;
    this.timeout = config.timeout || 30000; // 30 seconds default
    this.serverUrl = `http://${host}:${port}`;
  }

  async checkServerHealth(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout for health check

      const response = await fetch(`${this.serverUrl}/health`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        return data.status === 'running' && data.ffmpeg_available;
      }
      return false;
    } catch (error) {
      console.error('AAC Converter server health check failed:', error);
      return false;
    }
  }

  async convertAACToM4A(aacBlob: Blob, filename: string): Promise<Blob> {
    const formData = new FormData();
    formData.append('file', aacBlob, filename);
    formData.append('output_format', 'm4a');

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(`${this.serverUrl}/convert`, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Conversion failed: ${response.status} - ${errorText}`);
      }

      return await response.blob();
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Conversion timed out');
      }
      console.error('AAC to M4A conversion failed:', error);
      throw error;
    }
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const isHealthy = await this.checkServerHealth();
      if (isHealthy) {
        return {
          success: true,
          message: `✅ Connected to AAC Converter at ${this.serverUrl}`
        };
      } else {
        return {
          success: false,
          message: `❌ AAC Converter not available at ${this.serverUrl}. Check if the service is running.`
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `❌ Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
}

// Enhanced version of getAudioFile with AAC support
export async function getEnhancedAudioFile(content: string): Promise<File | null> {
  // Updated regex to include AAC files
  const regex = /!\[.*?\]\((.+\.(mp3|mp4|mpeg|mpga|m4a|wav|webm|aac))\)/i;
  const path = (await logseq.App.getCurrentGraph())?.path;
  const match = regex.exec(content);

  if (!match || !match[1]) {
    console.log('No audio file found in content:', content);
    return null;
  }

  // Get extension from file path
  const extension = match[1].split(".").pop()?.toLowerCase();
  if (!extension) {
    console.error('No file extension found');
    return null;
  }

  // Remove ../ from path and clean up
  const filepath = match[1].replace("../", "").replace(/^assets\//, "assets/");
  // Get filename from path
  const filename = filepath.split('/').pop() || `audio.${extension}`;
  const fullFilename = "file://" + path + "/" + filepath;

  console.log('Processing audio file:', { filepath, filename, extension, fullFilename });

  try {
    const response = await fetch(fullFilename);
    if (!response.ok) {
      throw new Error(`Failed to fetch audio file: ${response.status} ${response.statusText}`);
    }

    const audioBlob = await response.blob();
    console.log('Audio blob loaded:', { size: audioBlob.size, type: audioBlob.type });

    // If it's an AAC file, convert it to M4A
    if (extension === 'aac') {
      return await handleAACFile(audioBlob, filename);
    }

    // For non-AAC files, return as before
    const file = new File([audioBlob], filename, { type: `audio/${extension}` });
    return file;

  } catch (error) {
    console.error('Failed to get audio file:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logseq.App.showMsg(`Failed to load audio file: ${errorMessage}`, "error");
    return null;
  }
}

async function handleAACFile(aacBlob: Blob, filename: string): Promise<File | null> {
  try {
    // Get converter configuration from settings
    const converterHost = logseq.settings?.["converterHost"] || '127.0.0.1';
    const converterPort = logseq.settings?.["converterPort"] || 3456;

    console.log('AAC conversion config:', { converterHost, converterPort });

    const converter = new AudioConverter({
      converterHost,
      converterPort,
      timeout: 60000 // 60 seconds for conversion
    });

    // Check if server is available
    logseq.App.showMsg("Checking AAC converter availability...", "info");
    const serverAvailable = await converter.checkServerHealth();

    if (!serverAvailable) {
      const errorMsg = `AAC Converter server not available at ${converterHost}:${converterPort}. ` +
        "Please ensure the converter service is running.";

      console.warn(errorMsg);
      logseq.App.showMsg(errorMsg, "warning");

      // Try browser fallback
      return await tryBrowserFallback(aacBlob, filename);
    }

    // Show conversion in progress
    logseq.App.showMsg("Converting AAC to M4A...", "info");

    // Convert the file
    const m4aBlob = await converter.convertAACToM4A(aacBlob, filename);
    const m4aFilename = filename.replace(/\.aac$/i, '.m4a');

    console.log('AAC conversion successful:', { originalSize: aacBlob.size, convertedSize: m4aBlob.size });
    logseq.App.showMsg("AAC conversion successful!", "success");

    return new File([m4aBlob], m4aFilename, { type: 'audio/m4a' });

  } catch (error) {
    console.error('AAC conversion failed:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorMsg = `AAC conversion failed: ${errorMessage}. ` +
      "You can convert the file manually using FFmpeg or an online converter.";

    logseq.App.showMsg(errorMsg, "error");

    // Try browser fallback as last resort
    return await tryBrowserFallback(aacBlob, filename);
  }
}

async function tryBrowserFallback(aacBlob: Blob, filename: string): Promise<File | null> {
  try {
    console.log('Attempting browser fallback for AAC file');

    // Try to use the browser's native audio API
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

    try {
      // Attempt to decode the AAC audio
      const arrayBuffer = await aacBlob.arrayBuffer();
      await audioContext.decodeAudioData(arrayBuffer);

      // If successful, the browser can handle this AAC file
      console.log('Browser can decode AAC, sending as-is to Whisper');
      logseq.App.showMsg("Using browser AAC support", "info");

      return new File([aacBlob], filename, { type: 'audio/aac' });

    } catch (decodeError) {
      console.log('Browser cannot decode AAC directly:', decodeError);
    } finally {
      audioContext.close();
    }

  } catch (error) {
    console.error('Browser fallback failed:', error);
  }

  // Final fallback: inform user about manual conversion
  const helpMsg = "This AAC file needs conversion. Please:\n" +
    "1. Start the AAC converter service, or\n" +
    "2. Convert manually using FFmpeg: ffmpeg -i audio.aac audio.m4a\n" +
    "3. Use an online converter or Audacity/VLC";

  logseq.App.showMsg(helpMsg, "warning");

  return null;
}

// Test function to verify server connection
export async function testConverterConnection(): Promise<void> {
  const converterHost = logseq.settings?.["converterHost"] || '127.0.0.1';
  const converterPort = logseq.settings?.["converterPort"] || 3456;

  const converter = new AudioConverter({
    converterHost,
    converterPort
  });

  const result = await converter.testConnection();

  logseq.App.showMsg(result.message, result.success ? "success" : "error");
}

// Export for use in rawCommands.ts
export { getEnhancedAudioFile as getAudioFile };