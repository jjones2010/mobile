import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { taskAPI, subUserAPI } from '../services/api';
import { hasFeatureAccess, FEATURES } from '../services/premiumFeatures';

const ManageAssignmentsScreen = ({ navigation }) => {
  const [tasks, setTasks] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedTasks, setSelectedTasks] = useState([]);
  const [subscriptionTier, setSubscriptionTier] = useState('FREE');
  const [hasBulkAccess, setHasBulkAccess] = useState(false);

  useEffect(() => {
    loadData();
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

  const loadData = async () => {
    setLoading(true);
    try {
      const [tasksRes, studentsRes] = await Promise.all([
        taskAPI.getParentTasks(),
        subUserAPI.getAll(),
      ]);
      
      const tasksData = tasksRes.data.tasks || [];
      const studentsData = studentsRes.data.subUsers || [];
      
      // Filter only active tasks
      const activeTasks = tasksData.filter(t => t.isActive);
      
      // Get detailed info for each task (includes assignments)
      const tasksWithDetails = await Promise.all(
        activeTasks.map(async (task) => {
          try {
            const detailsRes = await taskAPI.getTaskDetails(task.taskId);
            return detailsRes.data;
          } catch (error) {
            console.error(`Failed to load details for task ${task.taskId}:`, error);
            return null;
          }
        })
      );
      
      // Filter out any failed requests
      const validTasks = tasksWithDetails.filter(t => t !== null);
      
      setTasks(validTasks);
      setStudents(studentsData);
    } catch (error) {
      console.error('Load data error:', error);
      Alert.alert('Error', 'Failed to load assignments');
    } finally {
      setLoading(false);
    }
  };

  const getStudentName = (studentId) => {
    const student = students.find(s => s.id === studentId);
    return student ? student.name : 'Unknown';
  };

  const handleDeleteAssignment = (taskData) => {
    Alert.alert(
      'Delete Assignment',
      `Delete "${taskData.task.list.name}" for ${taskData.assignments.length} student(s)?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => confirmDelete(taskData),
        },
      ]
    );
  };

  const confirmDelete = async (taskData) => {
    setDeleting(taskData.task.id);
    try {
      // Get all student IDs from this task's assignments
      const studentIds = taskData.assignments.map(a => a.subUser.id);
      
      await taskAPI.remove(taskData.task.id, studentIds);
      
      Alert.alert('Success', 'Assignment deleted successfully');
      
      // Reload data
      await loadData();
    } catch (error) {
      console.error('Delete error:', error);
      Alert.alert('Error', 'Failed to delete assignment');
    } finally {
      setDeleting(null);
    }
  };

  const toggleSelectionMode = () => {
    if (!hasBulkAccess) {
      Alert.alert(
        'Premium Feature',
        'Bulk delete is available in Premium and Classroom plans. Upgrade to select and delete multiple assignments at once.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Upgrade', onPress: () => navigation.navigate('Upgrade') },
        ]
      );
      return;
    }
    setSelectionMode(!selectionMode);
    setSelectedTasks([]);
  };

  const toggleTaskSelection = (taskId) => {
    if (selectedTasks.includes(taskId)) {
      setSelectedTasks(selectedTasks.filter(id => id !== taskId));
    } else {
      setSelectedTasks([...selectedTasks, taskId]);
    }
  };

  const handleBulkDelete = () => {
    if (selectedTasks.length === 0) {
      Alert.alert('No Selection', 'Please select assignments to delete');
      return;
    }

    Alert.alert(
      'Delete Assignments',
      `Delete ${selectedTasks.length} assignment(s)?`,
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
    setDeleting('bulk');
    try {
      // Delete each selected task
      for (const taskId of selectedTasks) {
        const taskData = tasks.find(t => t.task.id === taskId);
        if (taskData) {
          const studentIds = taskData.assignments.map(a => a.subUser.id);
          await taskAPI.remove(taskId, studentIds);
        }
      }

      Alert.alert('Success', `${selectedTasks.length} assignment(s) deleted`);
      setSelectionMode(false);
      setSelectedTasks([]);
      await loadData();
    } catch (error) {
      console.error('Bulk delete error:', error);
      Alert.alert('Error', 'Failed to delete some assignments');
    } finally {
      setDeleting(null);
    }
  };

  const handleDeleteFromStudent = (taskData, studentId) => {
    const assignment = taskData.assignments.find(a => a.subUser.id === studentId);
    const studentName = assignment ? assignment.subUser.name : 'Unknown';
    
    Alert.alert(
      'Remove Assignment',
      `Remove "${taskData.task.list.name}" from ${studentName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => removeFromStudent(taskData, studentId),
        },
      ]
    );
  };

  const removeFromStudent = async (taskData, studentId) => {
    setDeleting(`${taskData.task.id}-${studentId}`);
    try {
      await taskAPI.remove(taskData.task.id, [studentId]);
      
      Alert.alert('Success', 'Assignment removed from student');
      
      // Reload data
      await loadData();
    } catch (error) {
      console.error('Remove error:', error);
      Alert.alert('Error', 'Failed to remove assignment');
    } finally {
      setDeleting(null);
    }
  };

  const renderTask = ({ item }) => {
    const isSelected = selectedTasks.includes(item.task.id);
    
    return (
    <TouchableOpacity
      style={[styles.taskCard, isSelected && styles.taskCardSelected]}
      onPress={() => selectionMode && toggleTaskSelection(item.task.id)}
      activeOpacity={selectionMode ? 0.7 : 1}
    >
      {selectionMode && (
        <View style={styles.checkbox}>
          {isSelected && <Text style={styles.checkmark}>✓</Text>}
        </View>
      )}
      <View style={styles.taskHeader}>
        <View style={styles.taskInfo}>
          <Text style={styles.taskTitle}>{item.task.list.name}</Text>
          <Text style={styles.taskMeta}>
            {item.assignments.length} student(s)
            {' • '}
            {item.task.list.wordCount} words
          </Text>
          {item.task.dueDate && (
            <Text style={styles.dueDate}>
              Due: {new Date(item.task.dueDate).toLocaleDateString()}
            </Text>
          )}
        </View>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteAssignment(item)}
          disabled={deleting === item.task.id}
        >
          {deleting === item.task.id ? (
            <ActivityIndicator size="small" color="#DC2626" />
          ) : (
            <Text style={styles.deleteButtonText}>🗑️</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.studentsContainer}>
        <Text style={styles.studentsLabel}>Assigned to:</Text>
        {item.assignments.map((assignment) => (
          <View key={assignment.assignmentId} style={styles.studentRow}>
            <View style={styles.studentInfo}>
              <Text style={styles.studentName}>
                • {assignment.subUser.name}
              </Text>
              <Text style={styles.studentStatus}>
                {assignment.status === 'COMPLETED' ? '✓ Completed' : 
                 assignment.status === 'IN_PROGRESS' ? '⏳ In Progress' : '📋 Assigned'}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.removeStudentButton}
              onPress={() => handleDeleteFromStudent(item, assignment.subUser.id)}
              disabled={deleting === `${item.task.id}-${assignment.subUser.id}`}
            >
              {deleting === `${item.task.id}-${assignment.subUser.id}` ? (
                <ActivityIndicator size="small" color="#DC2626" />
              ) : (
                <Text style={styles.removeStudentText}>Remove</Text>
              )}
            </TouchableOpacity>
          </View>
        ))}
      </View>
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

  if (tasks.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyText}>No active assignments</Text>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => navigation.navigate('TaskAssignment')}
        >
          <Text style={styles.createButtonText}>Create Assignment</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header with bulk actions */}
      <View style={styles.headerBar}>
        <TouchableOpacity
          style={styles.selectButton}
          onPress={toggleSelectionMode}
        >
          <Text style={styles.selectButtonText}>
            {selectionMode ? 'Cancel' : '☑️ Select Multiple'}
          </Text>
        </TouchableOpacity>
        
        {selectionMode && (
          <TouchableOpacity
            style={[styles.bulkDeleteButton, selectedTasks.length === 0 && styles.bulkDeleteButtonDisabled]}
            onPress={handleBulkDelete}
            disabled={selectedTasks.length === 0 || deleting === 'bulk'}
          >
            {deleting === 'bulk' ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.bulkDeleteButtonText}>
                🗑️ Delete ({selectedTasks.length})
              </Text>
            )}
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={tasks}
        renderItem={renderTask}
        keyExtractor={(item) => item.task.id.toString()}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  listContainer: {
    padding: 16,
  },
  taskCard: {
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
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  taskInfo: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  taskMeta: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  dueDate: {
    fontSize: 12,
    color: '#F59E0B',
    fontWeight: '600',
  },
  deleteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButtonText: {
    fontSize: 20,
  },
  studentsContainer: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 12,
  },
  studentsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
  },
  studentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  studentStatus: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
    marginLeft: 12,
  },
  removeStudentButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#FEE2E2',
  },
  removeStudentText: {
    fontSize: 12,
    color: '#DC2626',
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 24,
  },
  createButton: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  selectButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#4F46E5',
  },
  selectButtonText: {
    color: '#4F46E5',
    fontSize: 14,
    fontWeight: '600',
  },
  bulkDeleteButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#DC2626',
    minWidth: 120,
    alignItems: 'center',
  },
  bulkDeleteButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  bulkDeleteButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 6,
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
    fontSize: 18,
    color: '#4F46E5',
    fontWeight: 'bold',
  },
  taskCardSelected: {
    backgroundColor: '#EEF2FF',
    borderWidth: 2,
    borderColor: '#4F46E5',
  },
});

export default ManageAssignmentsScreen;
