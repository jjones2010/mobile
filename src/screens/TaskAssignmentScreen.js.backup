import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
  Switch,
  ScrollView,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { subUserAPI, taskAPI, contentAPI } from '../services/api';
import { 
  SUBSCRIPTION_TIERS, 
  FEATURES, 
  INPUT_MODES,
  getTierLimits,
  isInputModeAvailable,
  hasFeatureAccess,
  getUpgradeMessage 
} from '../services/premiumFeatures';
import PremiumGate from '../components/PremiumGate';

const TaskAssignmentScreen = ({ navigation, route }) => {
  const { subscriptionTier = SUBSCRIPTION_TIERS.FREE } = route.params || {};
  
  const [students, setStudents] = useState([]);
  const [lists, setLists] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [selectedList, setSelectedList] = useState(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState('students'); // 'students' | 'list' | 'options'
  
  // Phase 2 Features
  const [taskType, setTaskType] = useState('practice'); // 'practice' | 'test'
  const [inputMode, setInputMode] = useState(INPUT_MODES.TYPE_ONLY);
  const [allowInputModeChange, setAllowInputModeChange] = useState(false); // Allow student to change input mode
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [scheduleType, setScheduleType] = useState('one-time'); // 'one-time' | 'daily'
  const [dueDate, setDueDate] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dailySchedule, setDailySchedule] = useState({
    days: [],
    startDate: new Date(),
  });
  
  // Premium gate state
  const [showPremiumGate, setShowPremiumGate] = useState(false);
  const [premiumGateInfo, setPremiumGateInfo] = useState({});
  
  // Get tier limits
  const tierLimits = getTierLimits(subscriptionTier);
  const isPremium = subscriptionTier === SUBSCRIPTION_TIERS.PREMIUM || 
                    subscriptionTier === SUBSCRIPTION_TIERS.TIER1 || 
                    subscriptionTier === SUBSCRIPTION_TIERS.TIER2;
  const isClassroom = subscriptionTier === SUBSCRIPTION_TIERS.TIER2;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [studentsRes, listsRes] = await Promise.all([
        subUserAPI.getAll(),
        contentAPI.getAllLists(),
      ]);
      setStudents(studentsRes.data.subUsers || []);
      setLists(listsRes.data.lists || []);
    } catch (error) {
      setStudents([]);
      setLists([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleStudent = (studentId) => {
    if (selectedStudents.includes(studentId)) {
      setSelectedStudents(selectedStudents.filter(id => id !== studentId));
    } else {
      setSelectedStudents([...selectedStudents, studentId]);
    }
  };

  const handleNext = () => {
    if (step === 'students') {
      if (selectedStudents.length === 0) {
        Alert.alert('Error', 'Please select at least one student');
        return;
      }
      setStep('list');
    } else if (step === 'list') {
      if (!selectedList) {
        Alert.alert('Error', 'Please select a word list');
        return;
      }
      setStep('options');
    }
  };

  const handleBack = () => {
    if (step === 'list') {
      setStep('students');
    } else if (step === 'options') {
      setStep('list');
    }
  };

  const handleAssign = async () => {
    if (!selectedList) {
      Alert.alert('Error', 'Please select a word list');
      return;
    }

    // Check premium features
    if (taskType === 'test' && !tierLimits.hasTestMode) {
      showPremiumPrompt(FEATURES.TEST_MODE);
      return;
    }

    if (!isInputModeAvailable(subscriptionTier, inputMode)) {
      showPremiumPrompt(FEATURES.VOICE_INPUT);
      return;
    }

    // Validate daily schedule
    if (scheduleType === 'daily' && dailySchedule.days.length === 0) {
      Alert.alert('Error', 'Please select at least one day for daily tasks');
      return;
    }

    try {
      const assignmentData = {
        listId: selectedList.id,
        subUserIds: selectedStudents,
        taskType,
        testInputMode: inputMode,
        allowInputModeChange,
        scheduleType,
        dueDate: scheduleType === 'one-time' ? dueDate : null,
        dailySchedule: scheduleType === 'daily' ? dailySchedule : null,
      };

      await taskAPI.assign(assignmentData);
      Alert.alert('Success', 'Task assigned successfully', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to assign task');
    }
  };

  const toggleDay = (day) => {
    setDailySchedule(prev => ({
      ...prev,
      days: prev.days.includes(day)
        ? prev.days.filter(d => d !== day)
        : [...prev.days, day],
    }));
  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      if (scheduleType === 'one-time') {
        setDueDate(selectedDate);
      } else {
        setDailySchedule(prev => ({ ...prev, startDate: selectedDate }));
      }
    }
  };

  const showPremiumPrompt = (feature) => {
    const upgradeInfo = getUpgradeMessage(feature);
    setPremiumGateInfo({
      ...upgradeInfo,
      currentTier: subscriptionTier,
    });
    setShowPremiumGate(true);
  };

  const handleTestModeToggle = (type) => {
    if (type === 'test' && !tierLimits.hasTestMode) {
      showPremiumPrompt(FEATURES.TEST_MODE);
      return;
    }
    setTaskType(type);
  };

  const handleInputModeChange = (mode) => {
    if (!isInputModeAvailable(subscriptionTier, mode)) {
      showPremiumPrompt(FEATURES.VOICE_INPUT);
      return;
    }
    setInputMode(mode);
  };

  const renderStudent = ({ item }) => {
    const isSelected = selectedStudents.includes(item.id);
    return (
      <TouchableOpacity
        style={[styles.card, isSelected && styles.cardSelected]}
        onPress={() => toggleStudent(item.id)}
      >
        <View style={[styles.avatar, { backgroundColor: item.avatarColor }]}>
          <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
        </View>
        <Text style={styles.cardText}>{item.name}</Text>
        {isSelected && <Text style={styles.checkmark}>✓</Text>}
      </TouchableOpacity>
    );
  };

  const renderList = ({ item }) => {
    const isSelected = selectedList?.id === item.id;
    return (
      <TouchableOpacity
        style={[styles.card, isSelected && styles.cardSelected]}
        onPress={() => setSelectedList(item)}
      >
        <Text style={styles.listIcon}>📝</Text>
        <View style={styles.cardInfo}>
          <Text style={styles.cardText}>{item.name}</Text>
          <Text style={styles.cardMeta}>{item.word_count || 0} words</Text>
        </View>
        {isSelected && <Text style={styles.checkmark}>✓</Text>}
      </TouchableOpacity>
    );
  };

  const renderOptionsScreen = () => {
    const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    
    return (
      <ScrollView style={styles.optionsContainer}>
        {/* Task Type */}
        <View style={styles.optionSection}>
          <View style={styles.optionHeader}>
            <Text style={styles.optionLabel}>Task Type</Text>
            {!tierLimits.hasTestMode && (
              <Text style={styles.premiumBadge}>💎 Premium</Text>
            )}
          </View>
          <View style={styles.toggleRow}>
            <TouchableOpacity
              style={[styles.toggleButton, taskType === 'practice' && styles.toggleButtonActive]}
              onPress={() => handleTestModeToggle('practice')}
            >
              <Text style={[styles.toggleButtonText, taskType === 'practice' && styles.toggleButtonTextActive]}>
                Practice
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleButton, taskType === 'test' && styles.toggleButtonActive, !tierLimits.hasTestMode && styles.toggleButtonDisabled]}
              onPress={() => handleTestModeToggle('test')}
            >
              <Text style={[styles.toggleButtonText, taskType === 'test' && styles.toggleButtonTextActive]}>
                Test {!tierLimits.hasTestMode && '🔒'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Input Mode */}
        <View style={styles.optionSection}>
          <View style={styles.optionHeader}>
            <Text style={styles.optionLabel}>Input Mode</Text>
            {!tierLimits.hasVoiceInput && (
              <Text style={styles.premiumBadge}>💎 Premium</Text>
            )}
          </View>
          <TouchableOpacity
            style={[styles.inputModeOption, inputMode === INPUT_MODES.TYPE_ONLY && styles.inputModeOptionSelected]}
            onPress={() => handleInputModeChange(INPUT_MODES.TYPE_ONLY)}
          >
            <Text style={styles.inputModeText}>⌨️ Type Only (Free)</Text>
            {inputMode === INPUT_MODES.TYPE_ONLY && <Text style={styles.checkmark}>✓</Text>}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.inputModeOption, inputMode === INPUT_MODES.SPELL_ONLY && styles.inputModeOptionSelected, !tierLimits.inputModes.includes(INPUT_MODES.SPELL_ONLY) && styles.inputModeOptionDisabled]}
            onPress={() => handleInputModeChange(INPUT_MODES.SPELL_ONLY)}
          >
            <Text style={styles.inputModeText}>🎤 Spell Only {!tierLimits.inputModes.includes(INPUT_MODES.SPELL_ONLY) && '🔒'}</Text>
            {inputMode === INPUT_MODES.SPELL_ONLY && <Text style={styles.checkmark}>✓</Text>}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.inputModeOption, inputMode === INPUT_MODES.SAY_SPELL_SAY && styles.inputModeOptionSelected, !tierLimits.inputModes.includes(INPUT_MODES.SAY_SPELL_SAY) && styles.inputModeOptionDisabled]}
            onPress={() => handleInputModeChange(INPUT_MODES.SAY_SPELL_SAY)}
          >
            <Text style={styles.inputModeText}>🗣️ Say-Spell-Say {!tierLimits.inputModes.includes(INPUT_MODES.SAY_SPELL_SAY) && '🔒'}</Text>
            {inputMode === INPUT_MODES.SAY_SPELL_SAY && <Text style={styles.checkmark}>✓</Text>}
          </TouchableOpacity>
        </View>

        {/* Allow Student to Change Input Mode */}
        <View style={styles.optionSection}>
          <View style={styles.optionHeader}>
            <Text style={styles.optionLabel}>Student Control</Text>
            <Switch
              value={allowInputModeChange}
              onValueChange={setAllowInputModeChange}
              trackColor={{ false: '#d1d5db', true: '#a5b4fc' }}
              thumbColor={allowInputModeChange ? '#4F46E5' : '#f3f4f6'}
            />
          </View>
          <Text style={styles.optionDescription}>
            {allowInputModeChange 
              ? '✓ Student can switch between typing and voice input during practice'
              : '✗ Student must use the assigned input mode only'}
          </Text>
        </View>

        {/* Sound Toggle (Premium) */}
        {tierLimits.hasSoundToggle && (
          <View style={styles.optionSection}>
            <View style={styles.optionHeader}>
              <Text style={styles.optionLabel}>Sound Effects</Text>
              <Switch
                value={soundEnabled}
                onValueChange={setSoundEnabled}
                trackColor={{ false: '#d1d5db', true: '#a5b4fc' }}
                thumbColor={soundEnabled ? '#4F46E5' : '#f3f4f6'}
              />
            </View>
            <Text style={styles.optionDescription}>
              Toggle sound effects and audio feedback during practice
            </Text>
          </View>
        )}

        {/* Schedule Type */}
        <View style={styles.optionSection}>
          <Text style={styles.optionLabel}>Schedule</Text>
          <View style={styles.toggleRow}>
            <TouchableOpacity
              style={[styles.toggleButton, scheduleType === 'one-time' && styles.toggleButtonActive]}
              onPress={() => setScheduleType('one-time')}
            >
              <Text style={[styles.toggleButtonText, scheduleType === 'one-time' && styles.toggleButtonTextActive]}>
                One-Time
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleButton, scheduleType === 'daily' && styles.toggleButtonActive]}
              onPress={() => setScheduleType('daily')}
            >
              <Text style={[styles.toggleButtonText, scheduleType === 'daily' && styles.toggleButtonTextActive]}>
                Daily
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Due Date (One-Time) */}
        {scheduleType === 'one-time' && (
          <View style={styles.optionSection}>
            <Text style={styles.optionLabel}>Due Date (Optional)</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.dateButtonText}>
                {dueDate ? dueDate.toLocaleDateString() : 'No due date'}
              </Text>
            </TouchableOpacity>
            {dueDate && (
              <TouchableOpacity onPress={() => setDueDate(null)}>
                <Text style={styles.clearDateText}>Clear</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Daily Schedule */}
        {scheduleType === 'daily' && (
          <View style={styles.optionSection}>
            <Text style={styles.optionLabel}>Select Days</Text>
            <View style={styles.daysContainer}>
              {DAYS.map(day => (
                <TouchableOpacity
                  key={day}
                  style={[styles.dayButton, dailySchedule.days.includes(day) && styles.dayButtonActive]}
                  onPress={() => toggleDay(day)}
                >
                  <Text style={[styles.dayButtonText, dailySchedule.days.includes(day) && styles.dayButtonTextActive]}>
                    {day}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={[styles.optionLabel, { marginTop: 16 }]}>Start Date</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.dateButtonText}>
                {dailySchedule.startDate.toLocaleDateString()}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Date Picker */}
        {showDatePicker && (
          <DateTimePicker
            value={scheduleType === 'one-time' ? (dueDate || new Date()) : dailySchedule.startDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleDateChange}
            minimumDate={new Date()}
          />
        )}
      </ScrollView>
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
    <View style={styles.container}>
      <PremiumGate
        visible={showPremiumGate}
        onClose={() => setShowPremiumGate(false)}
        onUpgrade={() => navigation.navigate('Upgrade', { currentTier: subscriptionTier })}
        title={premiumGateInfo.title}
        message={premiumGateInfo.message}
        currentTier={subscriptionTier}
        requiredTier={premiumGateInfo.tier}
      />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {step === 'students' ? 'Select Students' : step === 'list' ? 'Select Word List' : 'Task Options'}
        </Text>
        <Text style={styles.headerSubtitle}>
          {step === 'students' 
            ? `${selectedStudents.length} selected`
            : step === 'list'
            ? selectedList ? selectedList.name : 'Choose a list'
            : 'Configure task settings'}
        </Text>
      </View>

      {step === 'options' ? (
        renderOptionsScreen()
      ) : (
        <FlatList
          data={step === 'students' ? students : lists}
          renderItem={step === 'students' ? renderStudent : renderList}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {step === 'students' ? 'No students found' : 'No word lists found'}
              </Text>
              <Text style={styles.emptySubtext}>
                {step === 'students' 
                  ? 'Create students first in Student Management'
                  : 'Create word lists first in Word Lists'}
              </Text>
            </View>
          }
        />
      )}

      <View style={styles.footer}>
        {step !== 'students' && (
          <TouchableOpacity
            style={[styles.button, styles.backButton]}
            onPress={handleBack}
          >
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={step === 'options' ? handleAssign : handleNext}
        >
          <Text style={styles.primaryButtonText}>
            {step === 'options' ? 'Assign Task' : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>
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
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  list: {
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardSelected: {
    borderColor: '#4F46E5',
    backgroundColor: '#eef2ff',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  listIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  cardInfo: {
    flex: 1,
  },
  cardText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  cardMeta: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  checkmark: {
    fontSize: 24,
    color: '#4F46E5',
    fontWeight: 'bold',
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
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 6,
  },
  backButton: {
    backgroundColor: '#f3f4f6',
  },
  backButtonText: {
    color: '#6b7280',
    fontSize: 16,
    fontWeight: '600',
  },
  primaryButton: {
    backgroundColor: '#4F46E5',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  optionsContainer: {
    flex: 1,
    padding: 16,
  },
  optionSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  toggleRow: {
    flexDirection: 'row',
  },
  toggleButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
    alignItems: 'center',
    marginHorizontal: 6,
  },
  toggleButtonActive: {
    borderColor: '#4F46E5',
    backgroundColor: '#eef2ff',
  },
  toggleButtonDisabled: {
    opacity: 0.5,
  },
  toggleButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  toggleButtonTextActive: {
    color: '#4F46E5',
  },
  inputModeOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  inputModeOptionSelected: {
    borderColor: '#4F46E5',
    backgroundColor: '#eef2ff',
  },
  inputModeOptionDisabled: {
    opacity: 0.5,
  },
  inputModeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
  },
  dateButton: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
  },
  dateButtonText: {
    fontSize: 14,
    color: '#1f2937',
  },
  clearDateText: {
    fontSize: 14,
    color: '#ef4444',
    marginTop: 8,
    textAlign: 'center',
  },
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
    margin: 4,
  },
  dayButtonActive: {
    borderColor: '#4F46E5',
    backgroundColor: '#eef2ff',
  },
  dayButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  dayButtonTextActive: {
    color: '#4F46E5',
  },
  optionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  premiumBadge: {
    fontSize: 12,
    color: '#f59e0b',
    fontWeight: '600',
  },
  optionDescription: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 8,
  },
});

export default TaskAssignmentScreen;
