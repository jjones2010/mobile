/**
 * Premium Feature Gating Service
 * Handles checking and enforcing premium feature access
 */

export const SUBSCRIPTION_TIERS = {
  FREE: 'FREE',
  PREMIUM: 'PREMIUM',
  TIER1: 'TIER1',  // Premium Plus
  TIER2: 'TIER2',  // Classroom
};

export const FEATURES = {
  VOICE_INPUT: 'voice_input',
  TEST_MODE: 'test_mode',
  ADVANCED_ANALYTICS: 'advanced_analytics',
  APP_REWARDS: 'app_rewards',
  SOUND_TOGGLE: 'sound_toggle',
  PRINT_REPORTS: 'print_reports',
  BULK_ASSIGNMENT: 'bulk_assignment',
  DEFINITION_ENTRY: 'definition_entry',
  PROGRESS_TRACKING: 'progress_tracking',
  TASK_SEARCH: 'task_search',
};

export const INPUT_MODES = {
  TYPE_ONLY: 'type-only',
  SAY_SPELL_SAY: 'say-spell-say',
  SPELL_ONLY: 'spell-only',
};

/**
 * Complete tier limits configuration
 */
export const TIER_LIMITS = {
  [SUBSCRIPTION_TIERS.FREE]: {
    maxStudents: 2,
    inputModes: [INPUT_MODES.TYPE_ONLY],
    hasTestMode: false,
    hasAdvancedAnalytics: false,
    hasAppRewards: false,
    hasSoundToggle: false,
    hasBulkAssignment: false,
    hasPrintReports: false,
    hasVoiceInput: false,
    hasDefinitionEntry: false,
    hasProgressTracking: false,
    hasTaskSearch: false,
  },
  [SUBSCRIPTION_TIERS.PREMIUM]: {
    maxStudents: 3,
    inputModes: [INPUT_MODES.TYPE_ONLY, INPUT_MODES.SAY_SPELL_SAY, INPUT_MODES.SPELL_ONLY],
    hasTestMode: true,
    hasAdvancedAnalytics: true,
    hasAppRewards: true,
    hasSoundToggle: true,
    hasBulkAssignment: false,
    hasPrintReports: true,
    hasVoiceInput: true,
    hasDefinitionEntry: true,
    hasProgressTracking: true,
    hasTaskSearch: true,
  },
  [SUBSCRIPTION_TIERS.TIER1]: {
    maxStudents: 10,
    inputModes: [INPUT_MODES.TYPE_ONLY, INPUT_MODES.SAY_SPELL_SAY, INPUT_MODES.SPELL_ONLY],
    hasTestMode: true,
    hasAdvancedAnalytics: true,
    hasAppRewards: true,
    hasSoundToggle: true,
    hasBulkAssignment: false,
    hasPrintReports: true,
    hasVoiceInput: true,
    hasDefinitionEntry: true,
    hasProgressTracking: true,
    hasTaskSearch: true,
  },
  [SUBSCRIPTION_TIERS.TIER2]: {
    maxStudents: 50,
    inputModes: [INPUT_MODES.TYPE_ONLY, INPUT_MODES.SAY_SPELL_SAY, INPUT_MODES.SPELL_ONLY],
    hasTestMode: true,
    hasAdvancedAnalytics: true,
    hasAppRewards: true,
    hasSoundToggle: true,
    hasBulkAssignment: true,
    hasPrintReports: true,
    hasVoiceInput: true,
    hasDefinitionEntry: true,
    hasProgressTracking: true,
    hasTaskSearch: true,
  },
};

/**
 * Sub-user limits by tier (backward compatibility)
 */
export const SUB_USER_LIMITS = {
  [SUBSCRIPTION_TIERS.FREE]: 2,
  [SUBSCRIPTION_TIERS.PREMIUM]: 3,
  [SUBSCRIPTION_TIERS.TIER1]: 10,
  [SUBSCRIPTION_TIERS.TIER2]: 50,
};

