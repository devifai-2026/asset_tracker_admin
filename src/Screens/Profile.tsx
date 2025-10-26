import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    SafeAreaView,
    StatusBar,
    Modal,
    Animated,
    Dimensions,
    Alert,
    Image, // Added Image import
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { CommonActions, useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { logout, setCurrentRole } from '../Redux/Slices/authSlice';
import { RootState } from '@reduxjs/toolkit/query';
import { useAuth } from '../hooks/useAuth';

const { height } = Dimensions.get('window');

const Profile = () => {
    const navigation = useNavigation();
    const dispatch = useDispatch();
    const { changePassword } = useAuth();
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isPasswordModalVisible, setIsPasswordModalVisible] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [slideAnim] = useState(new Animated.Value(height));
    const { isPasswordChanged, permissions, email, currentRole } = useSelector((state: RootState) => state.auth);

    console.log("User Permissions:", permissions);
    console.log("User Email:", email);

    const getUserRole = () => {
        if (permissions?.includes('SERVICE.ALL')) {
            return 'Service Engineer';
        }
        if (permissions?.includes('MAINT.ALL')) {
            return 'Service Head';
        }
        if (permissions?.includes('ADMIN.ALL')) {
            return 'Admin';
        }
        return 'User';
    };

    const hasMultipleRoles = permissions?.includes('MAINT.ALL') &&
        permissions?.includes('ASSETS.VIEW') &&
        permissions?.includes('SERVICE.ALL');

    const handleRoleSwitch = async (newRole: string) => {
        try {
            dispatch(setCurrentRole(newRole));

            await new Promise(resolve => setTimeout(resolve, 100));

            const rootNavigation = navigation.getParent() || navigation;

            rootNavigation.dispatch(
                CommonActions.navigate({
                    name: newRole === 'Service Engineer' ? 'MainTabs' : 'HeadMainTabs',
                })
            );

        } catch (error) {
            console.log('Role switch error:', error);
        }
    };

    const showPasswordModal = () => {
        setIsPasswordModalVisible(true);
        Animated.timing(slideAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
        }).start();
    };

    const hidePasswordModal = () => {
        Animated.timing(slideAnim, {
            toValue: height,
            duration: 300,
            useNativeDriver: true,
        }).start(() => {
            setIsPasswordModalVisible(false);
            setNewPassword('');
            setConfirmPassword('');
            setShowNewPassword(false);
            setShowConfirmPassword(false);
        });
    };

    const handleSavePassword = async () => {
        if (!newPassword || !confirmPassword) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        if (newPassword !== confirmPassword) {
            Alert.alert('Error', 'New password and confirm password do not match');
            return;
        }

        if (newPassword.length < 6) {
            Alert.alert('Error', 'Password must be at least 6 characters long');
            return;
        }

        try {
            const payload = {
                email: email || '',
                password: newPassword
            };

            const result = await changePassword(payload);

            if (result.success) {
                hidePasswordModal();
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to change password. Please try again.');
        }
    };

    const handleLogout = () => {
        Alert.alert(
            'Logout',
            'Are you sure you want to logout?',
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
                {
                    text: 'Logout',
                    style: 'destructive',
                    onPress: () => {
                        dispatch(logout());
                    },
                },
            ],
            { cancelable: true }
        );
    };

    const toggleShowNewPassword = () => setShowNewPassword(!showNewPassword);
    const toggleShowConfirmPassword = () => setShowConfirmPassword(!showConfirmPassword);

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar backgroundColor="#ffffff" barStyle="dark-content" />

            {/* Header with Back Button and Logo */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Icon name="arrow-left" size={24} color="#000" />
                </TouchableOpacity>

                {/* Logo and App Name */}
                <View style={styles.logoContainer}>
                    <Image
                        source={require('../Assets/logo.png')}
                        style={styles.logo}
                        resizeMode="contain"
                    />
                    <Text style={styles.logoText}>Asset<Text style={styles.logoTextHighlight}>Tracker</Text></Text>
                </View>

                <View style={{ width: 24 }} />
            </View>

            <View style={styles.container}>
                <ScrollView contentContainerStyle={styles.scrollView}>
                    {/* Profile Info Section - Read Only */}
                    <View style={styles.section}>
                        <View style={styles.profileInfo}>
                            <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>Email Address</Text>
                                <Text style={styles.infoValue}>{email || 'user@example.com'}</Text>
                            </View>

                            <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>Permissions</Text>
                                <Text style={styles.infoValue}>{getUserRole()}</Text>
                            </View>
                        </View>

                        {/* Change Password Button */}
                        <TouchableOpacity
                            style={styles.changePasswordButton}
                            onPress={showPasswordModal}
                        >
                            <Icon name="lock-reset" size={20} color="#fff" />
                            <Text style={styles.changePasswordButtonText}>Change Password</Text>
                        </TouchableOpacity>

                        {/* Logout Button */}
                        <TouchableOpacity
                            style={styles.logoutButton}
                            onPress={handleLogout}
                        >
                            <Icon name="logout" size={20} color="#fff" />
                            <Text style={styles.logoutButtonText}>Logout</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Role Switching Section */}
                    {hasMultipleRoles && (
                        <View style={styles.roleSwitchSection}>
                            <Text style={styles.roleSwitchTitle}>Switch Role</Text>
                            <View style={styles.roleButtonsContainer}>
                                <TouchableOpacity
                                    style={[
                                        styles.roleButton,
                                        currentRole === 'Service Head' || currentRole === 'Admin'
                                            ? styles.roleButtonActive
                                            : styles.roleButtonInactive
                                    ]}
                                    onPress={() => handleRoleSwitch('Service Head')}
                                >
                                    <Icon
                                        name="account-tie"
                                        size={20}
                                        color={currentRole === 'Service Head' || currentRole === 'Admin' ? '#fff' : '#0FA37F'}
                                    />
                                    <Text style={[
                                        styles.roleButtonText,
                                        { color: currentRole === 'Service Head' || currentRole === 'Admin' ? '#fff' : '#0FA37F' }
                                    ]}>
                                        Service Head
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[
                                        styles.roleButton,
                                        currentRole === 'Service Engineer'
                                            ? styles.roleButtonActive
                                            : styles.roleButtonInactive
                                    ]}
                                    onPress={() => handleRoleSwitch('Service Engineer')}
                                >
                                    <Icon
                                        name="account-cog"
                                        size={20}
                                        color={currentRole === 'Service Engineer' ? '#fff' : '#0FA37F'}
                                    />
                                    <Text style={[
                                        styles.roleButtonText,
                                        { color: currentRole === 'Service Engineer' ? '#fff' : '#0FA37F' }
                                    ]}>
                                        Service Engineer
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                </ScrollView>
            </View>

            {/* Change Password Modal */}
            <Modal
                visible={isPasswordModalVisible}
                transparent={true}
                animationType="none"
                onRequestClose={hidePasswordModal}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={hidePasswordModal}
                >
                    <Animated.View
                        style={[
                            styles.modalContent,
                            { transform: [{ translateY: slideAnim }] }
                        ]}
                    >
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Change Password</Text>
                            <TouchableOpacity onPress={hidePasswordModal}>
                                <Icon name="close" size={24} color="#000" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.modalBody}>
                            {/* Email field (read-only) */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Email</Text>
                                <TextInput
                                    style={[styles.input, styles.readOnlyInput]}
                                    value={email || ''}
                                    placeholder="Email address"
                                    placeholderTextColor="#999"
                                    editable={false}
                                />
                            </View>

                            {/* New Password with show/hide toggle */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>New Password</Text>
                                <View style={styles.passwordInputContainer}>
                                    <TextInput
                                        style={styles.passwordInput}
                                        value={newPassword}
                                        onChangeText={setNewPassword}
                                        placeholder="Enter new password"
                                        placeholderTextColor="#999"
                                        secureTextEntry={!showNewPassword}
                                    />
                                    <TouchableOpacity
                                        style={styles.eyeIcon}
                                        onPress={toggleShowNewPassword}
                                    >
                                        <Icon
                                            name={showNewPassword ? "eye-off" : "eye"}
                                            size={20}
                                            color="#666"
                                        />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Confirm Password with show/hide toggle */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Confirm Password</Text>
                                <View style={styles.passwordInputContainer}>
                                    <TextInput
                                        style={styles.passwordInput}
                                        value={confirmPassword}
                                        onChangeText={setConfirmPassword}
                                        placeholder="Confirm new password"
                                        placeholderTextColor="#999"
                                        secureTextEntry={!showConfirmPassword}
                                    />
                                    <TouchableOpacity
                                        style={styles.eyeIcon}
                                        onPress={toggleShowConfirmPassword}
                                    >
                                        <Icon
                                            name={showConfirmPassword ? "eye-off" : "eye"}
                                            size={20}
                                            color="#666"
                                        />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <TouchableOpacity
                                style={styles.saveButton}
                                onPress={handleSavePassword}
                            >
                                <Text style={styles.saveButtonText}>Save Changes</Text>
                            </TouchableOpacity>
                        </View>
                    </Animated.View>
                </TouchableOpacity>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#fff',
    },
    container: {
        flex: 1,
        justifyContent: 'center',

    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 36,
    },
    backButton: {
        padding: 0,
    },
    logoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    logo: {
        width: 50,
        height: 50,
        // marginRight: 10,
    },
    logoText: {
        fontSize: 30,
        fontWeight: '700',
        color: '#000',
    },
    logoTextHighlight: {
        color: '#0FA37F',
    },
    scrollView: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 20,
        paddingBottom: 40,
    },
    section: {
        marginBottom: 30,
        alignItems: 'center',
    },
    profileInfo: {
        padding: 24,
        width: '100%',
        marginBottom: 20,
    },
    infoRow: {
        marginBottom: 20,
        alignItems: 'center',
    },
    infoLabel: {
        fontSize: 14,
        color: '#666',
        marginBottom: 8,
        fontWeight: '500',
        textAlign: 'center',
    },
    infoValue: {
        fontSize: 16,
        color: '#000',
        fontWeight: '600',
        textAlign: 'center',
    },
    changePasswordButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#0FA37F',
        padding: 16,
        borderRadius: 12,
        width: '100%',
        justifyContent: 'center',
        marginBottom: 15,
    },
    changePasswordButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FF3B30',
        padding: 16,
        borderRadius: 12,
        width: '100%',
        justifyContent: 'center',
    },
    logoutButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        minHeight: height * 0.5,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#000',
    },
    modalBody: {
        alignItems: 'center',
    },
    inputGroup: {
        marginBottom: 20,
        width: '100%',
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
        color: '#333',
        textAlign: 'left',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        backgroundColor: '#f9f9f9',
    },
    readOnlyInput: {
        backgroundColor: '#f0f0f0',
        color: '#666',
    },
    // Password input container styles
    passwordInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 12,
        backgroundColor: '#f9f9f9',
    },
    passwordInput: {
        flex: 1,
        padding: 16,
        fontSize: 16,
    },
    eyeIcon: {
        padding: 16,
    },
    saveButton: {
        backgroundColor: '#0FA37F',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 10,
        width: '100%',
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    roleSwitchSection: {
        width: '100%',
        marginBottom: 20,
        padding: 16,
        backgroundColor: '#f9f9f9',
        borderRadius: 12,
    },
    roleSwitchTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 12,
        textAlign: 'center',
    },
    roleButtonsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    roleButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 8,
        minWidth: 140,
        justifyContent: 'center',
    },
    roleButtonActive: {
        backgroundColor: '#0FA37F',
    },
    roleButtonInactive: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#0FA37F',
    },
    roleButtonText: {
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 8,
    },
});

export { Profile };