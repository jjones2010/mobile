/**
 * In-App Purchase Service
 * Handles subscription purchases for iOS and Android
 * 
 * NOTE: This requires react-native-iap to be installed:
 * npm install react-native-iap
 * cd ios && pod install && cd ..
 */

import { SUBSCRIPTION_TIERS } from './premiumFeatures';

// Product IDs must match App Store Connect / Google Play Console
const PRODUCT_IDS = {
  [SUBSCRIPTION_TIERS.PREMIUM]: {
    monthly: 'premium_monthly',
    annual: 'premium_annual',
  },
  [SUBSCRIPTION_TIERS.TIER1]: {
    monthly: 'premium_plus_monthly',
    annual: 'premium_plus_annual',
  },
  [SUBSCRIPTION_TIERS.TIER2]: {
    monthly: 'classroom_monthly',
    annual: 'classroom_annual',
  },
};

/**
 * Mock IAP service for development
 * Replace with actual react-native-iap implementation when ready
 */
export const iapService = {
  /**
   * Initialize IAP connection
   */
  initialize: async () => {
    try {
      console.log('[IAP] Initializing...');
      // TODO: Implement with react-native-iap
      // await RNIap.initConnection();
      // await RNIap.flushFailedPurchasesCachedAsPendingAndroid();
      return true;
    } catch (error) {
      console.error('[IAP] Initialization error:', error);
      return false;
    }
  },

  /**
   * Get available products from store
   */
  getProducts: async () => {
    try {
      console.log('[IAP] Fetching products...');
      // TODO: Implement with react-native-iap
      // const allProductIds = Object.values(PRODUCT_IDS).flatMap(tier => 
      //   [tier.monthly, tier.annual]
      // );
      // const products = await RNIap.getSubscriptions(allProductIds);
      
      // Mock products for development
      const products = [
        {
          productId: 'premium_monthly',
          title: 'Premium Monthly',
          description: 'Premium subscription - monthly',
          price: '$2.99',
          currency: 'USD',
          localizedPrice: '$2.99',
        },
        {
          productId: 'premium_annual',
          title: 'Premium Annual',
          description: 'Premium subscription - annual',
          price: '$29.00',
          currency: 'USD',
          localizedPrice: '$29.00',
        },
        {
          productId: 'premium_plus_monthly',
          title: 'Premium Plus Monthly',
          description: 'Premium Plus subscription - monthly',
          price: '$4.99',
          currency: 'USD',
          localizedPrice: '$4.99',
        },
        {
          productId: 'premium_plus_annual',
          title: 'Premium Plus Annual',
          description: 'Premium Plus subscription - annual',
          price: '$49.00',
          currency: 'USD',
          localizedPrice: '$49.00',
        },
        {
          productId: 'classroom_monthly',
          title: 'Classroom Monthly',
          description: 'Classroom subscription - monthly',
          price: '$29.99',
          currency: 'USD',
          localizedPrice: '$29.99',
        },
        {
          productId: 'classroom_annual',
          title: 'Classroom Annual',
          description: 'Classroom subscription - annual',
          price: '$299.00',
          currency: 'USD',
          localizedPrice: '$299.00',
        },
      ];
      
      return products;
    } catch (error) {
      console.error('[IAP] Get products error:', error);
      return [];
    }
  },

  /**
   * Purchase a subscription
   */
  purchase: async (tier, isAnnual = false) => {
    try {
      console.log(`[IAP] Purchasing ${tier} (${isAnnual ? 'annual' : 'monthly'})...`);
      
      const productId = isAnnual 
        ? PRODUCT_IDS[tier]?.annual 
        : PRODUCT_IDS[tier]?.monthly;
      
      if (!productId) {
        throw new Error('Invalid product ID');
      }

      // TODO: Implement with react-native-iap
      // const purchase = await RNIap.requestSubscription(productId);
      // 
      // After successful purchase, verify with backend:
      // await api.verifyPurchase({
      //   receipt: purchase.transactionReceipt,
      //   productId: productId,
      //   platform: Platform.OS === 'ios' ? 'APPLE' : 'GOOGLE',
      // });

      console.log('[IAP] Purchase successful (mock)');
      return {
        success: true,
        tier,
        productId,
      };
    } catch (error) {
      console.error('[IAP] Purchase error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  /**
   * Restore previous purchases
   */
  restorePurchases: async () => {
    try {
      console.log('[IAP] Restoring purchases...');
      
      // TODO: Implement with react-native-iap
      // const purchases = await RNIap.getAvailablePurchases();
      // 
      // if (purchases.length > 0) {
      //   // Find the most recent active subscription
      //   const activeSub = purchases.find(p => 
      //     Object.values(PRODUCT_IDS).some(tier => 
      //       tier.monthly === p.productId || tier.annual === p.productId
      //     )
      //   );
      //   
      //   if (activeSub) {
      //     // Verify with backend
      //     await api.verifyPurchase({
      //       receipt: activeSub.transactionReceipt,
      //       productId: activeSub.productId,
      //       platform: Platform.OS === 'ios' ? 'APPLE' : 'GOOGLE',
      //     });
      //     
      //     return { success: true, restored: true };
      //   }
      // }

      console.log('[IAP] No purchases to restore (mock)');
      return { success: true, restored: false };
    } catch (error) {
      console.error('[IAP] Restore error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  /**
   * Check subscription status
   */
  checkSubscriptionStatus: async () => {
    try {
      console.log('[IAP] Checking subscription status...');
      
      // TODO: Implement with backend API
      // const status = await api.getSubscriptionStatus();
      // return status;

      return {
        tier: SUBSCRIPTION_TIERS.FREE,
        expiresAt: null,
        isActive: true,
      };
    } catch (error) {
      console.error('[IAP] Status check error:', error);
      return {
        tier: SUBSCRIPTION_TIERS.FREE,
        expiresAt: null,
        isActive: true,
      };
    }
  },

  /**
   * End IAP connection
   */
  endConnection: async () => {
    try {
      console.log('[IAP] Ending connection...');
      // TODO: Implement with react-native-iap
      // await RNIap.endConnection();
    } catch (error) {
      console.error('[IAP] End connection error:', error);
    }
  },
};

export default iapService;
