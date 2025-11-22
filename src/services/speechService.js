import * as Speech from 'expo-speech';
import { SpeechRecognition } from 'expo-speech-recognition';
import { Audio } from 'expo-av';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const VOICE_STORAGE_KEY = '@spelling_app_selected_voice';

/**
 * Text-to-Speech Service
 * Available to all users
 */
class TextToSpeechService {
  constructor() {
    this.initialized = false;
    this.availableVoices = [];
    this.selectedVoice = null;
  }

  async initialize() {
    if (this.initialized) return;
    
    try {
      // Get available voices on the device
      this.availableVoices = await Speech.getAvailableVoicesAsync();
      
      // Check for saved voice preference
      const savedVoice = await AsyncStorage.getItem(VOICE_STORAGE_KEY);
      
      if (savedVoice) {
        // Verify saved voice is still available
        const voiceExists = this.availableVoices.find(v => v.identifier === savedVoice);
        if (voiceExists) {
          this.selectedVoice = savedVoice;
          console.log('Loaded saved voice:', savedVoice);
        } else {
          // Saved voice no longer available, select best
          this.selectedVoice = this.selectBestVoice();
        }
      } else {
        // No saved preference, select the best voice for children's education
        this.selectedVoice = this.selectBestVoice();
      }
      
      this.initialized = true;
    } catch (error) {
      console.error('TTS initialization error:', error);
      this.initialized = true; // Continue without voice selection
    }
  }

  selectBestVoice() {
    if (!this.availableVoices || this.availableVoices.length === 0) {
      return null;
    }

    // Preferred voices for children (clear, pleasant, natural-sounding)
    const preferredVoices = Platform.select({
      ios: [
        'com.apple.voice.compact.en-US.Samantha',  // Clear, friendly female voice
        'com.apple.ttsbundle.Samantha-compact',
        'com.apple.voice.enhanced.en-US.Samantha',
        'com.apple.ttsbundle.siri_female_en-US_compact', // Siri voice
        'com.apple.voice.compact.en-US.Zoe',       // Australian English, clear
        'com.apple.voice.compact.en-US.Karen',     // Good for education
      ],
      android: [
        'en-us-x-sfg#female_1-local',  // Google's high-quality female voice
        'en-us-x-sfg#female_2-local',
        'en-us-x-tpf-local',            // Clear female voice
        'en-US-language',
      ],
      default: [],
    });

    // Try to find a preferred voice
    for (const preferredId of preferredVoices) {
      const voice = this.availableVoices.find(v => 
        v.identifier === preferredId || v.identifier.includes(preferredId)
      );
      if (voice) {
        console.log('Selected voice:', voice.name, voice.identifier);
        return voice.identifier;
      }
    }

    // Fallback: Find any high-quality English voice
    const englishVoices = this.availableVoices.filter(v => 
      v.language.startsWith('en') && v.quality && v.quality === 'Enhanced'
    );
    
    if (englishVoices.length > 0) {
      console.log('Selected enhanced voice:', englishVoices[0].name);
      return englishVoices[0].identifier;
    }

    // Last resort: any English voice
    const anyEnglish = this.availableVoices.find(v => v.language.startsWith('en'));
    if (anyEnglish) {
      console.log('Selected fallback voice:', anyEnglish.name);
      return anyEnglish.identifier;
    }

    return null;
  }

  async speak(text, options = {}) {
    await this.initialize();
    
    try {
      const { rate = 0.85, pitch = 1.0 } = options;
      
      const speechOptions = {
        language: 'en-US',
        pitch: pitch,
        rate: rate,
      };

      // Use selected voice if available
      if (this.selectedVoice) {
        speechOptions.voice = this.selectedVoice;
      }
      
      Speech.speak(text, speechOptions);
    } catch (error) {
      console.error('TTS speak error:', error);
      throw error;
    }
  }

  async stop() {
    try {
      Speech.stop();
    } catch (error) {
      console.error('TTS stop error:', error);
    }
  }

