// Screens/Login.tsx
import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
} from 'react-native';
import { useAuth } from '../hooks/useAuth';
import Icon from 'react-native-vector-icons/Ionicons';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loginError, setLoginError] = useState('');
  const navigation = useNavigation<any>();
  const { companyLogin, loading } = useAuth();

  const validate = () => {
    if (!email.trim()) {
      setError('Email is required');
      return false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address');
      return false;
    } else if (!password.trim()) {
      setError('Password is required');
      return false;
    }
    setError('');
    return true;
  };

  const handleLogin = async () => {
    if (!validate()) return;

    setLoginError(''); // Clear previous login errors

    const result = await companyLogin({ email, password });

    if (result.success) {
      // Navigation will be handled automatically by Routes component
      // based on the auth state (isPasswordChanged and permissions)
      console.log('Login successful, navigation will be handled automatically');
    } else {
      // Show user-friendly error message
      setLoginError('Invalid email or password. Please try again.');
    }
  };

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const navigateToForgotPassword = () => {
    navigation.navigate('ForgotPassword');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar backgroundColor="#ffffff" barStyle="dark-content" />

      {/* Header with Logo and App Name */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Image
            source={require('../Assets/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.logoText}>Asset<Text style={styles.logoTextHighlight}>Tracker</Text></Text>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView 
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.container}>
            {/* Welcome Text - Left Aligned */}
            <View style={styles.welcomeContainer}>
              <Text style={styles.welcomeTitle}>Hi!</Text>
              <Text style={styles.welcomeTitle}>Welcome</Text>
              <Text style={styles.welcomeSubtitle}>
                Enter your email below to login
              </Text>
            </View>

            {/* Input Fields with Bottom Border Only */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Email or Phone Number</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  setError('');
                  setLoginError('');
                }}
                placeholder="Enter your email or phone number"
                placeholderTextColor="#999"
                autoCapitalize="none"
                keyboardType="email-address"
                cursorColor="#007AFF"
              />
            </View>

            <View style={styles.inputContainer}>
              <View style={styles.passwordLabelContainer}>
                <Text style={styles.inputLabel}>Password</Text>
                <TouchableOpacity onPress={navigateToForgotPassword}>
                  <Text style={styles.forgotPassword}>Forgot Password?</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.passwordInputContainer}>
                <TextInput
                  style={styles.passwordInput}
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    setError('');
                    setLoginError('');
                  }}
                  placeholder="Enter your password"
                  secureTextEntry={!showPassword}
                  placeholderTextColor="#999"
                  autoCapitalize="none"
                  cursorColor="#007AFF"
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={toggleShowPassword}
                >
                  <Icon
                    name={showPassword ? 'eye' : 'eye-off'}
                    size={20}
                    color="#999"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            {loginError ? <Text style={styles.loginErrorText}>{loginError}</Text> : null}

            <TouchableOpacity
              style={[styles.loginButton, loading && { opacity: 0.5 }]}
              onPress={handleLogin}
              disabled={loading}
            >
              <Text style={styles.loginButtonText}>
                {loading ? 'Logging in...' : 'Login'}
              </Text>
            </TouchableOpacity>

            {/* Demo credentials hint */}
            {/* <View style={styles.demoContainer}>
              <Text style={styles.demoTitle}>Default Password:</Text>
              <Text style={styles.demoText}>Maco@2025</Text>
            </View> */}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 26,
    marginTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0, // Added margin top for header
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 50,
    height: 50,
  },
  logoText: {
    fontSize: 30,
    fontWeight: '700',
    color: '#000',
    fontFamily: 'Inter-Bold', // Added Inter font
  },
  logoTextHighlight: {
    color: '#0FA37F',
  },
  keyboardAvoid: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 30,
    paddingBottom: 20, // Added padding bottom for better spacing
  },
  container: {
    alignItems: 'flex-start',
  },
  welcomeContainer: {
    width: '100%',
    marginBottom: 30,
    alignItems: 'flex-start',
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
    color: '#333',
    textAlign: 'left',
    fontFamily: 'Inter-Bold', // Added Inter font
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'left',
    marginTop: 8,
    fontFamily: 'Inter-Regular', // Added Inter font
  },
  inputContainer: {
    width: '100%',
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: '#333',
    textAlign: 'left',
    fontFamily: 'Inter-Medium', // Added Inter font
  },
  passwordLabelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  forgotPassword: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
    fontFamily: 'Inter-Medium', // Added Inter font
  },
  input: {
    width: '100%',
    height: 48,
    fontSize: 16,
    backgroundColor: 'transparent',
    paddingHorizontal: 0,
    paddingVertical: 12,
    color: '#000',
    borderBottomWidth: 1,
    borderBottomColor: '#E1E1E1',
    borderRadius: 0,
    fontFamily: 'Inter-Regular', // Added Inter font
  },
  passwordInputContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    backgroundColor: 'transparent',
    borderBottomWidth: 1,
    borderBottomColor: '#E1E1E1',
    borderRadius: 0,
  },
  passwordInput: {
    flex: 1,
    height: 48,
    fontSize: 16,
    paddingHorizontal: 0,
    paddingVertical: 12,
    color: '#000',
    paddingRight: 40,
    fontFamily: 'Inter-Regular', // Added Inter font
  },
  eyeIcon: {
    position: 'absolute',
    right: 0,
    padding: 10,
  },
  loginButton: {
    backgroundColor: '#0d8365',
    paddingVertical: 16,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  loginButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 17,
    fontFamily: 'Inter-SemiBold', // Added Inter font
  },
  errorText: {
    color: 'red',
    alignSelf: 'flex-start',
    marginLeft: 0,
    marginBottom: 5,
    fontSize: 12,
    fontFamily: 'Inter-Regular', // Added Inter font
  },
  loginErrorText: {
    color: 'red',
    textAlign: 'center',
    marginBottom: 10,
    fontSize: 14,
    fontWeight: '500',
    backgroundColor: '#ffeeee',
    padding: 10,
    borderRadius: 8,
    width: '100%',
    fontFamily: 'Inter-Medium', // Added Inter font
  },
  demoContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    width: '100%',
  },
  demoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
    fontFamily: 'Inter-Bold', // Added Inter font
  },
  demoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
    fontFamily: 'Inter-Regular', // Added Inter font
  },
});

export default Login;