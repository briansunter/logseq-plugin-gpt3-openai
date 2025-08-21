# AAC Audio Support for Logseq OpenAI Plugin

This enhancement adds support for transcribing AAC audio files (commonly used by iOS Voice Memos and other recording apps) in the Logseq OpenAI plugin through integration with an external conversion service.

## What's New

The Logseq OpenAI plugin now supports AAC audio files for transcription by:
- Automatically detecting AAC files in your notes
- Converting them to M4A format via an external service
- Seamlessly sending the converted audio to OpenAI's Whisper API
- Providing fallback strategies when the converter is unavailable

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐     ┌──────────┐
│   Logseq    │────▶│  External    │────▶│   FFmpeg    │────▶│ Whisper  │
│   Plugin    │◀────│  Converter   │◀────│  Service    │     │   API    │
└─────────────┘     └──────────────┘     └─────────────┘     └──────────┘
     (AAC)              (HTTP)              (M4A)                (Text)
```

## Plugin Features

- ✅ **Automatic AAC Detection**: Plugin recognizes AAC files in markdown blocks
- ✅ **Seamless Conversion**: Transparently converts AAC to M4A before sending to Whisper
- ✅ **Configurable Service**: Set custom host/port for the conversion service
- ✅ **Health Checking**: Verifies converter availability before attempting conversion
- ✅ **Graceful Fallbacks**: Multiple strategies when conversion fails
- ✅ **Progress Notifications**: Real-time status updates during conversion
- ✅ **Error Handling**: Clear error messages and troubleshooting guidance

## Prerequisites

1. **Logseq OpenAI Plugin** (this plugin) installed and configured
2. **External AAC Converter Service** running (see installation below)
3. **OpenAI API Key** configured in plugin settings

## Installing the Converter Service

The AAC conversion functionality requires a separate converter service. Install it from:

**👉 [AAC Audio Converter Service](https://github.com/GonzRon/logseq-audio-converter-server)**

Follow the installation instructions in that repository to set up the converter service on your machine.

## Plugin Configuration

Once the converter service is running, configure the plugin settings in Logseq:

### Settings

Go to **Settings → Plugins → OpenAI Plugin** and configure:

| Setting | Default | Description |
|---------|---------|-------------|
| **AAC Converter Host** | `127.0.0.1` | IP address of the converter service |
| **AAC Converter Port** | `3456` | Port number of the converter service |

### Testing Connection

After configuration, test the connection using the command palette:
- Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac)
- Search for "Test AAC Converter Connection"
- Or use the keyboard shortcut: `Mod+Shift+A`

## Usage

### Basic Usage

1. **Add AAC audio file** to a Logseq block:
   ```markdown
   ![Voice Recording](assets/recording.aac)
   ```

2. **Trigger transcription**:
   - Right-click the block → Select "whisper"
   - Or type `/whisper` and press Enter
   - Or use the keyboard shortcut (if configured)

3. **Automatic Processing**:
   - Plugin detects AAC format
   - Converts to M4A via external service
   - Sends to OpenAI Whisper API
   - Inserts transcription below the audio block

### Supported Audio Formats

The plugin now supports all these formats:
- **MP3** (direct to Whisper)
- **MP4** (direct to Whisper)
- **M4A** (direct to Whisper)
- **WAV** (direct to Whisper)
- **WEBM** (direct to Whisper)
- **AAC** ✨ (converted to M4A first)

### Status Messages

During AAC processing, you'll see these status updates:
- "Checking AAC converter availability..."
- "Converting AAC to M4A..."
- "AAC conversion successful!"
- "Transcribing audio..."
- "Transcription complete!"

## Fallback Behavior

When the converter service is unavailable, the plugin will:

1. **Browser Fallback**: Attempt to use browser's native AAC support
2. **User Guidance**: Provide instructions for manual conversion
3. **Clear Messaging**: Explain why conversion failed and next steps

## Troubleshooting

### Common Issues

**"AAC Converter server not available"**
- Ensure the converter service is running
- Check host/port settings match the service configuration
- Verify firewall isn't blocking the connection

**"No supported audio file found"**
- Check that your audio file has the correct extension (.aac)
- Ensure the markdown link format is correct: `![description](path/to/file.aac)`

**"Conversion failed"**
- Check the converter service logs
- Verify FFmpeg is installed on the service machine
- Try converting the file manually using FFmpeg

### Debug Steps

1. **Test converter connection**:
   - Use `Mod+Shift+A` or command palette "Test AAC Converter Connection"

2. **Check browser console**:
   - Press `F12` → Console tab
   - Look for AAC conversion related messages

3. **Verify file path**:
   - Ensure AAC file exists at the specified path
   - Check file permissions

### Manual Conversion Workaround

If the service is unavailable, convert files manually:

```bash
# Using FFmpeg (if installed locally)
ffmpeg -i recording.aac recording.m4a

# Then update your Logseq block
![Recording](assets/recording.m4a)
```

## Advanced Configuration

### Remote Converter Service

To use a converter service on another machine:

1. Configure the converter service to accept remote connections
2. Update plugin settings:
   - **AAC Converter Host**: `192.168.1.100` (example IP)
   - **AAC Converter Port**: `3456`

### Security Considerations

- The plugin only sends audio data for conversion (no other content)
- All communication with the converter service is over HTTP (local network)
- Temporary files are automatically cleaned up by the service
- No audio data is permanently stored by the converter

## Error Messages Reference

| Message | Meaning | Solution |
|---------|---------|----------|
| "AAC Converter server not available" | Service isn't running or unreachable | Start/restart converter service |
| "Conversion timed out" | File too large or service overloaded | Try smaller file or restart service |
| "No supported audio file found" | File format not recognized | Check file extension and path |
| "Failed to load audio file" | File doesn't exist or permission issue | Verify file path and permissions |

## Performance Notes

- **Conversion Speed**: Typically 1-3 seconds for voice recordings
- **File Size**: M4A files are ~10% smaller than equivalent MP3
- **Concurrent Processing**: Service can handle multiple files simultaneously
- **Memory Usage**: Minimal impact on Logseq performance

## Limitations

- Requires separate converter service installation
- AAC conversion requires internet connection if service is remote
- Large audio files may take longer to process
- Service must be running before attempting AAC transcription

## Development

For developers working on this plugin:

### Testing AAC Support

```typescript
import { testConverterConnection } from './lib/audio';

// Test converter availability
await testConverterConnection();
```

### Configuration Access

```typescript
import { getOpenaiSettings } from './lib/settings';

const settings = getOpenaiSettings();
console.log(`Converter at ${settings.converterHost}:${settings.converterPort}`);
```

## Support

For issues related to:
- **Plugin AAC Support**: Check this plugin's issues/documentation
- **Converter Service**: See [converter service repository](https://github.com/GonzRon/logseq-audio-converter-server)
- **OpenAI/Whisper**: Verify API key and quota limits
- **General Plugin Usage**: Check main plugin documentation

## What's Changed

### New Files
- `src/lib/audio.ts` - Enhanced audio handling with AAC support
- Updated `src/lib/settings.ts` - Added converter service configuration
- Updated `src/lib/rawCommands.ts` - Uses enhanced audio handler

### New Settings
- `converterHost` - Converter service IP address
- `converterPort` - Converter service port number

### New Features
- AAC file detection and conversion
- Health checking for converter service
- Graceful fallback handling
- Enhanced error messages and user guidance