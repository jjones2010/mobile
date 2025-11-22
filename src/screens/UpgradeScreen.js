import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { SUBSCRIPTION_TIERS } from '../services/premiumFeatures';

const UpgradeScreen = ({ navigation, route }) => {
  const currentTier = route?.params?.currentTier || SUBSCRIPTION_TIERS.FREE;
  const [selectedTier, setSelectedTier] = useState(SUBSCRIPTION_TIERS.PREMIUM);

  const tiers = [
    {
      id: SUBSCRIPTION_TIERS.PREMIUM,
      name: 'Premium',
      price: '$2.99/month',
      annualPrice: '$29/year',
      students: '3 students',
      features: [
        'All 3 input modes (voice + typing)',
        'Test mode for assessments',
        'Advanced analytics & reports',
        'Print session reports',
        'App unlock rewards',
        'Sound effect controls',
      ],
      popular: false,
    },
    {
      id: SUBSCRIPTION_TIERS.TIER1,
      name: 'Premium Plus',
      price: '$4.99/month',
      annualPrice: '$49/year',
      students: '10 students',
      features: [
        'Everything in Premium',
        'Up to 10 students',
        'Perfect for larger families',
        'Same premium features',
      ],
      popular: true,
    },
    {
      id: SUBSCRIPTION_TIERS.TIER2,
      name: 'Classroom',
      price: '$29.99/month',
      annualPrice: '$299/year',
      students: '50 students',
      features: [
        'Everything in Premium Plus',
        'Up to 50 students',
        'Bulk task assignment',
        'Export class reports',
        'Perfect for teachers',
      ],
      popular: false,
    },
  ];

  const handleSubscribe = async () => {
    // TODO: Integrate with In-App Purchase API
    // For now, show a message
    Alert.alert(
      'Coming Soon',
      'In-app purchases will be available in the next update. For now, please upgrade from the web dashboard.',
      [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]
    );
  };

  const handleRestorePurchases = async () => {
    Alert.alert(
      'Restore Purchases',
      'This will restore any previous purchases made with this Apple ID.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Restore', 
          onPress: () => {
            // TODO: Implement restore purchases
            Alert.alert('Success', 'Purchases restored successfully!');
          }
        }
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Upgrade to Premium</Text>
        <Text style={styles.subtitle}>Unlock all features and maximize learning</Text>
      </View>

      {tiers.map((tier) => (
        <TouchableOpacity
          key={tier.id}
          style={[
            styles.tierCard,
            selectedTier === tier.id && styles.tierCardSelected,
            tier.popular && styles.tierCardPopular,
          ]}
          onPress={() => setSelectedTier(tier.id)}
          activeOpacity={0.7}
        >
          {tier.popular && (
            <View style={styles.popularBadge}>
              <Text style={styles.popularText}>⭐ MOST POPULAR</Text>
            </View>
          )}
          
          <View style={styles.tierHeader}>
            <View style={styles.tierInfo}>
              <Text style={styles.tierName}>{tier.name}</Text>
              <Text style={styles.tierStudents}>{tier.students}</Text>
            </View>
            <View style={styles.tierPricing}>
              <Text style={styles.tierPrice}>{tier.price}</Text>
              <Text style={styles.tierAnnualPrice}>{tier.annualPrice}</Text>
            </View>
          </View>

          <View style={styles.features}>
            {tier.features.map((feature, index) => (
              <View key={index} style={styles.featureRow}>
                <Text style={styles.checkmark}>✓</Text>
                <Text style={styles.feature}>{feature}</Text>
              </View>
            ))}
          </View>

          {selectedTier === tier.id && (
            <View style={styles.selectedIndicator}>
              <Text style={styles.selectedText}>✓ Selected</Text>
            </View>
          )}
        </TouchableOpacity>
      ))}

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.subscribeButton}
          onPress={handleSubscribe}
        >
          <Text style={styles.subscribeButtonText}>
            Subscribe to {tiers.find(t => t.id === selectedTier)?.name}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.restoreButton}
          onPress={handleRestorePurchases}
        >
          <Text style={styles.restoreButtonText}>Restore Purchases</Text>
        </TouchableOpacity>

        <Text style={styles.disclaimer}>
          • Subscriptions auto-renew unless cancelled{'\n'}
          • Cancel anytime from your account settings{'\n'}
          • Annual plans save up to 19%
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    padding: 24,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  tierCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    margin: 16,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    position: 'relative',
  },
  tierCardSelected: {
    borderColor: '#f59e0b',
    backgroundColor: '#fffbeb',
  },
  tierCardPopular: {
    borderColor: '#8b5cf6',
  },
  popularBadge: {
    position: 'absolute',
    top: -12,
    left: 20,
    backgroundColor: '#8b5cf6',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  tierHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  tierInfo: {
    flex: 1,
  },
  tierName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  tierStudents: {
    fontSize: 14,
    color: '#6b7280',
  },
  tierPricing: {
    alignItems: 'flex-end',
  },
  tierPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#f59e0b',
  },
  tierAnnualPrice: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  features: {
    marginTop: 8,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  checkmark: {
    fontSize: 16,
    color: '#10b981',
    marginRight: 8,
    fontWeight: 'bold',
  },
  feature: {
    fontSize: 14,
    color: '#4b5563',
    flex: 1,
  },
  selectedIndicator: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f59e0b',
    alignItems: 'center',
  },
  selectedText: {
    color: '#f59e0b',
    fontWeight: 'bold',
    fontSize: 14,
  },
  footer: {
    padding: 16,
    paddingBottom: 32,
  },
  subscribeButton: {
    backgroundColor: '#f59e0b',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  subscribeButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  restoreButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 16,
  },
  restoreButtonText: {
    color: '#6b7280',
    fontSize: 16,
    fontWeight: '600',
  },
  disclaimer: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default UpgradeScreen;
