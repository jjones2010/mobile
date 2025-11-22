import React, { useEffect, useState, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import LoginScreen from './screens/LoginScreen';
import ParentDashboardScreen from './screens/ParentDashboardScreen';
import StudentManagementScreen from './screens/StudentManagementScreen';
import ContentManagementScreen from './screens/ContentManagementScreen';
import WordManagementScreen from './screens/WordManagementScreen';
import TaskAssignmentScreen from './screens/TaskAssignmentScreen';
import ManageAssignmentsScreen from './screens/ManageAssignmentsScreen';
import ProgressReportsScreen from './screens/ProgressReportsScreen';
import SubUserLoginScreen from './screens/SubUserLoginScreen';
import SubUserDashboardScreen from './screens/SubUserDashboardScreen';
import EnhancedPracticeScreen from './screens/EnhancedPracticeScreen';
import SessionResultsScreen from './screens/SessionResultsScreen';
import UpgradeScreen from './screens/UpgradeScreen';
import VoiceSettingsScreen from './screens/VoiceSettingsScreen';
import { setNavigationRef, getCurrentUser, getAuthToken, isTokenExpired } from './services/api';

const Stack = createStackNavigator();

export default function App() {
  const navigationRef = useRef();
  const [isLoading, setIsLoading] = useState(true);
  const [initialRoute, setInitialRoute] = useState('Login');
  const [initialParams, setInitialParams] = useState(null);

  useEffect(() => {
    // Set navigation reference for API interceptors
    if (navigationRef.current) {
      setNavigationRef(navigationRef.current);
    }

    // Check for existing auth session
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      const token = await getAuthToken();
      const user = await getCurrentUser();
      
      if (token && user) {
        // Check if token is expired
        const expired = await isTokenExpired();
        
        if (!expired) {
          // Check if this is a sub-user or parent session
          if (user.type === 'sub_user') {
            // Restore sub-user session
            setInitialRoute('SubUserDashboard');
            setInitialParams({ subUser: user });
          } else {
            // Restore parent session
            setInitialRoute('ParentDashboard');
            setInitialParams({ user });
          }
        }
      }
    } catch (error) {
      console.log('Auth state check error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator
        initialRouteName={initialRoute}
        screenOptions={{
          headerStyle: {
            backgroundColor: '#4F46E5',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen 
          name="Login" 
          component={LoginScreen}
          options={{ title: 'Spelling Practice', headerShown: false }}
        />
        <Stack.Screen 
          name="ParentDashboard" 
          component={ParentDashboardScreen}
          initialParams={initialRoute === 'ParentDashboard' ? initialParams : undefined}
          options={{ title: 'Teacher Dashboard', headerShown: false }}
        />
        <Stack.Screen 
          name="StudentManagement" 
          component={StudentManagementScreen}
          options={{ title: 'Manage Students' }}
        />
        <Stack.Screen 
          name="ContentManagement" 
          component={ContentManagementScreen}
          options={{ title: 'Word Lists' }}
        />
        <Stack.Screen 
          name="WordManagement" 
          component={WordManagementScreen}
          options={{ title: 'Manage Words' }}
        />
        <Stack.Screen 
          name="TaskAssignment" 
          component={TaskAssignmentScreen}
          options={{ title: 'Assign Tasks' }}
        />
        <Stack.Screen 
          name="ManageAssignments" 
          component={ManageAssignmentsScreen}
          options={{ title: 'Manage Assignments' }}
        />
        <Stack.Screen 
          name="ProgressReports" 
          component={ProgressReportsScreen}
          options={{ title: 'Progress Reports' }}
        />
        <Stack.Screen 
          name="SubUserLogin" 
          component={SubUserLoginScreen}
          options={{ title: 'Student Login', headerShown: false }}
        />
        <Stack.Screen 
          name="SubUserDashboard" 
          component={SubUserDashboardScreen}
          initialParams={initialRoute === 'SubUserDashboard' ? initialParams : undefined}
          options={{ title: 'My Tasks' }}
        />
        <Stack.Screen 
          name="Practice" 
          component={EnhancedPracticeScreen}
          options={{ title: 'Practice Session' }}
        />
        <Stack.Screen 
          name="SessionResults" 
          component={SessionResultsScreen}
          options={{ title: 'Session Complete', headerShown: false }}
        />
        <Stack.Screen 
          name="Upgrade" 
          component={UpgradeScreen}
          options={{ title: 'Upgrade to Premium' }}
        />
        <Stack.Screen 
          name="VoiceSettings" 
          component={VoiceSettingsScreen}
          options={{ title: 'Voice Settings' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
});
