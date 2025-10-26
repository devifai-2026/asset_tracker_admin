// Screens/ChangePassword.tsx
import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StatusBar,
} from 'react-native';
import { useAuth } from '../hooks/useAuth';
import Icon from 'react-native-vector-icons/Ionicons';
import { useSelector } from 'react-redux';
import { RootState } from '../Redux/store'; 

const ChangePassword = () => {
    const [oldPassword, setOldPassword] = useState('Maco@2025');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showOldPassword, setShowOldPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    const { changePassword, loading } = useAuth();
    const { email } = useSelector((state: RootState) => state.auth);

    const validate = () => {
        const newErrors: { [key: string]: string } = {};

        if (!oldPassword.trim()) {
            newErrors.oldPassword = 'Current password is required';
        }

        if (!newPassword.trim()) {
            newErrors.newPassword = 'New password is required';
        } else if (newPassword.length < 6) {
            newErrors.newPassword = 'Password must be at least 6 characters';
        }

        if (newPassword !== confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChangePassword = async () => {
        if (!validate()) return;

        const result = await changePassword({
            email: email || '',
            old_password: oldPassword,
            new_password: newPassword,
        });

        if (result.success) {
            // Navigation will be handled automatically by Routes component
            // based on the updated auth state (isPasswordChanged and permissions)
            console.log('Password changed successfully, navigation will be handled automatically');
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar backgroundColor="#ffffff" barStyle="dark-content" />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.scroll}>
                    <View style={styles.container}>
                        <Text style={styles.title}>Change Password</Text>
                        <Text style={styles.subtitle}>
                            Please change your default password to continue
                        </Text>

                        {/* Current Password Input */}
                        <View style={styles.passwordContainer}>
                            <TextInput
                                placeholder="Current Password"
                                style={[styles.passwordInput, errors.oldPassword && styles.inputError]}
                                value={oldPassword}
                                onChangeText={setOldPassword}
                                secureTextEntry={!showOldPassword}
                                placeholderTextColor="#999"
                            />
                            <TouchableOpacity
                                style={styles.eyeIcon}
                                onPress={() => setShowOldPassword(!showOldPassword)}
                            >
                                <Icon
                                    name={showOldPassword ? 'eye' : 'eye-off'}
                                    size={20}
                                    color="#999"
                                />
                            </TouchableOpacity>
                        </View>
                        {errors.oldPassword && <Text style={styles.errorText}>{errors.oldPassword}</Text>}

                        {/* New Password Input */}
                        <View style={styles.passwordContainer}>
                            <TextInput
                                placeholder="New Password"
                                style={[styles.passwordInput, errors.newPassword && styles.inputError]}
                                value={newPassword}
                                onChangeText={setNewPassword}
                                secureTextEntry={!showNewPassword}
                                placeholderTextColor="#999"
                            />
                            <TouchableOpacity
                                style={styles.eyeIcon}
                                onPress={() => setShowNewPassword(!showNewPassword)}
                            >
                                <Icon
                                    name={showNewPassword ? 'eye' : 'eye-off'}
                                    size={20}
                                    color="#999"
                                />
                            </TouchableOpacity>
                        </View>
                        {errors.newPassword && <Text style={styles.errorText}>{errors.newPassword}</Text>}

                        {/* Confirm Password Input */}
                        <View style={styles.passwordContainer}>
                            <TextInput
                                placeholder="Confirm New Password"
                                style={[styles.passwordInput, errors.confirmPassword && styles.inputError]}
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                secureTextEntry={!showConfirmPassword}
                                placeholderTextColor="#999"
                            />
                            <TouchableOpacity
                                style={styles.eyeIcon}
                                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                            >
                                <Icon
                                    name={showConfirmPassword ? 'eye' : 'eye-off'}
                                    size={20}
                                    color="#999"
                                />
                            </TouchableOpacity>
                        </View>
                        {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}

                        <TouchableOpacity
                            style={[styles.button, loading && { opacity: 0.5 }]}
                            onPress={handleChangePassword}
                            disabled={loading}
                        >
                            <Text style={styles.buttonText}>
                                {loading ? 'Changing Password...' : 'Change Password'}
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
    scroll: {
        flexGrow: 1,
        justifyContent: 'center',
        paddingHorizontal: 30,
    },
    container: {
        alignItems: 'center',
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        marginBottom: 10,
        color: '#000',
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        marginBottom: 30,
        textAlign: 'center',
    },
    passwordContainer: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
        position: 'relative',
    },
    passwordInput: {
        flex: 1,
        height: 52,
        fontSize: 16,
        backgroundColor: '#F1F1F1',
        borderRadius: 25,
        paddingHorizontal: 20,
        color: '#000',
        paddingRight: 50,
    },
    inputError: {
        borderColor: 'red',
        borderWidth: 1,
    },
    eyeIcon: {
        position: 'absolute',
        right: 15,
        padding: 10,
    },
    button: {
        backgroundColor: '#007AFF',
        paddingVertical: 14,
        borderRadius: 25,
        width: '100%',
        alignItems: 'center',
        marginTop: 20,
    },
    buttonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 17,
    },
    errorText: {
        color: 'red',
        alignSelf: 'flex-start',
        marginLeft: 15,
        marginBottom: 15,
        fontSize: 12,
    },
});

export default ChangePassword;