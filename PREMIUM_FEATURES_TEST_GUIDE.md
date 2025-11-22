# 🧪 Premium Features - App Flow Testing Guide

**Date:** October 7, 2025  
**Purpose:** Test subscription tiers and premium feature gates

---

## 🎯 Test Scenarios

### **Scenario 1: Free Tier - Student Limit**

**Setup:**
```javascript
// In LoginScreen or mock data
user = {
  email: 'test@example.com',
  subscription_tier: 'FREE'
}
```

**Test Steps:**
1. ✅ Login as Free tier user
2. ✅ Navigate to "Manage Students"
3. ✅ Verify header shows "0 / 2 students"
4. ✅ Add first student → Should succeed
5. ✅ Add second student → Should succeed
6. ✅ Verify header shows "2 / 2 students"
7. ✅ Verify yellow warning banner appears
8. ✅ Tap + button to add 3rd student
9. ✅ Premium gate modal should appear:
   - Title: "🔒 Student Limit Reached"
   - Message: "You've reached the limit of 2 students..."
   - Shows "Free" → "Premium" upgrade path
10. ✅ Tap "Upgrade Now" → Should navigate to Upgrade screen
11. ✅ Tap "Maybe Later" → Modal closes

**Expected Result:** ✅ Cannot add more than 2 students on Free tier

---

### **Scenario 2: Free Tier - Test Mode Locked**

**Setup:**
```javascript
user.subscription_tier = 'FREE'
```

**Test Steps:**
1. ✅ Navigate to "Assign Tasks"
2. ✅ Select a student
3. ✅ Select a word list
4. ✅ Proceed to "Task Options"
5. ✅ Verify "Task Type" section shows "💎 Premium" badge
6. ✅ Verify "Test" button shows 🔒 icon
7. ✅ Tap "Test" button
8. ✅ Premium gate modal should appear:
   - Title: "📝 Test Mode is Premium"
   - Message: "Upgrade to Premium to enable test mode..."
9. ✅ Tap "Upgrade Now" → Navigate to Upgrade screen
10. ✅ Go back and verify "Practice" mode still works

**Expected Result:** ✅ Test mode locked, shows premium gate

---

### **Scenario 3: Free Tier - Voice Input Locked**

**Setup:**
```javascript
user.subscription_tier = 'FREE'
```

**Test Steps:**
1. ✅ Navigate to "Assign Tasks" → Options screen
2. ✅ Verify "Input Mode" section shows "💎 Premium" badge
3. ✅ Verify "Type Only (Free)" is available and selected
4. ✅ Verify "Spell Only" shows 🔒 icon and is disabled
5. ✅ Verify "Say-Spell-Say" shows 🔒 icon and is disabled
6. ✅ Tap "Spell Only"
7. ✅ Premium gate modal should appear:
   - Title: "🎤 Voice Input is Premium"
   - Message: "Upgrade to Premium to unlock Say-Spell-Say and Spell Only..."
8. ✅ Tap "Say-Spell-Say"
9. ✅ Same premium gate should appear
10. ✅ Verify "Type Only" can still be selected

**Expected Result:** ✅ Voice input modes locked for Free tier

---

### **Scenario 4: Free Tier - Sound Toggle Hidden**

**Setup:**
```javascript
user.subscription_tier = 'FREE'
```

**Test Steps:**
1. ✅ Navigate to "Assign Tasks" → Options screen
2. ✅ Scroll through all options
3. ✅ Verify "Sound Effects" section is NOT visible
4. ✅ Only see: Task Type, Input Mode, Schedule sections

**Expected Result:** ✅ Sound toggle not visible for Free tier

---

### **Scenario 5: Free Tier - Dashboard Upgrade Button**

**Setup:**
```javascript
user.subscription_tier = 'FREE'
```