  async speakWord(word, options = {}) {
    const { 
      spellOut = false, 
      repeat = 1,
      pauseBetween = 1000 
    } = options;

    if (spellOut) {
      // Spell out the word letter by letter
      const letters = word.split('').join(', ');
      await this.speak(letters, { rate: 0.3 });
    } else {
      // Speak the word normally
      for (let i = 0; i < repeat; i++) {
        await this.speak(word);
        if (i < repeat - 1) {
          await new Promise(resolve => setTimeout(resolve, pauseBetween));
        }
      }
    }
  }

  // Get list of available voices for user selection
  async getAvailableVoices() {
    await this.initialize();
    return this.availableVoices.filter(v => v.language.startsWith('en'));
  }

  // Set a specific voice by identifier
  setVoice(voiceIdentifier) {
    this.selectedVoice = voiceIdentifier;
  }

  // Get currently selected voice
  getCurrentVoice() {
    return this.selectedVoice;
  }
}

/**
 * Speech Recognition Service
 * Premium feature only
 */
class SpeechRecognitionServiceClass {
  constructor() {
    this.isListening = false;
    this.onResult = null;
    this.onError = null;
    this.hasPermission = false;
    this.listener = null;
  }

  async checkPermissions() {
    try {
      // Check both audio and speech recognition permissions
      const audioPermission = await Audio.getPermissionsAsync();
      const speechPermission = await SpeechRecognition.getPermissionsAsync();
      
      console.log('=== Permission Check ===');
      console.log('Audio permission object:', JSON.stringify(audioPermission));
      console.log('Speech permission object:', JSON.stringify(speechPermission));
      console.log('Audio granted:', audioPermission.granted);
      console.log('Audio status:', audioPermission.status);
      console.log('Speech granted:', speechPermission.granted);
      console.log('Speech status:', speechPermission.status);
      
      // Check if permissions are granted OR if status is 'granted'
      const audioGranted = audioPermission.granted === true || audioPermission.status === 'granted';
      const speechGranted = speechPermission.granted === true || speechPermission.status === 'granted';
      
      const hasPermissions = audioGranted && speechGranted;
      this.hasPermission = hasPermissions;
      
      console.log('Final check - Audio granted:', audioGranted, 'Speech granted:', speechGranted);
      console.log('Has all permissions:', hasPermissions);
      
      return hasPermissions;
    } catch (error) {
      console.error('Permission check error:', error);
      return false;
    }
  }

  async requestPermissions() {
    try {
      console.log('=== Starting permission request flow ===');
      
      // Step 1: Request microphone permission using expo-av
      console.log('Step 1: Checking microphone permission...');
      const audioPermission = await Audio.getPermissionsAsync();
      console.log('Microphone permission status:', JSON.stringify(audioPermission));
      
      const audioGranted = audioPermission.granted === true || audioPermission.status === 'granted';
      
      if (!audioGranted) {
        console.log('Requesting microphone permission...');
        const audioRequest = await Audio.requestPermissionsAsync();
        console.log('Microphone permission result:', JSON.stringify(audioRequest));
        
        const audioRequestGranted = audioRequest.granted === true || audioRequest.status === 'granted';
        
        if (!audioRequestGranted) {
          console.log('❌ Microphone permission denied');
          this.hasPermission = false;
          return false;
        }
        console.log('✅ Microphone permission granted');
      } else {
        console.log('✅ Microphone permission already granted');
      }
      
      // Step 2: Request speech recognition permission
      console.log('Step 2: Checking speech recognition permission...');
      const speechCheck = await SpeechRecognition.getPermissionsAsync();
      console.log('Speech recognition permission status:', JSON.stringify(speechCheck));
      
      const speechGranted = speechCheck.granted === true || speechCheck.status === 'granted';
      
      if (speechGranted) {
        console.log('✅ Speech recognition permission already granted');
        this.hasPermission = true;
        return true;
      }
      
      // Request speech recognition permission
      console.log('Requesting speech recognition permission...');
      const speechRequest = await SpeechRecognition.requestPermissionsAsync();
      console.log('Speech recognition permission result:', JSON.stringify(speechRequest));
      
      const speechRequestGranted = speechRequest.granted === true || speechRequest.status === 'granted';
      
      if (!speechRequestGranted) {
        console.log('❌ Speech recognition permission denied. Status:', speechRequest.status);
        this.hasPermission = false;
        return false;
      }
      
      console.log('✅ Speech recognition permission granted');
      this.hasPermission = true;
      console.log('=== All permissions granted successfully ===');
      return true;
      
    } catch (error) {
      console.error('❌ Permission request error:', error);
      this.hasPermission = false;
      return false;
    }
  }