/**
 * Get tier limits for a subscription tier
 */
export const getTierLimits = (tier) => {
  return TIER_LIMITS[tier] || TIER_LIMITS[SUBSCRIPTION_TIERS.FREE];
};

/**
 * Check if a feature is available for a subscription tier
 */
export const hasFeatureAccess = (tier, feature) => {
  const limits = getTierLimits(tier);
  
  // Map feature to limit property
  const featureMap = {
    [FEATURES.VOICE_INPUT]: 'hasVoiceInput',
    [FEATURES.TEST_MODE]: 'hasTestMode',
    [FEATURES.ADVANCED_ANALYTICS]: 'hasAdvancedAnalytics',
    [FEATURES.APP_REWARDS]: 'hasAppRewards',
    [FEATURES.SOUND_TOGGLE]: 'hasSoundToggle',
    [FEATURES.PRINT_REPORTS]: 'hasPrintReports',
    [FEATURES.BULK_ASSIGNMENT]: 'hasBulkAssignment',
    [FEATURES.DEFINITION_ENTRY]: 'hasDefinitionEntry',
    [FEATURES.PROGRESS_TRACKING]: 'hasProgressTracking',
    [FEATURES.TASK_SEARCH]: 'hasTaskSearch',
  };
  
  const limitKey = featureMap[feature];
  return limitKey ? limits[limitKey] : false;
};

/**
 * Check if an input mode is available for a subscription tier
 */
export const isInputModeAvailable = (tier, inputMode) => {
  const limits = getTierLimits(tier);
  return limits.inputModes.includes(inputMode);
};

/**
 * Check if subscription is expired
 */
export const isSubscriptionActive = (tier, expiresAt) => {
  if (tier === SUBSCRIPTION_TIERS.FREE) {
    return true; // Free tier never expires
  }
  
  if (!expiresAt) {
    return false;
  }
  
  return new Date(expiresAt) > new Date();
};

/**
 * Get required tier for a feature
 */
export const getRequiredTier = (feature) => {
  if (FEATURE_ACCESS[SUBSCRIPTION_TIERS.TIER2].includes(feature) && 
      !FEATURE_ACCESS[SUBSCRIPTION_TIERS.TIER1].includes(feature)) {
    return SUBSCRIPTION_TIERS.TIER2;
  }
  
  if (FEATURE_ACCESS[SUBSCRIPTION_TIERS.TIER1].includes(feature)) {
    return SUBSCRIPTION_TIERS.TIER1;
  }
  
  return null;
};

/**
 * Get upgrade message for a feature
 */
