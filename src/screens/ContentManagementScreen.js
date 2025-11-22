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
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { contentAPI } from '../services/api';

const ContentManagementScreen = ({ navigation }) => {
  const [lists, setLists] = useState([]);
  const [groups, setGroups] = useState([]);
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('');
  const [newGroupName, setNewGroupName] = useState('');
  const [newGradeName, setNewGradeName] = useState('');
  const [listName, setListName] = useState('');
  const [listDescription, setListDescription] = useState('');
  const [words, setWords] = useState([{ word: '', definition: '', pronunciation: '' }]);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    await Promise.all([
      loadLists(),
      loadGroups(),
    ]);
  };

  const loadLists = async () => {
    setLoading(true);
    try {
      const response = await contentAPI.getAllLists();
      setLists(response.data.lists || []);
    } catch (error) {
      setLists([]);
    } finally {
      setLoading(false);
    }
  };

  const loadGroups = async () => {
    try {
      const response = await contentAPI.getGroups();
      setGroups(response.data.groups || []);
    } catch (error) {
      setGroups([]);
    }
  };

  const loadGrades = async (groupId) => {
    if (!groupId) {
      setGrades([]);
      return;
    }
    try {
      const response = await contentAPI.getGrades(groupId);
      setGrades(response.data.grades || []);
    } catch (error) {
      setGrades([]);
    }
  };

  const handleGroupChange = async (groupId) => {
    setSelectedGroup(groupId);
    setSelectedGrade('');
    if (groupId) {
      await loadGrades(groupId);
    } else {
      setGrades([]);
    }
  };

  const openAddModal = () => {
    setSelectedGroup('');
    setSelectedGrade('');
    setNewGroupName('');
    setNewGradeName('');
    setListName('');
    setListDescription('');
    setWords([{ word: '', definition: '', pronunciation: '' }]);
    setModalVisible(true);
  };

  const addWordField = () => {
    setWords([...words, { word: '', definition: '', pronunciation: '' }]);
  };

  const updateWord = (index, field, value) => {
    const newWords = [...words];
    newWords[index][field] = value;
    setWords(newWords);
  };

  const removeWord = (index) => {
    const newWords = words.filter((_, i) => i !== index);
    setWords(newWords.length > 0 ? newWords : [{ word: '', definition: '', pronunciation: '' }]);
  };

  const handleSave = async () => {
    if (!listName.trim()) {
      Alert.alert('Error', 'Please enter list name');
      return;
    }

    const validWords = words.filter(w => w.word.trim().length > 0);
    if (validWords.length === 0) {
      Alert.alert('Error', 'Please add at least one word');
      return;
    }

    try {
      // Get or create group
      let groupId = selectedGroup;
      if (!groupId && newGroupName.trim()) {
        const groupResponse = await contentAPI.createGroup(newGroupName.trim(), '');
        groupId = groupResponse.data.group.id;
        await loadGroups();
      }

      if (!groupId) {
        Alert.alert('Error', 'Please select or create a group');
        return;
      }

      // Get or create grade
      let gradeId = selectedGrade;
      if (!gradeId && newGradeName.trim()) {
        const gradeResponse = await contentAPI.createGrade(groupId, newGradeName.trim(), '');
        gradeId = gradeResponse.data.grade.id;
      }

      if (!gradeId) {
        Alert.alert('Error', 'Please select or create a grade');
        return;
      }

      // Create the list
      const listResponse = await contentAPI.createList(gradeId, listName, listDescription);
      const listId = listResponse.data.list.id;

      // Add words to the list
      for (const wordData of validWords) {
        await contentAPI.addWord(
          listId,
          wordData.word.trim(),
          wordData.definition.trim() || '',
          wordData.pronunciation.trim() || ''
        );
      }

      setModalVisible(false);
      loadLists();
      Alert.alert('Success', 'Word list created successfully');
    } catch (error) {
      console.error('Create list error:', error);
      const errorMsg = error.response?.data?.error || error.message || 'Failed to create list';
      Alert.alert('Error Creating List', errorMsg);
    }
  };

  const handleDelete = (list) => {
    Alert.alert(
      'Delete List',
      `Are you sure you want to delete "${list.name}"? This will also delete all ${list.word_count || 0} words in this list.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await contentAPI.deleteList(list.id);
              loadLists();
              Alert.alert('Success', 'List deleted successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete list');
            }
          },
        },
      ]
    );
  };

  const renderList = ({ item }) => (
    <View style={styles.listCardContainer}>
      <TouchableOpacity
        style={styles.listCard}
        onPress={() => navigation.navigate('WordManagement', { list: item })}
      >
        <View style={styles.listIcon}>
          <Text style={styles.listIconText}>📝</Text>
        </View>
        <View style={styles.listInfo}>
          <Text style={styles.listName}>{item.name}</Text>
          <Text style={styles.listMeta}>{item.word_count || 0} words</Text>
          {item.grade_name && (
            <Text style={styles.listHierarchy}>{item.group_name} › {item.grade_name}</Text>
          )}
        </View>
        <Text style={styles.listArrow}>›</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDelete(item)}
      >
        <Text style={styles.deleteButtonText}>Delete</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={lists}
        renderItem={renderList}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No word lists yet</Text>
            <Text style={styles.emptySubtext}>Tap the + button to create your first list</Text>
          </View>
        }
      />

      <TouchableOpacity style={styles.fab} onPress={openAddModal}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView 
          style={styles.modalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>New Word List</Text>
            <TouchableOpacity onPress={handleSave}>
              <Text style={styles.saveText}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={styles.form}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.formContent}
          >
            {/* Group Selection */}
            <Text style={styles.label}>Group *</Text>
            <Text style={styles.helperText}>Select existing or type new name</Text>
            {groups.length > 0 && (
              <View style={styles.quickSelectContainer}>
                {groups.map(group => (
                  <TouchableOpacity
                    key={group.id}
                    style={[
                      styles.quickSelectButton,
                      selectedGroup === group.id && styles.quickSelectButtonActive
                    ]}
                    onPress={() => handleGroupChange(group.id)}
                  >
                    <Text style={[
                      styles.quickSelectText,
                      selectedGroup === group.id && styles.quickSelectTextActive
                    ]}>
                      {group.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            <TextInput
              style={styles.input}
              placeholder="Type group name (e.g., Elementary)"
              value={newGroupName}
              onChangeText={(text) => {
                setNewGroupName(text);
                setSelectedGroup(''); // Clear selection when typing
              }}
            />

            {/* Grade Selection */}
            <Text style={styles.label}>Grade *</Text>
            <Text style={styles.helperText}>Select existing or type new name</Text>
            {grades.length > 0 && (selectedGroup || newGroupName) && (
              <View style={styles.quickSelectContainer}>
                {grades.map(grade => (
                  <TouchableOpacity
                    key={grade.id}
                    style={[
                      styles.quickSelectButton,
                      selectedGrade === grade.id && styles.quickSelectButtonActive
                    ]}
                    onPress={() => setSelectedGrade(grade.id)}
                  >
                    <Text style={[
                      styles.quickSelectText,
                      selectedGrade === grade.id && styles.quickSelectTextActive
                    ]}>
                      {grade.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            <TextInput
              style={styles.input}
              placeholder="Type grade name (e.g., Grade 1)"
              value={newGradeName}
              onChangeText={(text) => {
                setNewGradeName(text);
                setSelectedGrade(''); // Clear selection when typing
              }}
              editable={!!selectedGroup || !!newGroupName}
            />

            {/* List Details */}
            <Text style={styles.label}>List Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Week 5: Space Words"
              value={listName}
              onChangeText={setListName}
            />

            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Optional description"
              value={listDescription}
              onChangeText={setListDescription}
              multiline
            />

            {/* Words */}
            <Text style={styles.sectionTitle}>Words</Text>
            {words.map((wordData, index) => (
              <View key={index} style={styles.wordContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Word *"
                  value={wordData.word}
                  onChangeText={(text) => updateWord(index, 'word', text)}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Definition (optional)"
                  value={wordData.definition}
                  onChangeText={(text) => updateWord(index, 'definition', text)}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Pronunciation (optional)"
                  value={wordData.pronunciation}
                  onChangeText={(text) => updateWord(index, 'pronunciation', text)}
                />
                {words.length > 1 && (
                  <TouchableOpacity
                    style={styles.removeWordButton}
                    onPress={() => removeWord(index)}
                  >
                    <Text style={styles.removeWordText}>Remove</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}

            <TouchableOpacity style={styles.addWordButton} onPress={addWordField}>
              <Text style={styles.addWordText}>+ Add Another Word</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
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
  list: {
    padding: 16,
  },
  listCardContainer: {
    marginBottom: 12,
  },
  listCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  deleteButton: {
    backgroundColor: '#ef4444',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    marginTop: 8,
    alignSelf: 'flex-end',
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  listIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#e0e7ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  listIconText: {
    fontSize: 24,
  },
  listInfo: {
    flex: 1,
  },
  listName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  listMeta: {
    fontSize: 14,
    color: '#6b7280',
  },
  listHierarchy: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  listArrow: {
    fontSize: 32,
    color: '#d1d5db',
    fontWeight: '300',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 100,
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
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '300',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingTop: 60,
  },
  cancelText: {
    fontSize: 16,
    color: '#6b7280',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  saveText: {
    fontSize: 16,
    color: '#4F46E5',
    fontWeight: '600',
  },
  form: {
    flex: 1,
  },
  formContent: {
    padding: 16,
    paddingBottom: 100,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
    marginTop: 16,
  },
  helperText: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 8,
  },
  quickSelectContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  quickSelectButton: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  quickSelectButtonActive: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  quickSelectText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  quickSelectTextActive: {
    color: '#fff',
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
    height: 80,
    textAlignVertical: 'top',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginTop: 24,
    marginBottom: 12,
  },
  wordContainer: {
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  removeWordButton: {
    backgroundColor: '#ef4444',
    padding: 8,
    borderRadius: 6,
    marginTop: 8,
  },
  removeWordText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  addWordButton: {
    backgroundColor: '#10b981',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 24,
  },
  addWordText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default ContentManagementScreen;
