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
import { subUserAPI, taskAPI } from '../services/api';
import { hasFeatureAccess, FEATURES, getUpgradeMessage } from '../services/premiumFeatures';

const BulkTaskAssignmentScreen = ({ route, navigation }) => {
  const { list, subscriptionTier } = route.params;
  
  const [subUsers, setSubUsers] = useState([]);
  const [selectedSubUsers, setSelectedSubUsers] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);

  const hasBulkAccess = hasFeatureAccess(subscriptionTier, FEATURES.BULK_ASSIGNMENT);

  useEffect(() => {
    loadSubUsers();
  }, []);

  const loadSubUsers = async () => {
    try {
      const response = await subUserAPI.getAll();
      setSubUsers(response.data.subUsers.filter(su => su.isActive));
    } catch (error) {
      Alert.alert('Error', 'Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const toggleSubUser = (subUserId) => {
    const newSelection = new Set(selectedSubUsers);
    
    if (newSelection.has(subUserId)) {
      newSelection.delete(subUserId);
    } else {
      // Check if bulk selection is allowed
      if (newSelection.size >= 1 && !hasBulkAccess) {
        const message = getUpgradeMessage(FEATURES.BULK_ASSIGNMENT);
        Alert.alert(message.title, message.message, [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Upgrade', onPress: () => navigation.navigate('Subscription') },
        ]);
        return;
      }
      newSelection.add(subUserId);
    }
    
    setSelectedSubUsers(newSelection);
  };

  const selectAll = () => {
    if (!hasBulkAccess) {
      const message = getUpgradeMessage(FEATURES.BULK_ASSIGNMENT);
      Alert.alert(message.title, message.message, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Upgrade', onPress: () => navigation.navigate('Subscription') },
      ]);
      return;
    }
    
    const allIds = new Set(subUsers.map(su => su.id));
    setSelectedSubUsers(allIds);
  };

  const deselectAll = () => {
    setSelectedSubUsers(new Set());
  };

  const handleAssign = async () => {
    if (selectedSubUsers.size === 0) {
      Alert.alert('Error', 'Please select at least one student');
      return;
    }

    const subUserIds = Array.from(selectedSubUsers);
    const isBulk = subUserIds.length > 1;

    Alert.alert(
      'Confirm Assignment',
      `Assign "${list.name}" to ${subUserIds.length} student${subUserIds.length > 1 ? 's' : ''}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Assign', onPress: () => performAssignment(subUserIds, isBulk) },
      ]
    );
  };

  const performAssignment = async (subUserIds, isBulk) => {
    setAssigning(true);
    try {
      await taskAPI.assign(list.id, subUserIds);
      
      Alert.alert(
        'Success',
        isBulk 
          ? `Task assigned to ${subUserIds.length} students successfully!`
          : 'Task assigned successfully!',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to assign task';
      Alert.alert('Error', message);
    } finally {
      setAssigning(false);
    }
  };

  const renderSubUserItem = ({ item }) => {
    const isSelected = selectedSubUsers.has(item.id);
    
    return (
      <TouchableOpacity
        style={[styles.subUserCard, isSelected && styles.subUserCardSelected]}
        onPress={() => toggleSubUser(item.id)}
        disabled={assigning}
      >
        <View style={[styles.avatar, { backgroundColor: item.avatarColor }]}>
          <Text style={styles.avatarText}>
            {item.name.charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text style={styles.subUserName}>{item.name}</Text>
        {isSelected && (
          <View style={styles.checkmark}>
            <Text style={styles.checkmarkText}>✓</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Assign Task</Text>
      </View>

      {/* List Info */}
      <View style={styles.listInfo}>
        <Text style={styles.listName}>{list.name}</Text>
        <Text style={styles.listDetails}>
          {list.word_count || 0} words • {list.grade_name}
        </Text>
      </View>

      {/* Selection Controls */}
      <View style={styles.controls}>
        <Text style={styles.selectionText}>
          {selectedSubUsers.size} of {subUsers.length} selected
        </Text>
        <View style={styles.controlButtons}>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={selectAll}
            disabled={assigning}
          >
            <Text style={styles.controlButtonText}>
              Select All {!hasBulkAccess && '👑'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={deselectAll}
            disabled={assigning}
          >
            <Text style={styles.controlButtonText}>Clear</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Bulk Assignment Notice */}
      {!hasBulkAccess && (
        <View style={styles.notice}>
          <Text style={styles.noticeIcon}>👑</Text>
          <Text style={styles.noticeText}>
            Bulk assignment (multiple students) requires Classroom Plan (Tier 2)
          </Text>
        </View>
      )}

      {/* Student List */}
      <FlatList
        data={subUsers}
        renderItem={renderSubUserItem}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.grid}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No students found</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => navigation.navigate('AddSubUser')}
            >
              <Text style={styles.addButtonText}>Add Student</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* Assign Button */}
      {subUsers.length > 0 && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.assignButton,
              (selectedSubUsers.size === 0 || assigning) && styles.assignButtonDisabled,
            ]}
            onPress={handleAssign}
            disabled={selectedSubUsers.size === 0 || assigning}
          >
            {assigning ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.assignButtonText}>
                Assign to {selectedSubUsers.size} Student{selectedSubUsers.size !== 1 ? 's' : ''}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      )}
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
  },
  header: {
    backgroundColor: '#fff',
    padding: 16,
    paddingTop: 48,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backText: {
    color: '#3b82f6',
    fontSize: 16,
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  listInfo: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  listName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  listDetails: {
    fontSize: 14,
    color: '#6b7280',
  },
  controls: {
    backgroundColor: '#fff',
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  selectionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  controlButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  controlButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f3f4f6',
    borderRadius: 6,
  },
  controlButtonText: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '500',
  },
  notice: {
    backgroundColor: '#fef3c7',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#fde68a',
  },
  noticeIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  noticeText: {
    flex: 1,
    fontSize: 13,
    color: '#92400e',
  },
  grid: {
    padding: 8,
  },
  subUserCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    padding: 16,
    margin: 8,
    alignItems: 'center',
    minHeight: 140,
    justifyContent: 'center',
    position: 'relative',
  },
  subUserCardSelected: {
    borderColor: '#3b82f6',
    backgroundColor: '#eff6ff',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  avatarText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
  },
  subUserName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    textAlign: 'center',
  },
  checkmark: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 16,
  },
  addButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    backgroundColor: '#fff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  assignButton: {
    backgroundColor: '#10b981',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  assignButtonDisabled: {
    backgroundColor: '#6ee7b7',
  },
  assignButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default BulkTaskAssignmentScreen;
