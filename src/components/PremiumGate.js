import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
} from 'react-native';

/**
 * Premium Feature Gate Component
 * Shows upgrade prompt when user tries to access premium features
 */
const PremiumGate = ({ 
  visible, 
  onClose, 
  onUpgrade, 
  feature,
  title,
  message,
  currentTier,
  requiredTier,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>👑</Text>
          </View>
          
          <Text style={styles.title}>{title || 'Premium Feature'}</Text>
          <Text style={styles.message}>
            {message || 'This feature requires a premium subscription.'}
          </Text>

          {currentTier && requiredTier && (
            <View style={styles.tierInfo}>
              <Text style={styles.tierLabel}>Current Plan:</Text>
              <Text style={styles.tierValue}>{formatTier(currentTier)}</Text>
              <Text style={styles.tierLabel}>Required:</Text>
              <Text style={styles.tierValue}>{formatTier(requiredTier)}</Text>
            </View>
          )}

          <View style={styles.buttons}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
            >
              <Text style={styles.cancelButtonText}>Maybe Later</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.upgradeButton}
              onPress={() => {
                onClose();
                onUpgrade();
              }}
            >
              <Text style={styles.upgradeButtonText}>Upgrade Now</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const formatTier = (tier) => {
  const tierNames = {
    FREE: 'Free',
    TIER1: 'Premium',
    TIER2: 'Classroom',
  };
  return tierNames[tier] || tier;
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fef3c7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  icon: {
    fontSize: 48,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  tierInfo: {
    width: '100%',
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
  },
  tierLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  tierValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  buttons: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#6b7280',
    fontSize: 16,
    fontWeight: '600',
  },
  upgradeButton: {
    flex: 1,
    backgroundColor: '#f59e0b',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
  },
  upgradeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default PremiumGate;