  async startListening(callbacks = {}) {
    const { onResult, onError } = callbacks;
    
    this.onResult = onResult;
    this.onError = onError;

    try {
      // First check if we already have permissions
      const hasPermissions = await this.checkPermissions();
      
      if (!hasPermissions) {
        // Try to request permissions
        const granted = await this.requestPermissions();
        if (!granted) {
          if (onError) {
            onError(new Error('Microphone permission is required for voice input. Please enable it in your device Settings.'));
          }
          return;
        }
      }

      // Configure and activate audio session for recording
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });
        console.log('Audio session configured for recording');
      } catch (audioError) {
        console.error('Audio session configuration error:', audioError);
        if (onError) {
          onError(new Error('Failed to configure audio. Please try again.'));
        }
        return;
      }

      // Start listening
      this.isListening = true;
      
      const options = {
        lang: 'en-US',
        interimResults: false,
        maxAlternatives: 1,
        continuous: false,
        requiresOnDeviceRecognition: false,
      };

      // Remove old listener if exists to prevent memory leaks
      if (this.listener) {
        this.listener.remove();
        this.listener = null;
      }

      // Set up event handlers and store subscription
      this.listener = SpeechRecognition.addSpeechRecognitionListener((event) => {
        if (event.type === 'result') {
          const transcript = event.results?.[0]?.transcript;
          if (transcript && this.onResult) {
            this.onResult(transcript);
          }
          this.isListening = false;
        } else if (event.type === 'error') {
          if (this.onError) {
            let errorMessage = 'Voice recognition failed. Please try again.';
            
            // Provide more specific error messages
            const errorStr = String(event.error || '').toLowerCase();
            if (errorStr.includes('no-speech') || errorStr.includes('no speech')) {
              errorMessage = 'No speech detected. Please speak clearly and try again.';
            } else if (errorStr.includes('audio-capture') || errorStr.includes('audio capture')) {
              errorMessage = 'Microphone error. Please check your device settings.';
            } else if (errorStr.includes('not-allowed') || errorStr.includes('permission')) {
              errorMessage = 'Microphone permission denied. Please enable it in Settings.';
            } else if (errorStr.includes('network')) {
              errorMessage = 'Network error. Please check your internet connection.';
            } else if (event.error) {
              // Include the actual error if it's not one of the known types
              errorMessage = `Voice recognition error: ${event.error}`;
            }
            
            this.onError(new Error(errorMessage));
          }
          this.isListening = false;
        } else if (event.type === 'end') {
          this.isListening = false;
        }
      });

      await SpeechRecognition.start(options);
    } catch (error) {
      console.error('Speech recognition error:', error);
      this.isListening = false;
      if (onError) {
        const errorMessage = error?.message || String(error) || 'Voice recognition failed. Please try again.';
        onError(new Error(errorMessage));
      }
    }
  }

  async stopListening() {
    try {
      if (this.isListening) {
        await SpeechRecognition.stop();
      }
    } catch (error) {
      console.error('Stop listening error:', error);
    }
    this.isListening = false;
  }

  async cancelListening() {
    try {
      if (this.isListening) {
        await SpeechRecognition.abort();
      }
    } catch (error) {
      console.error('Cancel listening error:', error);
    }
    this.isListening = false;
  }

  async destroy() {
    await this.stopListening();
    
    // Remove event listener to prevent memory leaks
    if (this.listener) {
      this.listener.remove();
      this.listener = null;
    }
    
    this.onResult = null;
    this.onError = null;
  }
}

// Export singleton instances
export const ttsService = new TextToSpeechService();
export const speechRecognitionService = new SpeechRecognitionServiceClass();

export default {
  tts: ttsService,
  speechRecognition: speechRecognitionService,
};
