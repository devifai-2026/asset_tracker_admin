import React from 'react';
import { View, Text } from 'react-native';
import { Header } from '../Screens/Header';

const AdminMainTabs = () => {
    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Header title="Admin Dashboard" />
            <Text>Admin Dashboard</Text>
        </View>
    );
};

export default AdminMainTabs;