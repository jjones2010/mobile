import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ttsService } from '../services/speechService';

const VOICE_STORAGE_KEY = '@spelling_app_selected_voice';

const VoiceSettingsScreen = ({ navigation }) => {
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [testingVoice, setTestingVoice] = useState(null);

  useEffect(() => {
    loadVoices();
  }, []);

  const loadVoices = async () => {
    try {
      // Get available voices
      const availableVoices = await ttsService.getAvailableVoices();
      setVoices(availableVoices);

      // Get currently selected voice
      const currentVoice = ttsService.getCurrentVoice();
      
      // Load saved preference
      const savedVoice = await AsyncStorage.getItem(VOICE_STORAGE_KEY);
      
      setSelectedVoice(savedVoice || currentVoice);
    } catch (error) {
      console.error('Error loading voices:', error);
      Alert.alert('Error', 'Failed to load available voices');
    } finally {
      setLoading(false);
    }
  };

  const handleVoiceSelect = async (voice) => {
    try {
      // Update selected voice
      setSelectedVoice(voice.identifier);
      
      // Save to TTS service
      ttsService.setVoice(voice.identifier);
      
      // Save preference
      await AsyncStorage.setItem(VOICE_STORAGE_KEY, voice.identifier);
      
      // Test the voice
      await testVoice(voice);
    } catch (error) {
      console.error('Error selecting voice:', error);
      Alert.alert('Error', 'Failed to select voice');
    }
  };

  const testVoice = async (voice) => {
    try {
      setTestingVoice(voice.identifier);
      
      // Stop any current speech
      await ttsService.stop();
      
      // Save current voice
      const previousVoice = ttsService.getCurrentVoice();
      
      // Temporarily set test voice
      ttsService.setVoice(voice.identifier);
      
      // Test with a sample word
      await ttsService.speak('Hello! This is how I sound when speaking words.');
      
      // Restore previous voice if different from selected
      if (voice.identifier !== selectedVoice && previousVoice) {
        ttsService.setVoice(previousVoice);
      }
      
      // Wait a bit before clearing the testing state
      setTimeout(() => {
        setTestingVoice(null);
      }, 3000);
    } catch (error) {
      console.error('Error testing voice:', error);
      setTestingVoice(null);
    }
  };

  const resetToDefault = async () => {
    Alert.alert(
      'Reset to Default',
      'This will reset to the automatically selected voice. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          onPress: async () => {
            try {
              // Remove saved preference
              await AsyncStorage.removeItem(VOICE_STORAGE_KEY);
              
              // Reinitialize to get default
              ttsService.initialized = false;
              await ttsService.initialize();
              
              const defaultVoice = ttsService.getCurrentVoice();
              setSelectedVoice(defaultVoice);
              
              Alert.alert('Success', 'Voice reset to default');
            } catch (error) {
              Alert.alert('Error', 'Failed to reset voice');
            }
          },
        },
      ]
    );
  };

  const getVoiceQualityBadge = (quality) => {
    const badges = {
      'Enhanced': { text: 'Enhanced', color: '#10b981' },
      'Premium': { text: 'Premium', color: '#8b5cf6' },
      'Default': { text: 'Standard', color: '#6b7280' },
    };
    
    return badges[quality] || badges['Default'];
  };

  const renderVoiceItem = ({ item }) => {
    const isSelected = selectedVoice === item.identifier;
    const isTesting = testingVoice === item.identifier;
    const qualityBadge = getVoiceQualityBadge(item.quality);

    return (
      <TouchableOpacity
        style={[styles.voiceCard, isSelected && styles.voiceCardSelected]}
        onPress={() => handleVoiceSelect(item)}
      >
        <View style={styles.voiceInfo}>
          <View style={styles.voiceHeader}>
            <Text style={[styles.voiceName, isSelected && styles.voiceNameSelected]}>
              {item.name}
            </Text>
            {isSelected && <Text style={styles.selectedBadge}>✓ Selected</Text>}
          </View>
          
          <Text style={styles.voiceLanguage}>{item.language}</Text>
          
          <View style={styles.voiceFooter}>
            <View style={[styles.qualityBadge, { backgroundColor: qualityBadge.color + '20' }]}>
              <Text style={[styles.qualityText, { color: qualityBadge.color }]}>
                {qualityBadge.text}
              </Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.testButton}
          onPress={() => testVoice(item)}
          disabled={isTesting}
        >
          {isTesting ? (
            <ActivityIndicator size="small" color="#3b82f6" />
          ) : (
            <Text style={styles.testButtonText}>🔊 Test</Text>
          )}
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading voices...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.title}>Voice Settings</Text>
          <Text style={styles.subtitle}>
            Choose the voice you prefer for word pronunciation
          </Text>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoIcon}>💡</Text>
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Tip</Text>
            <Text style={styles.infoText}>
              Tap "Test" to hear how each voice sounds. Enhanced and Premium voices sound more natural.
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Available Voices ({voices.length})</Text>
          
          {voices.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No voices available</Text>
              <Text style={styles.emptySubtext}>
                Check your device's text-to-speech settings
              </Text>
            </View>
          ) : (
            <FlatList
              data={voices}
              renderItem={renderVoiceItem}
              keyExtractor={(item) => item.identifier}
              scrollEnabled={false}
            />
          )}
        </View>

        <TouchableOpacity style={styles.resetButton} onPress={resetToDefault}>
          <Text style={styles.resetButtonText}>Reset to Default Voice</Text>
        </TouchableOpacity>

        <View style={styles.helpSection}>
          <Text style={styles.helpTitle}>Need better voices?</Text>
          <Text style={styles.helpText}>
            Go to your device Settings → Accessibility → Spoken Content → Voices
            and download Enhanced or Premium quality voices for better sound.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  header: {
    backgroundColor: '#fff',
    padding: 24,
    paddingTop: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    lineHeight: 22,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#eff6ff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  infoIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e40af',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
    color: '#1e3a8a',
    lineHeight: 20,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  voiceCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  voiceCardSelected: {
    borderColor: '#3b82f6',
    backgroundColor: '#eff6ff',
  },
  voiceInfo: {
    flex: 1,
  },
  voiceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  voiceName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
  },
  voiceNameSelected: {
    color: '#1e40af',
  },
  selectedBadge: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10b981',
    marginLeft: 8,
  },
  voiceLanguage: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  voiceFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  qualityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  qualityText: {
    fontSize: 12,
    fontWeight: '600',
  },
  testButton: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  testButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    color: '#6b7280',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
  resetButton: {
    backgroundColor: '#fff',
    margin: 16,
    marginTop: 8,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  helpSection: {
    margin: 16,
    marginTop: 8,
    padding: 16,
    backgroundColor: '#fef3c7',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400e',
    marginBottom: 8,
  },
  helpText: {
    fontSize: 14,
    color: '#78350f',
    lineHeight: 20,
  },
});

export default VoiceSettingsScreen;
