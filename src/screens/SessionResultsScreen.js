import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SessionResultsScreen = ({ navigation, route }) => {
  const { results, task, subUser } = route.params;

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        {
          text: 'No',
          style: 'cancel',
        },
        {
          text: 'Yes',
          onPress: async () => {
            try {
              // Clear sub-user session
              await AsyncStorage.removeItem('currentSubUser');
              // Navigate back to sub-user login
              navigation.reset({
                index: 0,
                routes: [{ name: 'SubUserLogin' }],
              });
            } catch (error) {
              console.error('Sign out error:', error);
              Alert.alert('Error', 'Failed to sign out');
            }
          },
        },
      ]
    );
  };

  const handleContinue = () => {
    // Go back to student dashboard
    navigation.reset({
      index: 0,
      routes: [{ 
        name: 'SubUserDashboard',
        params: { subUser }
      }],
    });
  };

  const isTaskComplete = results.mastered || results.accuracyPercentage === 100;

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Success Icon */}
        <Text style={styles.icon}>{isTaskComplete ? '🎉' : '✅'}</Text>

        {/* Title */}
        <Text style={styles.title}>
          {isTaskComplete ? 'Task Complete!' : 'Practice Complete!'}
        </Text>

        {/* Results */}
        <View style={styles.resultsCard}>
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Accuracy</Text>
            <Text style={[
              styles.resultValue,
              { color: results.accuracyPercentage >= 80 ? '#10b981' : results.accuracyPercentage >= 50 ? '#f59e0b' : '#ef4444' }
            ]}>
              {results.accuracyPercentage}%
            </Text>
          </View>

          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Correct (First Try)</Text>
            <Text style={styles.resultValue}>{results.correctFirstTry}/{results.totalWords}</Text>
          </View>

          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Total Correct</Text>
            <Text style={styles.resultValue}>{results.totalCorrect}</Text>
          </View>

          {results.correctDefinitions > 0 && (
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Definitions Correct</Text>
              <Text style={styles.resultValue}>{results.correctDefinitions}</Text>
            </View>
          )}
        </View>

        {/* Task Complete Message */}
        {isTaskComplete && (
          <View style={styles.completeMessage}>
            <Text style={styles.completeText}>
              🌟 Perfect score! You've mastered all the words!
            </Text>
          </View>
        )}

        {/* Encouragement Message */}
        {!isTaskComplete && results.accuracyPercentage >= 70 && (
          <View style={styles.encouragementMessage}>
            <Text style={styles.encouragementText}>
              Great job! Keep practicing to master all the words!
            </Text>
          </View>
        )}

        {!isTaskComplete && results.accuracyPercentage < 70 && (
          <View style={styles.encouragementMessage}>
            <Text style={styles.encouragementText}>
              Good effort! Practice makes perfect. Try again!
            </Text>
          </View>
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.continueButton}
          onPress={handleContinue}
        >
          <Text style={styles.continueButtonText}>Continue</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.signOutButton}
          onPress={handleSignOut}
        >
          <Text style={styles.signOutButtonText}>Sign Out</Text>
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
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  icon: {
    fontSize: 80,
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 32,
    textAlign: 'center',
  },
  resultsCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 24,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  resultLabel: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
  },
  resultValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  completeMessage: {
    backgroundColor: '#d1fae5',
    borderRadius: 12,
    padding: 16,
    width: '100%',
    maxWidth: 400,
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
  },
  completeText: {
    fontSize: 16,
    color: '#065f46',
    textAlign: 'center',
    fontWeight: '600',
  },
  encouragementMessage: {
    backgroundColor: '#dbeafe',
    borderRadius: 12,
    padding: 16,
    width: '100%',
    maxWidth: 400,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  encouragementText: {
    fontSize: 16,
    color: '#1e40af',
    textAlign: 'center',
    fontWeight: '600',
  },
  actions: {
    padding: 24,
    gap: 12,
  },
  continueButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  signOutButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  signOutButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6b7280',
  },
});

export default SessionResultsScreen;