**Test Steps:**
1. ✅ View Parent Dashboard
2. ✅ Verify header shows "💎 Upgrade" button in top right
3. ✅ Verify tier badge shows "Free Plan"
4. ✅ Tap "💎 Upgrade" button
5. ✅ Should navigate to Upgrade screen
6. ✅ Verify 3 tier cards displayed:
   - Premium ($2.99/month)
   - Premium Plus ($4.99/month) with "⭐ MOST POPULAR"
   - Classroom ($29.99/month)
7. ✅ Verify Premium is pre-selected
8. ✅ Tap different tiers to select
9. ✅ Tap "Subscribe to [Tier]"
10. ✅ Should show "Coming Soon" alert

**Expected Result:** ✅ Upgrade flow works, shows all tiers

---

### **Scenario 6: Premium Tier - All Features Unlocked**

**Setup:**
```javascript
user.subscription_tier = 'PREMIUM'
```

**Test Steps:**
1. ✅ Login as Premium user
2. ✅ Verify dashboard shows "Premium Plan" badge
3. ✅ Verify NO upgrade button in dashboard
4. ✅ Navigate to "Manage Students"
5. ✅ Verify header shows "0 / 3 students"
6. ✅ Add 3 students → All should succeed
7. ✅ Navigate to "Assign Tasks" → Options
8. ✅ Verify "Test" mode has NO 🔒 icon
9. ✅ Verify NO "💎 Premium" badge on Task Type
10. ✅ Tap "Test" → Should work without premium gate
11. ✅ Verify all 3 input modes available:
    - Type Only ✅
    - Spell Only ✅ (no lock)
    - Say-Spell-Say ✅ (no lock)
12. ✅ Tap "Spell Only" → Should select without premium gate
13. ✅ Verify "Sound Effects" section IS visible
14. ✅ Toggle sound on/off → Should work

**Expected Result:** ✅ All premium features unlocked

---

### **Scenario 7: Premium Plus (TIER1) - 10 Students**

**Setup:**
```javascript
user.subscription_tier = 'TIER1'
```

**Test Steps:**
1. ✅ Login as Premium Plus user
2. ✅ Verify dashboard shows "Premium Plus Plan" badge
3. ✅ Navigate to "Manage Students"
4. ✅ Verify header shows "0 / 10 students"
5. ✅ Add 10 students → All should succeed
6. ✅ Try to add 11th student → Premium gate should appear
7. ✅ Verify all premium features available (same as Premium)

**Expected Result:** ✅ Can add up to 10 students

---

### **Scenario 8: Classroom (TIER2) - 50 Students**

**Setup:**
```javascript
user.subscription_tier = 'TIER2'
```

**Test Steps:**
1. ✅ Login as Classroom user
2. ✅ Verify dashboard shows "Classroom Plan" badge
3. ✅ Navigate to "Manage Students"
4. ✅ Verify header shows "0 / 50 students"
5. ✅ Verify all premium features available
6. ✅ Bulk assignment should be available (if implemented)

**Expected Result:** ✅ Can add up to 50 students

---

### **Scenario 9: Upgrade Screen Navigation**

**Test Steps:**
1. ✅ From any premium gate modal, tap "Upgrade Now"
2. ✅ Should navigate to Upgrade screen
3. ✅ Verify current tier is passed correctly
4. ✅ Verify tier cards display properly
5. ✅ Select different tiers
6. ✅ Tap "Subscribe to [Tier]"
7. ✅ Verify alert shows "Coming Soon" message
8. ✅ Tap "Restore Purchases"
9. ✅ Verify restore confirmation dialog

**Expected Result:** ✅ Upgrade screen fully functional

---

### **Scenario 10: Premium Gate Modal UI**

**Test Steps:**
1. ✅ Trigger any premium gate (test mode, voice input, student limit)
2. ✅ Verify modal appearance:
   - Semi-transparent overlay
   - White modal card
   - Crown icon (👑) in yellow circle
   - Feature title with emoji
   - Clear message
   - Current tier display
   - Required tier display
   - Two buttons: "Maybe Later" and "Upgrade Now"
