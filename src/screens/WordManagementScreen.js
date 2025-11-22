import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';
import { hasFeatureAccess, FEATURES } from '../services/premiumFeatures';

const WordManagementScreen = ({ route, navigation }) => {
  const { list } = route.params;
  const [words, setWords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [wordText, setWordText] = useState('');
  const [definition, setDefinition] = useState('');
  const [pronunciationHint, setPronunciationHint] = useState('');
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedWords, setSelectedWords] = useState([]);
  const [subscriptionTier, setSubscriptionTier] = useState('FREE');
  const [hasBulkAccess, setHasBulkAccess] = useState(false);

  useEffect(() => {
    loadWords();
    loadSubscriptionTier();
  }, []);

  const loadSubscriptionTier = async () => {
    try {
      const userStr = await AsyncStorage.getItem('currentUser');
      if (userStr) {
        const user = JSON.parse(userStr);
        const tier = user.subscriptionTier || 'FREE';
        setSubscriptionTier(tier);
        setHasBulkAccess(hasFeatureAccess(tier, FEATURES.BULK_ASSIGNMENT));
      }
    } catch (error) {
      console.error('Error loading subscription tier:', error);
    }
  };

  const loadWords = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/lists/${list.id}/words`);
      setWords(response.data.words || []);
    } catch (error) {
      console.error('Error loading words:', error);
      Alert.alert('Error', 'Failed to load words');
    } finally {
      setLoading(false);
    }
  };

  const handleAddWord = async () => {
    if (!wordText.trim()) {
      Alert.alert('Error', 'Please enter a word');
      return;
    }

    try {
      await api.post('/words', {
        listId: list.id,
        wordText: wordText.trim().toLowerCase(),
        definition: definition.trim(),
        pronunciationHint: pronunciationHint.trim(),
      });

      Alert.alert('Success', 'Word added successfully');
      setWordText('');
      setDefinition('');
      setPronunciationHint('');
      loadWords();
    } catch (error) {
      console.error('Error adding word:', error);
      Alert.alert('Error', 'Failed to add word');
    }
  };

  const handleDeleteWord = async (wordId) => {
    Alert.alert(
      'Delete Word',
      'Are you sure you want to delete this word?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/words/${wordId}`);
              Alert.alert('Success', 'Word deleted');
              loadWords();
            } catch (error) {
              console.error('Error deleting word:', error);
              Alert.alert('Error', 'Failed to delete word');
            }
          },
        },
      ]
    );
  };

  const toggleSelectionMode = () => {
    if (!hasBulkAccess) {
      Alert.alert(
        'Premium Feature',
        'Bulk delete is available in Premium and Classroom plans. Upgrade to select and delete multiple words at once.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Upgrade', onPress: () => navigation.navigate('Upgrade') },
        ]
      );
      return;
    }
    setSelectionMode(!selectionMode);
    setSelectedWords([]);
  };

  const toggleWordSelection = (wordId) => {
    if (selectedWords.includes(wordId)) {
      setSelectedWords(selectedWords.filter(id => id !== wordId));
    } else {
      setSelectedWords([...selectedWords, wordId]);
    }
  };

  const handleBulkDelete = () => {
    if (selectedWords.length === 0) {
      Alert.alert('No Selection', 'Please select words to delete');
      return;
    }

    Alert.alert(
      'Delete Words',
      `Delete ${selectedWords.length} word(s)?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: confirmBulkDelete,
        },
      ]
    );
  };

  const confirmBulkDelete = async () => {
    try {
      // Delete each selected word
      for (const wordId of selectedWords) {
        await api.delete(`/words/${wordId}`);
      }

      Alert.alert('Success', `${selectedWords.length} word(s) deleted`);
      setSelectionMode(false);
      setSelectedWords([]);
      await loadWords();
    } catch (error) {
      console.error('Bulk delete error:', error);
      Alert.alert('Error', 'Failed to delete some words');
    }
  };

  const renderWord = ({ item }) => {
    const isSelected = selectedWords.includes(item.id);
    
    return (
    <TouchableOpacity
      style={[styles.wordCard, isSelected && styles.wordCardSelected]}
      onPress={() => selectionMode && toggleWordSelection(item.id)}
      activeOpacity={selectionMode ? 0.7 : 1}
    >
      {selectionMode && (
        <View style={styles.checkbox}>
          {isSelected && <Text style={styles.checkmark}>✓</Text>}
        </View>
      )}
      <View style={styles.wordContent}>
        <Text style={styles.wordText}>{item.word_text}</Text>
        {item.definition ? (
          <Text style={styles.definition}>{item.definition}</Text>
        ) : null}
        {item.pronunciation_hint ? (
          <Text style={styles.pronunciation}>🔊 {item.pronunciation_hint}</Text>
        ) : null}
      </View>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDeleteWord(item.id)}
      >
        <Text style={styles.deleteButtonText}>✕</Text>
      </TouchableOpacity>
    </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={styles.header}>
        <Text style={styles.listName}>{list.name}</Text>
        <Text style={styles.wordCount}>{words.length} words</Text>
      </View>

      <ScrollView 
        style={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.addWordSection}>
          <Text style={styles.sectionTitle}>Add New Word</Text>
          
          <TextInput
            style={styles.input}
            placeholder="Word (required)"
            value={wordText}
            onChangeText={setWordText}
            autoCapitalize="none"
          />

          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Definition (optional)"
            value={definition}
            onChangeText={setDefinition}
            multiline
            numberOfLines={2}
          />

          <TextInput
            style={styles.input}
            placeholder="Pronunciation hint (optional)"
            value={pronunciationHint}
            onChangeText={setPronunciationHint}
          />

          <TouchableOpacity
            style={styles.addButton}
            onPress={handleAddWord}
          >
            <Text style={styles.addButtonText}>+ Add Word</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.wordsSection}>
          <View style={styles.wordsSectionHeader}>
            <Text style={styles.sectionTitle}>Words in this list</Text>
            <TouchableOpacity
              style={styles.selectButton}
              onPress={toggleSelectionMode}
            >
              <Text style={styles.selectButtonText}>
                {selectionMode ? 'Cancel' : '☑️ Select'}
              </Text>
            </TouchableOpacity>
          </View>
          
          {selectionMode && selectedWords.length > 0 && (
            <TouchableOpacity
              style={styles.bulkDeleteButton}
              onPress={handleBulkDelete}
            >
              <Text style={styles.bulkDeleteButtonText}>
                🗑️ Delete ({selectedWords.length})
              </Text>
            </TouchableOpacity>
          )}
          
          {words.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No words yet</Text>
              <Text style={styles.emptySubtext}>Add your first word above</Text>
            </View>
          ) : (
            <View>
              {words.map((item) => (
                <View key={item.id}>
                  {renderWord({ item })}
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#4F46E5',
    padding: 20,
    paddingTop: 10,
  },
  listName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  wordCount: {
    fontSize: 14,
    color: '#e0e7ff',
  },
  addWordSection: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  textArea: {
    height: 60,
    textAlignVertical: 'top',
  },
  addButton: {
    backgroundColor: '#10b981',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  wordsSection: {
    padding: 16,
  },
  wordsList: {
    paddingBottom: 16,
  },
  wordCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  wordContent: {
    flex: 1,
  },
  wordText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  definition: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  pronunciation: {
    fontSize: 14,
    color: '#4F46E5',
    fontStyle: 'italic',
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fee2e2',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  deleteButtonText: {
    fontSize: 20,
    color: '#ef4444',
    fontWeight: 'bold',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 60,
  },
  emptyText: {
    fontSize: 18,
    color: '#6b7280',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
  },
  wordsSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  selectButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#4F46E5',
  },
  selectButtonText: {
    color: '#4F46E5',
    fontSize: 13,
    fontWeight: '600',
  },
  bulkDeleteButton: {
    backgroundColor: '#DC2626',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  bulkDeleteButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#4F46E5',
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: 16,
    left: 16,
    zIndex: 10,
  },
  checkmark: {
    fontSize: 16,
    color: '#4F46E5',
    fontWeight: 'bold',
  },
  wordCardSelected: {
    backgroundColor: '#EEF2FF',
    borderWidth: 2,
    borderColor: '#4F46E5',
  },
});

export default WordManagementScreen;
