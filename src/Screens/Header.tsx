import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Platform, StatusBar } from 'react-native';
import { useNavigation } from '@react-navigation/native';

interface HeaderProps {
    title?: string;
    showLogo?: boolean;
    showProfilePic?: boolean;
}

export const Header = ({ title, showLogo = true, showProfilePic = true }: HeaderProps) => {
    const navigation = useNavigation<any>();

    const handleProfilePress = () => {
        navigation.navigate('Profile');
    };

    return (
        <View style={styles.header}>
            {showLogo ? (
                <View style={styles.logoContainer}>
                    <Image
                        source={require('../Assets/logo.png')}
                        style={styles.logoImage}
                        resizeMode="contain"
                    />
                    <Text style={styles.logoText}>
                        Asset<Text style={styles.logoTextHighlight}>Tracker</Text>
                    </Text>
                </View>
            ) : (
                <View style={styles.titleContainer}>
                    <Text style={styles.title}>{title}</Text>
                </View>
            )}

            {showProfilePic && (
                <TouchableOpacity onPress={handleProfilePress}>
                    <Image
                        source={{
                            uri: "https://randomuser.me/api/portraits/men/36.jpg",
                        }}
                        style={styles.profilePic}
                    />
                </TouchableOpacity>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    },
    logoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    logoImage: {
        width: 40,
        height: 40,
        marginRight: 10,
    },
    logoText: {
        fontSize: 20,
        fontWeight: '700',
        color: '#000',
        fontFamily: 'Inter-Bold',
    },
    logoTextHighlight: {
        color: '#0FA37F',
    },
    titleContainer: {
        flex: 1,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: '#000',
        fontFamily: 'Inter-Bold',
    },
    profilePic: {
        width: 36,
        height: 36,
        borderRadius: 18
    },
});