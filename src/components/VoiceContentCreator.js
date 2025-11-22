import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
} from 'react-native';
import { speechRecognitionService } from '../services/speechService';

/**
 * Voice Content Creator Component
 * Allows parent/teacher to use voice input for creating spelling words,
 * vocabulary, and definitions
 */
const VoiceContentCreator = ({ onSave, fieldType = 'word' }) => {
  const [isListening, setIsListening] = useState(false);
  const [textValue, setTextValue] = useState('');
  const [voiceInput, setVoiceInput] = useState('');

  const fieldLabels = {
    word: 'Spelling Word',
    definition: 'Definition',
    pronunciation: 'Pronunciation Hint',
  };

  const startVoiceInput = async () => {
    try {
      setIsListening(true);
      
      await speechRecognitionService.startListening({
        onResult: (result) => {
          setVoiceInput(result);
          setTextValue(result);
          setIsListening(false);
        },
        onError: (error) => {
          const errorMessage = error?.message || 'Voice recognition failed. Please try again.';
          Alert.alert('Voice Input Error', errorMessage);
          setIsListening(false);
        },
      });
    } catch (error) {
      console.error('Voice input error:', error);
      const errorMessage = error?.message || 'Failed to start voice input. Please try again.';
      Alert.alert('Voice Input Error', errorMessage);
      setIsListening(false);
    }
  };

  const stopVoiceInput = async () => {
    await speechRecognitionService.stopListening();
    setIsListening(false);
  };

  const handleSave = () => {
    if (!textValue.trim()) {
      Alert.alert('Error', `Please enter a ${fieldLabels[fieldType].toLowerCase()}`);
      return;
    }
    onSave(textValue.trim());
    setTextValue('');
    setVoiceInput('');
  };

  const clearInput = () => {
    setTextValue('');
    setVoiceInput('');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{fieldLabels[fieldType]}</Text>
      
      {/* Text Input */}
      <TextInput
        style={[
          styles.input,
          fieldType === 'definition' && styles.inputMultiline
        ]}
        value={textValue}
        onChangeText={setTextValue}
        placeholder={`Type or speak the ${fieldLabels[fieldType].toLowerCase()}`}
        multiline={fieldType === 'definition'}
        numberOfLines={fieldType === 'definition' ? 4 : 1}
        autoCapitalize={fieldType === 'word' ? 'none' : 'sentences'}
      />

      {/* Voice Input Controls */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.voiceButton, isListening && styles.voiceButtonActive]}
          onPress={isListening ? stopVoiceInput : startVoiceInput}
        >
          <Text style={styles.voiceIcon}>{isListening ? '⏹️' : '🎤'}</Text>
          <Text style={styles.voiceButtonText}>
            {isListening ? 'Stop' : 'Voice'}
          </Text>
        </TouchableOpacity>

        {textValue && (
          <>
            <TouchableOpacity
              style={styles.clearButton}
              onPress={clearInput}
            >
              <Text style={styles.clearButtonText}>Clear</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSave}
            >
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {voiceInput && (
        <View style={styles.voicePreview}>
          <Text style={styles.voicePreviewLabel}>Voice input captured:</Text>
          <Text style={styles.voicePreviewText}>{voiceInput}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  inputMultiline: {
    height: 100,
    textAlignVertical: 'top',
  },
  controls: {
    flexDirection: 'row',
    gap: 8,
  },
  voiceButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#3b82f6',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  voiceButtonActive: {
    backgroundColor: '#dbeafe',
    borderColor: '#2563eb',
  },
  voiceIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  voiceButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3b82f6',
  },
  clearButton: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#10b981',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  voicePreview: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#eff6ff',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  voicePreviewLabel: {
    fontSize: 12,
    color: '#1e40af',
    marginBottom: 4,
  },
  voicePreviewText: {
    fontSize: 14,
    color: '#1e3a8a',
    fontStyle: 'italic',
  },
});

export default VoiceContentCreator;