3. ✅ Tap outside modal → Should NOT close
4. ✅ Tap "Maybe Later" → Modal closes
5. ✅ Tap "Upgrade Now" → Navigates to Upgrade screen

**Expected Result:** ✅ Professional, consistent premium gate UI

---

## 🔄 Cross-Screen Flow Tests

### **Flow 1: Free User Journey**
```
Login (FREE) 
  → Dashboard (shows upgrade button)
  → Manage Students
  → Add 2 students ✅
  → Try add 3rd → Premium Gate
  → Upgrade Screen
  → Back to Dashboard
  → Assign Tasks
  → Try Test Mode → Premium Gate
  → Try Voice Input → Premium Gate
```

### **Flow 2: Premium User Journey**
```
Login (PREMIUM)
  → Dashboard (no upgrade button)
  → Manage Students
  → Add 3 students ✅
  → Assign Tasks
  → Select Test Mode ✅
  → Select Voice Input ✅
  → Toggle Sound ✅
  → Assign Task ✅
```

---

## 🐛 Edge Cases to Test

### **Edge Case 1: Tier Change Mid-Session**
**Scenario:** User upgrades while app is open
- Current behavior: Tier cached on login
- TODO: Implement subscription status refresh

### **Edge Case 2: Expired Subscription**
**Scenario:** Premium subscription expires
- TODO: Check `subscription_expires_at` timestamp
- TODO: Downgrade features if expired

### **Edge Case 3: Invalid Tier**
**Scenario:** Database has invalid tier value
- Current: Defaults to FREE
- Verify fallback works correctly

### **Edge Case 4: Network Failure**
**Scenario:** Cannot load subscription status
- Current: Uses cached tier from login
- Verify graceful degradation

---

## 📱 Manual Testing Checklist

### **Visual Testing:**
- [ ] Premium badges (💎) display correctly
- [ ] Lock icons (🔒) on disabled features
- [ ] Warning banners styled properly
- [ ] Tier cards in Upgrade screen look good
- [ ] Modal overlays work on all screen sizes
- [ ] Colors match design (amber/gold for premium)

### **Interaction Testing:**
- [ ] Tapping locked features shows premium gate
- [ ] Premium gate buttons work
- [ ] Navigation flows correctly
- [ ] Back button works from Upgrade screen
- [ ] Modal dismisses properly

### **Data Testing:**
- [ ] Correct tier limits enforced
- [ ] Student count accurate
- [ ] Tier name displays correctly
- [ ] Feature flags work per tier

---

## 🧪 Automated Test Ideas

### **Unit Tests:**
```javascript
// Test tier limits
describe('getTierLimits', () => {
  it('should return correct limits for FREE tier', () => {
    const limits = getTierLimits('FREE');
    expect(limits.maxStudents).toBe(2);
    expect(limits.hasTestMode).toBe(false);
  });
  
  it('should return correct limits for PREMIUM tier', () => {
    const limits = getTierLimits('PREMIUM');
    expect(limits.maxStudents).toBe(3);
    expect(limits.hasTestMode).toBe(true);
  });
});

// Test input mode availability
describe('isInputModeAvailable', () => {
  it('should allow type-only for FREE tier', () => {
    expect(isInputModeAvailable('FREE', 'type-only')).toBe(true);
  });
  
  it('should block voice modes for FREE tier', () => {
    expect(isInputModeAvailable('FREE', 'say-spell-say')).toBe(false);
    expect(isInputModeAvailable('FREE', 'spell-only')).toBe(false);
  });
  
  it('should allow all modes for PREMIUM tier', () => {
    expect(isInputModeAvailable('PREMIUM', 'type-only')).toBe(true);
    expect(isInputModeAvailable('PREMIUM', 'say-spell-say')).toBe(true);
    expect(isInputModeAvailable('PREMIUM', 'spell-only')).toBe(true);
  });
});

// Test student limits
describe('canAddSubUser', () => {
  it('should allow adding students under limit', () => {
    expect(canAddSubUser('FREE', 1)).toBe(true);
  });
  
  it('should block adding students at limit', () => {
    expect(canAddSubUser('FREE', 2)).toBe(false);
  });
});
```

