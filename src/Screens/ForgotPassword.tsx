// Screens/ForgotPassword.tsx
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
    Alert,
    ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { baseClient } from '../services/api.clients';
import { APIEndpoints } from '../services/api.endpoints';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const navigation = useNavigation<any>();

    const validateEmail = () => {
        if (!email.trim()) {
            setError('Email is required');
            return false;
        } else if (!/\S+@\S+\.\S+/.test(email)) {
            setError('Please enter a valid email address');
            return false;
        }
        setError('');
        return true;
    };

    const handleResetPassword = async () => {
        if (!validateEmail()) return;

        setIsLoading(true);

        try {
            const payload = {
                email: email.trim()
            };

            // Call the forgot password API
            const response = await baseClient.post(APIEndpoints.forgotPasword, payload);

            if (response.data && response.data.types === 'successfull') {
                setIsSubmitted(true);
                Alert.alert(
                    'Success',
                    response.data.msg || 'Password reset instructions sent to your email.',
                    [{ text: 'OK', onPress: () => navigation.goBack() }]
                );
            } else {
                throw new Error(response.data?.msg || 'Failed to send reset instructions');
            }
        } catch (error: any) {
            console.error('Forgot password error:', error);

            let errorMessage = 'Failed to send reset instructions. Please try again.';

            if (error.response?.data?.msg) {
                errorMessage = error.response.data.msg;
            } else if (error.message) {
                errorMessage = error.message;
            }

            Alert.alert('Error', errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar backgroundColor="#ffffff" barStyle="dark-content" />

            {/* Header with Logo and App Name */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Icon name="arrow-back" size={24} color="#000" />
                </TouchableOpacity>
                <View style={styles.logoContainer}>
                    <Image
                        source={require('../Assets/logo.png')}
                        style={styles.logo}
                        resizeMode="contain"
                    />
                    <Text style={styles.logoText}>Asset<Text style={styles.logoTextHighlight}>Tracker</Text></Text>
                </View>
                <View style={{ width: 24 }} /> {/* Spacer for balance */}
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
                        {/* Instruction Text - Left Aligned */}
                        <View style={styles.textContainer}>
                            <Text style={styles.heading}>Forgot Password?</Text>
                            <Text style={styles.subheading}>
                                Enter your email address and we'll send you instructions to reset your password.
                            </Text>
                        </View>

                        {/* Email Input Field with Bottom Border */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Email Address</Text>
                            <TextInput
                                style={styles.input}
                                value={email}
                                onChangeText={(text) => {
                                    setEmail(text);
                                    setError('');
                                }}
                                placeholder="Enter your email address"
                                placeholderTextColor="#999"
                                autoCapitalize="none"
                                keyboardType="email-address"
                                cursorColor="#007AFF"
                                editable={!isLoading && !isSubmitted}
                            />
                        </View>

                        {error ? <Text style={styles.errorText}>{error}</Text> : null}

                        {/* Submit Button */}
                        <TouchableOpacity
                            style={[styles.submitButton, (isLoading || isSubmitted) && { opacity: 0.7 }]}
                            onPress={handleResetPassword}
                            disabled={isLoading || isSubmitted}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.submitButtonText}>
                                    {isSubmitted ? 'Email Sent' : 'Forgot Password'}
                                </Text>
                            )}
                        </TouchableOpacity>

                        {/* Back to Login Link */}
                        <TouchableOpacity
                            style={styles.backToLoginContainer}
                            onPress={() => navigation.navigate('Login')}
                            disabled={isLoading}
                        >
                            <Text style={styles.backToLoginText}>
                                Back to Login
                            </Text>
                        </TouchableOpacity>
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
    backButton: {
        padding: 4,
    },
    logoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    logo: {
        width: 30,
        height: 30,
        marginRight: 10,
    },
    logoText: {
        fontSize: 20,
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
    textContainer: {
        width: '100%',
        marginBottom: 30,
        alignItems: 'flex-start',
    },
    heading: {
        fontSize: 28,
        fontWeight: '700',
        marginBottom: 16,
        color: '#333',
        textAlign: 'left',
        fontFamily: 'Inter-Bold', // Added Inter font
    },
    subheading: {
        fontSize: 16,
        color: '#666',
        textAlign: 'left',
        lineHeight: 22,
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
    submitButton: {
        backgroundColor: '#0d8365',
        paddingVertical: 16,
        borderRadius: 12,
        width: '100%',
        alignItems: 'center',
        marginTop: 10,
        marginBottom: 20,
    },
    submitButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 17,
        fontFamily: 'Inter-SemiBold', // Added Inter font
    },
    errorText: {
        color: 'red',
        alignSelf: 'flex-start',
        marginLeft: 0,
        marginBottom: 15,
        fontSize: 14,
        fontFamily: 'Inter-Regular', // Added Inter font
    },
    backToLoginContainer: {
        marginTop: 10,
        alignSelf: 'center',
    },
    backToLoginText: {
        fontSize: 16,
        color: '#007AFF',
        fontWeight: '500',
        fontFamily: 'Inter-Medium', // Added Inter font
    },
});

export default ForgotPassword;