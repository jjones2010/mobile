import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Switch,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Audio } from 'expo-av';
import { practiceAPI } from '../services/api';
import { ttsService, speechRecognitionService } from '../services/speechService';
import { hasFeatureAccess, FEATURES } from '../services/premiumFeatures';

const PRACTICE_MODES = {
  SPELL_ONLY: 'SPELL_ONLY',
  SAY_SPELL_SAY: 'SAY_SPELL_SAY',
};

const EnhancedPracticeScreen = ({ route, navigation }) => {
  const { task, subUser } = route.params;
  
  // Session state
  const [session, setSession] = useState(null);
  const [words, setWords] = useState([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  
  // Task configuration from assignment
  const taskType = task?.taskType || 'practice'; // 'practice' | 'test'
  const assignedInputMode = task?.testInputMode || 'type-only'; // 'type-only' | 'spell-only' | 'say-spell-say'
  const isTestMode = taskType === 'test';
  
  // Practice mode - set based on assigned input mode
  const [practiceMode, setPracticeMode] = useState(
    assignedInputMode === 'say-spell-say' ? PRACTICE_MODES.SAY_SPELL_SAY : PRACTICE_MODES.SPELL_ONLY
  );
  
  // Attempt tracking - test mode has stricter rules
  const [attemptNumber, setAttemptNumber] = useState(1);
  const [maxAttempts] = useState(isTestMode ? 1 : 3); // Test mode: only 1 attempt
  const [mustRepeatCorrectly, setMustRepeatCorrectly] = useState(false);
  
  // Voice input state
  const [isListening, setIsListening] = useState(false);
  const [voiceInput, setVoiceInput] = useState('');
  const [currentPhase, setCurrentPhase] = useState('initial'); // 'initial', 'spelling', 'final'
  
  // Typed input state (for type-only mode)
  const [typedInput, setTypedInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  // Feedback state
  const [showingCorrectSpelling, setShowingCorrectSpelling] = useState(false);
  const [revealedLetters, setRevealedLetters] = useState([]);
  
  // Visual feedback state
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackType, setFeedbackType] = useState(null); // 'correct' or 'incorrect'
  const feedbackOpacity = useRef(new Animated.Value(0)).current;
  
  // Sound settings (from task assignment)
  const [soundEnabled, setSoundEnabled] = useState(task?.soundEnabled !== false);
  
  // Results
  const [results, setResults] = useState({
    correct: 0,
    total: 0,
    attempts: [],
  });

  // Animation
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [dingSound, setDingSound] = useState(null);

  // Voice access is allowed if task has voice input mode assigned
  const hasVoiceAccess = assignedInputMode === 'spell-only' || assignedInputMode === 'say-spell-say';

  useEffect(() => {
    loadDingSound();
    startPracticeSession();
    return () => {
      ttsService.stop();
      speechRecognitionService.destroy();
      if (dingSound) {
        dingSound.unloadAsync();
      }
    };
  }, []);

  const loadDingSound = async () => {
    try {
      const { sound } = await Audio.Sound.createAsync(
        require('../assets/sounds/ding.mp3') // You'll need to add this sound file
      );
      setDingSound(sound);
    } catch (error) {
      console.log('Could not load ding sound:', error);
    }
  };

  const playDing = async () => {
    if (dingSound) {
      try {
        await dingSound.replayAsync();
      } catch (error) {
        console.log('Error playing ding:', error);
      }
    }
  };

  const startPracticeSession = async () => {
    try {
      const response = await practiceAPI.startSession(task.assignmentId);
      const { session: newSession, words: wordList } = response.data;
      
      setSession(newSession);
      setWords(wordList);
      setLoading(false);
      
      // Speak first word
      if (wordList.length > 0) {
        await speakCurrentWord(wordList[0]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to start practice session');
      navigation.goBack();
    }
  };

  const speakCurrentWord = async (word = null) => {
    const currentWord = word || words[currentWordIndex];
    if (currentWord) {
      await ttsService.speakWord(currentWord.wordText, { repeat: 1 });
    }
  };

  const startVoiceRecognition = async () => {
    if (!hasVoiceAccess) {
      Alert.alert('Premium Feature', 'Voice input requires a premium subscription');
      return;
    }

    try {
      setIsListening(true);
      
      await speechRecognitionService.startListening({
        onResult: (result) => {
          handleVoiceResult(result);
          setIsListening(false);
        },
        onError: (error) => {
          Alert.alert('Voice Recognition Error', error.message || 'Voice recognition failed. Please try again.');
          setIsListening(false);
        },
      });
    } catch (error) {
      console.error('Voice input error:', error);
      Alert.alert('Voice Recognition Error', error?.message || 'Failed to start voice input. Please try again.');
      setIsListening(false);
    }
  };

  const handleVoiceResult = (result) => {
    const currentWord = words[currentWordIndex];
    const cleanResult = result.toLowerCase().replace(/[^a-z]/g, '');

    if (practiceMode === PRACTICE_MODES.SPELL_ONLY) {
      // In Spell Only mode, just check the spelling
      checkSpelling(cleanResult);
    } else {
      // In Say-Spell-Say mode, handle phases
      if (currentPhase === 'initial') {
        // First, they should say the word
        if (cleanResult === currentWord.wordText.toLowerCase()) {
          setCurrentPhase('spelling');
          // Visual feedback only (no voice instruction)
          setTimeout(() => startVoiceRecognition(), 1000);
        } else {
          handleIncorrectAttempt();
        }
      } else if (currentPhase === 'spelling') {
        // Then spell it
        checkSpelling(cleanResult);
      } else if (currentPhase === 'final') {
        // Finally, say it again
        if (cleanResult === currentWord.wordText.toLowerCase()) {
          handleCorrectAttempt();
        } else {
          handleIncorrectAttempt();
        }
      }
    }
  };

  const checkSpelling = (spelling) => {
    const currentWord = words[currentWordIndex];
    const correctSpelling = currentWord.wordText.toLowerCase();

    if (spelling === correctSpelling) {
      if (practiceMode === PRACTICE_MODES.SAY_SPELL_SAY) {
        // Move to final phase
        setCurrentPhase('final');
        // Visual feedback only (no voice instruction)
        setTimeout(() => startVoiceRecognition(), 1000);
      } else {
        handleCorrectAttempt(spelling);
      }
    } else {
      handleIncorrectAttempt(spelling);
    }
  };

  const handleTypedSubmit = async () => {
    if (!typedInput.trim()) {
      Alert.alert('Error', 'Please enter your spelling');
      return;
    }

    setSubmitting(true);
    const cleanInput = typedInput.toLowerCase().trim();
    checkSpelling(cleanInput);
    setTypedInput(''); // Clear input for next word
    setSubmitting(false);
  };

  const handleCorrectAttempt = async (userInput = null) => {
    const currentWord = words[currentWordIndex];
    
    // Record attempt
    await recordAttempt(currentWord.id, userInput || currentWord.wordText, true);
    
    // Update results
    setResults(prev => ({
      ...prev,
      correct: prev.correct + 1,
      total: prev.total + 1,
    }));

    // Visual feedback only (no voice)
    // Show green checkmark briefly
    
    // Reset for next word
    resetWordState();
    
    // Move to next word
    setTimeout(() => moveToNextWord(), 1500);
  };

  const handleIncorrectAttempt = async (userInput = null) => {
    const currentWord = words[currentWordIndex];
    
    // Play ding sound
    await playDing();
    
    // Record attempt
    await recordAttempt(currentWord.id, userInput || voiceInput || '', false);

    if (attemptNumber < maxAttempts) {
      // Still have attempts left
      setAttemptNumber(attemptNumber + 1);
      
      // Show correct spelling letter by letter (not in test mode)
      if (!isTestMode) {
        await revealCorrectSpelling(currentWord.wordText);
      }
      
      // Speak the word again (but no voice feedback about being incorrect)
      await speakCurrentWord();
      
      // Visual feedback only (no voice saying "try again")
      
      // Reset phase for Say-Spell-Say mode
      setCurrentPhase('initial');
      
    } else {
      // Out of attempts
      setResults(prev => ({
        ...prev,
        total: prev.total + 1,
      }));
      
      // In test mode, just move on without showing answer
      if (isTestMode) {
        // Visual feedback only (no voice)
        resetWordState();
        setTimeout(() => moveToNextWord(), 1500);
      } else {
        // In practice mode, show correct spelling and require correct repetition
        await revealCorrectSpelling(currentWord.wordText);
        setMustRepeatCorrectly(true);
        // Visual feedback only (no voice instruction)
      }
    }
  };

  const revealCorrectSpelling = async (word) => {
    setShowingCorrectSpelling(true);
    const letters = word.split('');
    
    for (let i = 0; i < letters.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 300));
      setRevealedLetters(prev => [...prev, letters[i]]);
      
      // Animate letter appearance
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
    
    // Keep showing for 2 seconds, then allow retry
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Re-enable input for next attempt
    setShowingCorrectSpelling(false);
  };

  const handleMustRepeatCorrectly = async () => {
    const currentWord = words[currentWordIndex];
    
    try {
      setIsListening(true);
      await speechRecognitionService.startListening({
        onResult: async (result) => {
          const cleanResult = result.toLowerCase().replace(/[^a-z]/g, '');
          
          if (cleanResult === currentWord.wordText.toLowerCase()) {
            // Visual feedback only (no voice)
            resetWordState();
            setTimeout(() => moveToNextWord(), 1500);
          } else {
            await playDing();
            // Visual feedback only (no voice)
            setTimeout(() => handleMustRepeatCorrectly(), 1000);
          }
          setIsListening(false);
        },
        onError: (error) => {
          setIsListening(false);
          Alert.alert('Voice Recognition Error', error.message || 'Please try again');
        },
      });
    } catch (error) {
      console.error('Voice input error:', error);
      Alert.alert('Voice Recognition Error', error?.message || 'Failed to start voice input. Please try again.');
      setIsListening(false);
    }
  };

  const resetWordState = () => {
    setAttemptNumber(1);
    setMustRepeatCorrectly(false);
    setShowingCorrectSpelling(false);
    setRevealedLetters([]);
    setCurrentPhase('initial');
    setVoiceInput('');
  };

  const moveToNextWord = () => {
    if (currentWordIndex < words.length - 1) {
      const nextIndex = currentWordIndex + 1;
      setCurrentWordIndex(nextIndex);
      speakCurrentWord(words[nextIndex]);
    } else {
      completeSession();
    }
  };

  const recordAttempt = async (wordId, userInput, isCorrect) => {
    try {
      // Determine input method based on what was actually used
      const inputMethod = voiceInput ? 'VOICE' : 'TYPING';
      
      await practiceAPI.submitAttempt(
        session.id,
        wordId,
        userInput || '',
        inputMethod,
        null
      );
    } catch (error) {
      console.error('Failed to record attempt:', error);
    }
  };

  const completeSession = async () => {
    try {
      const response = await practiceAPI.completeSession(session.id);
      navigation.replace('SessionResults', { 
        results: response.data.results,
        task,
        subUser,
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to complete session');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading practice session...</Text>
      </View>
    );
  }

  const currentWord = words[currentWordIndex];
  const progress = ((currentWordIndex + 1) / words.length) * 100;

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Exit</Text>
        </TouchableOpacity>
        <Text style={styles.progressText}>
          Word {currentWordIndex + 1} / {words.length}
        </Text>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${progress}%` }]} />
      </View>

      {/* Mode Toggle - Only show if not assigned a specific mode */}
      {assignedInputMode === 'type-only' ? (
        <View style={styles.modeToggle}>
          <Text style={styles.modeLabel}>
            {isTestMode ? '🎯 TEST MODE' : 'Input Mode: Type Only'}
          </Text>
          <Text style={styles.modeDescription}>
            {isTestMode 
              ? 'You have one attempt per word. No hints will be shown.'
              : 'Type your answers using the keyboard'}
          </Text>
        </View>
      ) : (
        <View style={styles.modeToggle}>
          <Text style={styles.modeLabel}>
            {isTestMode ? '🎯 TEST MODE - ' : ''}
            {assignedInputMode === 'say-spell-say' ? 'Say-Spell-Say Mode' : 'Spell Only Mode'}
          </Text>
          <Text style={styles.modeDescription}>
            {isTestMode && 'One attempt per word. '}
            {assignedInputMode === 'say-spell-say' 
              ? 'Say the word, spell it aloud, then say it again'
              : 'Spell the word aloud'}
          </Text>
        </View>
      )}

      {/* Main Content */}
      <ScrollView 
        style={styles.scrollContent}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {!mustRepeatCorrectly ? (
          <>
            <Text style={styles.instruction}>
              {assignedInputMode === 'voice-only' 
                ? 'Tap mic and spell the word aloud'
                : 'Listen and type the word (or tap mic for voice)'}
            </Text>
            
            {/* Speaker and Mic Buttons - Stacked Vertically */}
            <View style={styles.buttonColumn}>
              <TouchableOpacity
                style={styles.compactSpeakerButton}
                onPress={() => speakCurrentWord()}
              >
                <Text style={styles.compactSpeakerIcon}>🔊</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.compactVoiceButton, isListening && styles.compactVoiceButtonActive]}
                onPress={isListening ? () => speechRecognitionService.stopListening() : startVoiceRecognition}
                disabled={!hasVoiceAccess || submitting || showingCorrectSpelling}
              >
                <Text style={styles.compactVoiceIcon}>{isListening ? '⏹️' : '🎤'}</Text>
              </TouchableOpacity>
            </View>

            {/* Attempt Counter */}
            <View style={styles.attemptCounter}>
              <Text style={styles.attemptText}>
                Attempt {attemptNumber} of {maxAttempts}
              </Text>
            </View>

            {/* Input Method - Type or Voice */}
            {assignedInputMode === 'type-only' ? (
              <>
                {/* Typing Input */}
                <TextInput
                  style={styles.input}
                  value={typedInput}
                  onChangeText={setTypedInput}
                  placeholder="Type the word here"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!submitting && !showingCorrectSpelling}
                  onSubmitEditing={handleTypedSubmit}
                  returnKeyType="done"
                />
                
                {typedInput && !showingCorrectSpelling && (
                  <Text style={styles.previewText}>Your answer: {typedInput}</Text>
                )}

                <TouchableOpacity
                  style={[styles.submitButton, (!typedInput || submitting || showingCorrectSpelling) && styles.submitButtonDisabled]}
                  onPress={handleTypedSubmit}
                  disabled={!typedInput || submitting || showingCorrectSpelling}
                >
                  {submitting ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.submitButtonText}>Submit</Text>
                  )}
                </TouchableOpacity>
              </>
            ) : (
              /* Voice Input - Status Display */
              <View style={styles.voiceStatusContainer}>
                <Text style={styles.voiceStatusText}>
                  {isListening ? '🎤 Listening...' : hasVoiceAccess ? 'Tap the microphone button above to speak' : 'Voice input requires premium'}
                </Text>
              </View>
            )}

            {/* Revealed Letters (after incorrect attempt) */}
            {showingCorrectSpelling && revealedLetters.length > 0 && (
              <View style={styles.revealedSpelling}>
                <Text style={styles.revealedLabel}>Correct spelling:</Text>
                <View style={styles.letterContainer}>
                  {revealedLetters.map((letter, index) => (
                    <Animated.View
                      key={index}
                      style={[styles.letterBox, { opacity: index === revealedLetters.length - 1 ? fadeAnim : 1 }]}
                    >
                      <Text style={styles.letter}>{letter.toUpperCase()}</Text>
                    </Animated.View>
                  ))}
                </View>
              </View>
            )}
          </>
        ) : (
          <>
            {/* Must Repeat Correctly Mode */}
            <Text style={styles.instruction}>
              Spell the word correctly to continue
            </Text>
            
            <View style={styles.revealedSpelling}>
              <Text style={styles.revealedLabel}>The word is:</Text>
              <View style={styles.letterContainer}>
                {currentWord.wordText.split('').map((letter, index) => (
                  <View key={index} style={styles.letterBox}>
                    <Text style={styles.letter}>{letter.toUpperCase()}</Text>
                  </View>
                ))}
              </View>
            </View>

            <TouchableOpacity
              style={[styles.voiceButton, isListening && styles.voiceButtonActive]}
              onPress={handleMustRepeatCorrectly}
              disabled={isListening}
            >
              <Text style={styles.voiceIcon}>🎤</Text>
              <Text style={styles.voiceText}>
                {isListening ? 'Listening...' : 'Spell it correctly'}
              </Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

      {/* Score Display */}
      <View style={styles.scoreContainer}>
        <Text style={styles.scoreText}>
          Correct: {results.correct} / {results.total}
        </Text>
      </View>
    </KeyboardAvoidingView>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 48,
    backgroundColor: '#fff',
  },
  backText: {
    color: '#3b82f6',
    fontSize: 16,
  },
  progressText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#e5e7eb',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10b981',
  },
  modeToggle: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
    textAlign: 'center',
  },
  modeDescription: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleOption: {
    fontSize: 14,
    color: '#6b7280',
    marginHorizontal: 12,
  },
  toggleOptionActive: {
    color: '#3b82f6',
    fontWeight: '600',
  },
  scrollContent: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  instruction: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 32,
  },
  buttonColumn: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    gap: 12,
  },
  compactSpeakerButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  compactSpeakerIcon: {
    fontSize: 28,
  },
  compactVoiceButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactVoiceButtonActive: {
    backgroundColor: '#dbeafe',
    borderColor: '#2563eb',
  },
  compactVoiceIcon: {
    fontSize: 28,
  },
  voiceStatusContainer: {
    padding: 16,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    marginBottom: 16,
  },
  voiceStatusText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  speakerButton: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  speakerIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  speakerText: {
    fontSize: 16,
    color: '#6b7280',
  },
  attemptCounter: {
    alignItems: 'center',
    marginBottom: 24,
  },
  attemptText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f59e0b',
  },
  voiceButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#3b82f6',
    borderRadius: 8,
    padding: 32,
    alignItems: 'center',
    marginBottom: 16,
  },
  voiceButtonActive: {
    backgroundColor: '#dbeafe',
    borderColor: '#2563eb',
  },
  voiceIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  voiceText: {
    fontSize: 16,
    color: '#1f2937',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#3b82f6',
    borderRadius: 8,
    padding: 16,
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 16,
  },
  previewText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  submitButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  submitButtonDisabled: {
    backgroundColor: '#93c5fd',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  revealedSpelling: {
    marginTop: 24,
    alignItems: 'center',
  },
  revealedLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 16,
  },
  letterContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    paddingHorizontal: 16,
    maxWidth: '100%',
  },
  letterBox: {
    minWidth: 40,
    maxWidth: 60,
    height: 60,
    flex: 0,
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    margin: 3,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  letter: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  scoreContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  scoreText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    textAlign: 'center',
  },
});

export default EnhancedPracticeScreen;
