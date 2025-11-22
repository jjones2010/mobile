import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Modal,
  ScrollView,
  Share,
  Platform,
} from 'react-native';
import { subUserAPI, practiceAPI } from '../services/api';

const ProgressReportsScreen = ({ navigation }) => {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [wordAnalytics, setWordAnalytics] = useState([]);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    setLoading(true);
    try {
      const response = await subUserAPI.getAll();
      setStudents(response.data.subUsers || []);
    } catch (error) {
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const loadSessions = async (studentId) => {
    setLoading(true);
    try {
      const response = await practiceAPI.getSessionHistory(studentId);
      setSessions(response.data.sessions || []);
    } catch (error) {
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStudentSelect = (student) => {
    setSelectedStudent(student);
    loadSessions(student.id);
  };

  const loadWordAnalytics = async (studentId, listId = null) => {
    setAnalyticsLoading(true);
    try {
      const response = await practiceAPI.getWordMastery(studentId, listId);
      setWordAnalytics(response.data.words || []);
    } catch (error) {
      console.error('Error loading word analytics:', error);
      setWordAnalytics([]);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const handleSessionPress = (session) => {
    setSelectedSession(session);
    setShowAnalyticsModal(true);
    loadWordAnalytics(selectedStudent.id);
  };

  const handlePrintReport = async () => {
    if (!selectedStudent || !wordAnalytics.length) return;

    const reportText = generateReportText();
    
    try {
      await Share.share({
        message: reportText,
        title: `${selectedStudent.name}'s Progress Report`,
      });
    } catch (error) {
      console.error('Error sharing report:', error);
    }
  };

  const generateReportText = () => {
    if (!selectedStudent || !wordAnalytics.length) return '';

    const date = new Date().toLocaleDateString();
    let report = `📊 PROGRESS REPORT\n`;
    report += `Student: ${selectedStudent.name}\n`;
    report += `Date: ${date}\n`;
    report += `\n${'='.repeat(40)}\n\n`;
    report += `WORD-BY-WORD ANALYSIS\n\n`;

    wordAnalytics.forEach((word, index) => {
      const accuracy = word.masteryLevel ? word.masteryLevel.toFixed(0) : 0;
      report += `${index + 1}. ${word.wordText.toUpperCase()}\n`;
      report += `   Accuracy: ${accuracy}%\n`;
      report += `   Attempts: ${word.attemptCount}\n`;
      report += `   Correct: ${word.correctCount}/${word.attemptCount}\n`;
      report += `   Last Practiced: ${new Date(word.lastAttempted).toLocaleDateString()}\n\n`;
    });

    report += `${'='.repeat(40)}\n`;
    report += `Total Words Practiced: ${wordAnalytics.length}\n`;
    
    const avgAccuracy = wordAnalytics.reduce((sum, w) => sum + (w.masteryLevel || 0), 0) / wordAnalytics.length;
    report += `Average Accuracy: ${avgAccuracy.toFixed(0)}%\n`;

    return report;
  };

  const renderStudent = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.studentCard,
        selectedStudent?.id === item.id && styles.studentCardSelected
      ]}
      onPress={() => handleStudentSelect(item)}
    >
      <View style={[styles.avatar, { backgroundColor: item.avatarColor }]}>
        <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
      </View>
      <Text style={styles.studentName}>{item.name}</Text>
    </TouchableOpacity>
  );

  const renderSession = ({ item }) => {
    const accuracy = item.accuracyPercentage != null ? parseFloat(item.accuracyPercentage) : 0;
    const correct = item.correctSpellings != null ? item.correctSpellings : 0;
    const total = item.totalWords != null ? item.totalWords : 0;
    
    return (
      <TouchableOpacity 
        style={styles.sessionCard}
        onPress={() => handleSessionPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.sessionHeader}>
          <Text style={styles.sessionTitle}>{item.listName || 'Practice Session'}</Text>
          <Text style={styles.sessionDate}>
            {new Date(item.completedAt).toLocaleDateString()}
          </Text>
        </View>
        <View style={styles.sessionStats}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{accuracy.toFixed(0)}%</Text>
            <Text style={styles.statLabel}>Accuracy</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{correct}</Text>
            <Text style={styles.statLabel}>Correct</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{total}</Text>
            <Text style={styles.statLabel}>Total Words</Text>
          </View>
        </View>
        <View style={[
          styles.accuracyBar,
          { width: `${Math.max(0, Math.min(100, accuracy))}%` }
        ]} />
        <Text style={styles.tapHint}>Tap for detailed word analysis</Text>
      </TouchableOpacity>
    );
  };

  const renderWordAnalytic = ({ item, index }) => {
    const accuracy = item.masteryLevel ? item.masteryLevel.toFixed(0) : 0;
    const statusColor = accuracy >= 80 ? '#10b981' : accuracy >= 50 ? '#f59e0b' : '#ef4444';
    
    return (
      <View style={styles.wordCard}>
        <View style={styles.wordHeader}>
          <Text style={styles.wordNumber}>{index + 1}</Text>
          <Text style={styles.wordText}>{item.wordText}</Text>
          <View style={[styles.accuracyBadge, { backgroundColor: statusColor }]}>
            <Text style={styles.accuracyBadgeText}>{accuracy}%</Text>
          </View>
        </View>
        <View style={styles.wordStats}>
          <View style={styles.wordStat}>
            <Text style={styles.wordStatLabel}>Attempts</Text>
            <Text style={styles.wordStatValue}>{item.attemptCount}</Text>
          </View>
          <View style={styles.wordStat}>
            <Text style={styles.wordStatLabel}>Correct</Text>
            <Text style={styles.wordStatValue}>{item.correctCount}/{item.attemptCount}</Text>
          </View>
          <View style={styles.wordStat}>
            <Text style={styles.wordStatLabel}>Last Practiced</Text>
            <Text style={styles.wordStatValue}>
              {new Date(item.lastAttempted).toLocaleDateString()}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  if (loading && !selectedStudent) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.studentsSection}>
        <Text style={styles.sectionTitle}>Select Student</Text>
        <FlatList
          horizontal
          data={students}
          renderItem={renderStudent}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.studentsList}
          showsHorizontalScrollIndicator={false}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No students found</Text>
          }
        />
      </View>

      {selectedStudent && (
        <View style={styles.sessionsSection}>
          <Text style={styles.sectionTitle}>
            {selectedStudent.name}'s Practice History
          </Text>
          {loading ? (
            <ActivityIndicator size="large" color="#4F46E5" style={{ marginTop: 40 }} />
          ) : (
            <FlatList
              data={sessions}
              renderItem={renderSession}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.sessionsList}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No practice sessions yet</Text>
                  <Text style={styles.emptySubtext}>
                    Sessions will appear here after {selectedStudent.name} completes practice
                  </Text>
                </View>
              }
            />
          )}
        </View>
      )}

      {!selectedStudent && (
        <View style={styles.placeholderContainer}>
          <Text style={styles.placeholderIcon}>📊</Text>
          <Text style={styles.placeholderText}>Select a student to view their progress</Text>
        </View>
      )}

      {/* Word Analytics Modal */}
      <Modal
        visible={showAnalyticsModal}
        animationType="slide"
        onRequestClose={() => setShowAnalyticsModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => setShowAnalyticsModal(false)}
              style={styles.closeButton}
            >
              <Text style={styles.closeButtonText}>✕ Close</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {selectedStudent?.name}'s Word Analysis
            </Text>
            <TouchableOpacity
              onPress={handlePrintReport}
              style={styles.printButton}
            >
              <Text style={styles.printButtonText}>📄 Share</Text>
            </TouchableOpacity>
          </View>

          {analyticsLoading ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color="#4F46E5" />
            </View>
          ) : (
            <FlatList
              data={wordAnalytics}
              renderItem={renderWordAnalytic}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={styles.analyticsList}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No word data available</Text>
                  <Text style={styles.emptySubtext}>
                    Complete practice sessions to see detailed word analytics
                  </Text>
                </View>
              }
            />
          )}
        </View>
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
  studentsSection: {
    backgroundColor: '#fff',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  studentsList: {
    paddingHorizontal: 16,
  },
  studentCard: {
    alignItems: 'center',
    marginRight: 16,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#f9fafb',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  studentCardSelected: {
    backgroundColor: '#eef2ff',
    borderColor: '#4F46E5',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatarText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
  },
  studentName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  sessionsSection: {
    flex: 1,
    paddingTop: 16,
  },
  sessionsList: {
    paddingHorizontal: 16,
  },
  sessionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sessionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
  },
  sessionDate: {
    fontSize: 12,
    color: '#6b7280',
  },
  sessionStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4F46E5',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  accuracyBar: {
    height: 4,
    backgroundColor: '#4F46E5',
    borderRadius: 2,
    marginTop: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 60,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  placeholderText: {
    fontSize: 16,
    color: '#6b7280',
  },
  tapHint: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 16,
    color: '#ef4444',
    fontWeight: '600',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    flex: 1,
    textAlign: 'center',
  },
  printButton: {
    padding: 8,
  },
  printButtonText: {
    fontSize: 16,
    color: '#4F46E5',
    fontWeight: '600',
  },
  analyticsList: {
    padding: 16,
  },
  wordCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  wordHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  wordNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginRight: 12,
    minWidth: 30,
  },
  wordText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    flex: 1,
  },
  accuracyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  accuracyBadgeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  wordStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  wordStat: {
    alignItems: 'center',
  },
  wordStatLabel: {
    fontSize: 11,
    color: '#6b7280',
    marginBottom: 4,
  },
  wordStatValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
});

export default ProgressReportsScreen;