export const getUpgradeMessage = (feature) => {
  const messages = {
    [FEATURES.VOICE_INPUT]: {
      title: '🎤 Voice Input is Premium',
      message: 'Upgrade to Premium to unlock Say-Spell-Say and Spell Only input modes with voice recognition.',
      tier: SUBSCRIPTION_TIERS.PREMIUM,
    },
    [FEATURES.TEST_MODE]: {
      title: '📝 Test Mode is Premium',
      message: 'Upgrade to Premium to enable test mode and track student performance.',
      tier: SUBSCRIPTION_TIERS.PREMIUM,
    },
    [FEATURES.ADVANCED_ANALYTICS]: {
      title: '📊 Advanced Analytics is Premium',
      message: 'Upgrade to Premium to view detailed word-level analytics and progress tracking.',
      tier: SUBSCRIPTION_TIERS.PREMIUM,
    },
    [FEATURES.APP_REWARDS]: {
      title: '🎮 App Rewards is Premium',
      message: 'Upgrade to Premium to unlock fun apps after completing spelling sessions.',
      tier: SUBSCRIPTION_TIERS.PREMIUM,
    },
    [FEATURES.SOUND_TOGGLE]: {
      title: '🔊 Sound Controls is Premium',
      message: 'Upgrade to Premium to control sound effects and audio settings.',
      tier: SUBSCRIPTION_TIERS.PREMIUM,
    },
    [FEATURES.PRINT_REPORTS]: {
      title: '🖨️ Print Reports is Premium',
      message: 'Upgrade to Premium to print session reports and progress summaries.',
      tier: SUBSCRIPTION_TIERS.PREMIUM,
    },
    [FEATURES.DEFINITION_ENTRY]: {
      title: '📖 Definition Practice is Premium',
      message: 'Upgrade to Premium to practice vocabulary definitions.',
      tier: SUBSCRIPTION_TIERS.PREMIUM,
    },
    [FEATURES.PROGRESS_TRACKING]: {
      title: '📈 Progress Tracking is Premium',
      message: 'Upgrade to Premium to view detailed progress and analytics.',
      tier: SUBSCRIPTION_TIERS.PREMIUM,
    },
    [FEATURES.TASK_SEARCH]: {
      title: '🔍 Task Search is Premium',
      message: 'Upgrade to Premium to search tasks by sample words.',
      tier: SUBSCRIPTION_TIERS.PREMIUM,
    },
    [FEATURES.BULK_ASSIGNMENT]: {
      title: '📋 Bulk Assignment is Classroom Only',
      message: 'Upgrade to Classroom Plan to assign tasks to multiple students at once.',
      tier: SUBSCRIPTION_TIERS.TIER2,
    },
  };
  
  return messages[feature] || {
    title: '💎 Premium Feature',
    message: 'This feature requires a premium subscription.',
    tier: SUBSCRIPTION_TIERS.PREMIUM,
  };
};

/**
 * Check if user can add more sub-users
 */
export const canAddSubUser = (tier, currentCount) => {
  const limit = SUB_USER_LIMITS[tier] || SUB_USER_LIMITS[SUBSCRIPTION_TIERS.FREE];
  return currentCount < limit;
};

/**
 * Get sub-user limit message
 */
export const getSubUserLimitMessage = (tier, currentCount) => {
  const limit = SUB_USER_LIMITS[tier] || SUB_USER_LIMITS[SUBSCRIPTION_TIERS.FREE];
  
  if (currentCount >= limit) {
    if (tier === SUBSCRIPTION_TIERS.FREE) {
      return {
        title: 'Sub-User Limit Reached',
        message: `You've reached the limit of ${limit} sub-users on the Free plan. Upgrade to add more students.`,
        canUpgrade: true,
        nextTier: SUBSCRIPTION_TIERS.TIER1,
      };
    } else if (tier === SUBSCRIPTION_TIERS.TIER1) {
      return {
        title: 'Sub-User Limit Reached',
        message: `You've reached the limit of ${limit} sub-users. Upgrade to Classroom Plan for up to 50 students.`,
        canUpgrade: true,
        nextTier: SUBSCRIPTION_TIERS.TIER2,
      };
    } else {
      return {
        title: 'Sub-User Limit Reached',
        message: `You've reached the maximum limit of ${limit} sub-users.`,
        canUpgrade: false,
      };
    }
  }
  
  return null;
};

/**
 * Premium feature wrapper for UI components
 */
export const withPremiumCheck = (tier, expiresAt, feature, onUpgrade) => {
  const hasAccess = hasFeatureAccess(tier, feature);
  const isActive = isSubscriptionActive(tier, expiresAt);
  
  return {
    hasAccess: hasAccess && isActive,
    showUpgrade: !hasAccess || !isActive,
    upgradeMessage: getUpgradeMessage(feature),
    onUpgrade,
  };
};

export default {
  hasFeatureAccess,
  isSubscriptionActive,
  getRequiredTier,
  getUpgradeMessage,
  canAddSubUser,
  getSubUserLimitMessage,
  withPremiumCheck,
  getTierLimits,
  isInputModeAvailable,
  SUBSCRIPTION_TIERS,
  FEATURES,
  INPUT_MODES,
  TIER_LIMITS,
  SUB_USER_LIMITS,
};