---

## 🎬 Demo Script

### **For Stakeholder Demo:**

**"Let me show you our new premium features..."**

1. **Start as Free User:**
   - "Here's a free tier user. Notice the 'Free Plan' badge and Upgrade button."
   - "They can add up to 2 students. Let me add two..."
   - "Now watch what happens when I try to add a third..."
   - *Premium gate appears*
   - "Beautiful upgrade prompt with clear messaging!"

2. **Show Premium Gates:**
   - "Let's try to use Test Mode..."
   - *Premium gate appears*
   - "And voice input modes..."
   - *Premium gate appears*
   - "Notice the consistent, professional UI."

3. **Show Upgrade Screen:**
   - "When they tap Upgrade, they see this beautiful tier comparison."
   - "Premium is $2.99, Premium Plus for larger families, Classroom for teachers."
   - "Clear pricing, feature lists, and the most popular tier is highlighted."

4. **Switch to Premium User:**
   - "Now let's see a Premium user..."
   - "Notice: no upgrade button, shows 'Premium Plan'"
   - "They can add 3 students, use all input modes, test mode, everything!"

5. **Highlight Features:**
   - "Sound toggle only appears for premium users."
   - "All voice input modes unlocked."
   - "Professional, seamless experience."

---

## 📊 Test Results Template

```markdown
## Test Session: [Date]
**Tester:** [Name]
**Device:** [iOS/Android version]
**Build:** [Version]

### Scenario Results:
- [ ] Scenario 1: Free Tier Student Limit - PASS/FAIL
- [ ] Scenario 2: Test Mode Locked - PASS/FAIL
- [ ] Scenario 3: Voice Input Locked - PASS/FAIL
- [ ] Scenario 4: Sound Toggle Hidden - PASS/FAIL
- [ ] Scenario 5: Upgrade Button - PASS/FAIL
- [ ] Scenario 6: Premium Unlocked - PASS/FAIL
- [ ] Scenario 7: Premium Plus - PASS/FAIL
- [ ] Scenario 8: Classroom - PASS/FAIL
- [ ] Scenario 9: Upgrade Navigation - PASS/FAIL
- [ ] Scenario 10: Premium Gate UI - PASS/FAIL

### Issues Found:
1. [Issue description]
2. [Issue description]

### Notes:
[Additional observations]
```

---

## 🚀 Quick Test Commands

### **Change User Tier (for testing):**
```javascript
// In ParentDashboardScreen or LoginScreen
// Temporarily hardcode different tiers:

// Test FREE
const user = { ...user, subscription_tier: 'FREE' };

// Test PREMIUM
const user = { ...user, subscription_tier: 'PREMIUM' };

// Test TIER1 (Premium Plus)
const user = { ...user, subscription_tier: 'TIER1' };

// Test TIER2 (Classroom)
const user = { ...user, subscription_tier: 'TIER2' };
```

### **Reset Test Data:**
```javascript
// Clear all students
// Delete all tasks
// Start fresh for each test scenario
```

---

## ✅ Success Criteria

**Premium features are working correctly if:**

1. ✅ Free users see upgrade prompts for locked features
2. ✅ Student limits enforced per tier
3. ✅ Input modes restricted correctly
4. ✅ Test mode locked for Free tier
5. ✅ Sound toggle only visible for Premium+
6. ✅ Premium gate modals appear consistently
7. ✅ Upgrade screen displays all tiers
8. ✅ Navigation flows work smoothly
9. ✅ UI is professional and polished
10. ✅ No crashes or errors

---

## 🎯 Next Steps After Testing

1. **Fix any bugs found**
2. **Integrate real IAP** (react-native-iap)
3. **Add backend receipt validation**
4. **Test on real devices** (iOS + Android)
5. **Submit to App Store** for review

---

**Happy Testing! 🧪**
