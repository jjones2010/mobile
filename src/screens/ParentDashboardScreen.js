import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { clearAuthToken } from '../services/api';
import { SUBSCRIPTION_TIERS } from '../services/premiumFeatures';

const ParentDashboardScreen = ({ navigation, route }) => {
  const { user } = route.params || {};
  // Backend returns subscriptionTier (camelCase), fallback to subscription_tier for compatibility
  const subscriptionTier = user?.subscriptionTier || user?.subscription_tier || SUBSCRIPTION_TIERS.FREE;
  
  const getTierDisplayName = (tier) => {
    const names = {
      [SUBSCRIPTION_TIERS.FREE]: 'Free',
      [SUBSCRIPTION_TIERS.PREMIUM]: 'Premium',
      [SUBSCRIPTION_TIERS.TIER1]: 'Premium Plus',
      [SUBSCRIPTION_TIERS.TIER2]: 'Classroom',
    };
    return names[tier] || 'Free';
  };

  const handleLogout = async () => {
    await clearAuthToken();
    navigation.replace('Login');
  };

  const menuItems = [
    {
      title: 'Manage Students',
      description: 'Add, edit, or remove student accounts',
      icon: '👥',
      screen: 'StudentManagement',
      color: '#3b82f6',
    },
    {
      title: 'Word Lists',
      description: 'Create and manage spelling word lists',
      icon: '📝',
      screen: 'ContentManagement',
      color: '#10b981',
    },
    {
      title: 'Assign Tasks',
      description: 'Assign word lists to students',
      icon: '✓',
      screen: 'TaskAssignment',
      color: '#f59e0b',
    },
    {
      title: 'Manage Assignments',
      description: 'View and delete active assignments',
      icon: '🗑️',
      screen: 'ManageAssignments',
      color: '#ef4444',
    },
    {
      title: 'Progress Reports',
      description: 'View student performance and analytics',
      icon: '📊',
      screen: 'ProgressReports',
      color: '#8b5cf6',
    },
    {
      title: 'Voice Settings',
      description: 'Choose the voice for word pronunciation',
      icon: '🔊',
      screen: 'VoiceSettings',
      color: '#06b6d4',
    },
    {
      title: 'Student Login',
      description: 'Switch to student view',
      icon: '🎓',
      screen: 'SubUserLogin',
      color: '#ec4899',
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>Teacher Dashboard</Text>
            <Text style={styles.headerSubtitle}>{user?.email || 'Welcome'}</Text>
          </View>
          {subscriptionTier === SUBSCRIPTION_TIERS.FREE && (
            <TouchableOpacity 
              style={styles.upgradeButton}
              onPress={() => navigation.navigate('Upgrade', { currentTier: subscriptionTier })}
            >
              <Text style={styles.upgradeButtonText}>💎 Upgrade</Text>
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.tierBadge}>
          <Text style={styles.tierBadgeText}>
            {getTierDisplayName(subscriptionTier)} Plan
          </Text>
        </View>
      </View>

      <ScrollView style={styles.content}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.menuItem, { borderLeftColor: item.color }]}
            onPress={() => navigation.navigate(item.screen, { 
              user,
              subscriptionTier
            })}
          >
            <Text style={styles.menuIcon}>{item.icon}</Text>
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuTitle}>{item.title}</Text>
              <Text style={styles.menuDescription}>{item.description}</Text>
            </View>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
        ))}

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#4F46E5',
    padding: 24,
    paddingTop: 60,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#e0e7ff',
  },
  upgradeButton: {
    backgroundColor: '#f59e0b',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  upgradeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  tierBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  tierBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  menuItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  menuIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  menuDescription: {
    fontSize: 14,
    color: '#6b7280',
  },
  menuArrow: {
    fontSize: 32,
    color: '#d1d5db',
    fontWeight: '300',
  },
  logoutButton: {
    backgroundColor: '#ef4444',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 32,
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ParentDashboardScreen;
