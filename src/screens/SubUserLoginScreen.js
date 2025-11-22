import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { authAPI, setAuthToken, setCurrentUser } from '../services/api';

const SubUserLoginScreen = ({ navigation, route }) => {
  const [parentEmail, setParentEmail] = useState('');
  const [subUsers, setSubUsers] = useState([]);
  const [selectedSubUser, setSelectedSubUser] = useState(null);
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('email'); // 'email' | 'select' | 'pin'

  const loadSubUsers = async () => {
    if (!parentEmail) {
      Alert.alert('Error', 'Please enter parent email');
      return;
    }

    setLoading(true);
    try {
      const response = await authAPI.getSubUserList(parentEmail);
      const { subUsers: users } = response.data;

      if (users.length === 0) {
        Alert.alert('No Students', 'No student accounts found for this email');
        return;
      }

      setSubUsers(users);
      setStep('select');
    } catch (error) {
      Alert.alert('Error', 'Failed to load student accounts');
    } finally {
      setLoading(false);
    }
  };

  const handleSubUserSelect = (subUser) => {
    setSelectedSubUser(subUser);
    setStep('pin');
  };

  const handlePinSubmit = async () => {
    if (pin.length !== 4) {
      Alert.alert('Error', 'PIN must be 4 digits');
      return;
    }

    setLoading(true);
    try {
      const response = await authAPI.subUserLogin(selectedSubUser.id, pin);
      const { sessionToken, subUser } = response.data;

      // Save session token and user data for persistence
      await setAuthToken(sessionToken);
      await setCurrentUser({ ...subUser, type: 'sub_user' });

      // Navigate to sub-user practice view
      navigation.replace('SubUserDashboard', { subUser });
    } catch (error) {
      Alert.alert('Error', 'Invalid PIN');
      setPin('');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (step === 'pin') {
      setStep('select');
      setSelectedSubUser(null);
      setPin('');
    } else if (step === 'select') {
      setStep('email');
      setSubUsers([]);
    } else {
      navigation.goBack();
    }
  };

  const renderSubUserItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.subUserCard, { borderColor: item.avatarColor }]}
      onPress={() => handleSubUserSelect(item)}
    >
      <View style={[styles.avatar, { backgroundColor: item.avatarColor }]}>
        <Text style={styles.avatarText}>
          {item.name.charAt(0).toUpperCase()}
        </Text>
      </View>
      <Text style={styles.subUserName} numberOfLines={2} ellipsizeMode="tail">
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Student Login</Text>
      </View>

      {step === 'email' && (
        <View style={styles.content}>
          <Text style={styles.instruction}>
            Enter your parent/teacher email address
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Parent Email"
            value={parentEmail}
            onChangeText={setParentEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            editable={!loading}
          />
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={loadSubUsers}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Continue</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {step === 'select' && (
        <View style={styles.content}>
          <Text style={styles.instruction}>Select your name</Text>
          <FlatList
            data={subUsers}
            renderItem={renderSubUserItem}
            keyExtractor={(item) => item.id}
            numColumns={2}
            contentContainerStyle={styles.grid}
          />
        </View>
      )}

      {step === 'pin' && selectedSubUser && (
        <View style={styles.content}>
          <View style={[styles.avatar, { backgroundColor: selectedSubUser.avatarColor }]}>
            <Text style={styles.avatarText}>
              {selectedSubUser.name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.selectedName}>{selectedSubUser.name}</Text>
          <Text style={styles.instruction}>Enter your 4-digit PIN</Text>
          <TextInput
            style={styles.pinInput}
            value={pin}
            onChangeText={setPin}
            keyboardType="number-pad"
            maxLength={4}
            secureTextEntry
            editable={!loading}
            autoFocus
          />
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handlePinSubmit}
            disabled={loading || pin.length !== 4}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Login</Text>
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
  header: {
    backgroundColor: '#fff',
    padding: 16,
    paddingTop: 48,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    marginBottom: 8,
  },
  backText: {
    color: '#3b82f6',
    fontSize: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  content: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
  },
  instruction: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 24,
    textAlign: 'center',
  },
  input: {
    width: '100%',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
  },
  button: {
    width: '100%',
    backgroundColor: '#10b981',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#6ee7b7',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  grid: {
    width: '100%',
    paddingHorizontal: 8,
  },
  subUserCard: {
    width: '45%',
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 3,
    padding: 20,
    margin: 8,
    alignItems: 'center',
    minHeight: 180,
    justifyContent: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: {
    color: '#fff',
    fontSize: 36,
    fontWeight: 'bold',
  },
  subUserName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    textAlign: 'center',
    width: '100%',
    numberOfLines: 2,
  },
  selectedName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 16,
    marginBottom: 32,
  },
  pinInput: {
    width: 200,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#3b82f6',
    borderRadius: 8,
    padding: 20,
    fontSize: 32,
    textAlign: 'center',
    letterSpacing: 16,
    marginBottom: 24,
  },
});

export default SubUserLoginScreen;
