import React from 'react';
import {
    View,
    TouchableOpacity,
    Text,
    StyleSheet,
} from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Ionicons';

import { Maintenance } from '../Screens/Maintenance';
import { Notifications } from '../Screens/Notifications';
import { Profile } from '../Screens/Profile'; // Import Profile instead of Wallet
import { HeadMaintenance } from '../Screens/ServiceHead/HeadMaintenance';

const Tab = createBottomTabNavigator();

type TabItem = {
    name: string;
    component: React.ComponentType<any>;
    iconName: string;
    activeIconName: string;
};

const TabsConfig: TabItem[] = [
    {
        name: 'Maintenance',
        component: HeadMaintenance,
        iconName: 'build-outline',
        activeIconName: 'build'
    },
    {
        name: 'Notifications',
        component: Notifications,
        iconName: 'notifications-outline',
        activeIconName: 'notifications'
    },
    {
        name: 'Account', // Changed from 'Wallet' to 'Account'
        component: Profile, // Changed from Wallet to Profile
        iconName: 'person-outline', // Changed from wallet icon to person icon
        activeIconName: 'person' // Changed from wallet icon to person icon
    },
];

const CustomTabBar = ({ state, descriptors, navigation }: any) => {
    return (
        <View style={styles.tabBar}>
            {state.routes.map((route: any, index: number) => {
                const { options } = descriptors[route.key];
                const isFocused = state.index === index;
                const tab: TabItem | undefined = options.tabData;

                if (!tab) return null;

                const onPress = () => {
                    const event = navigation.emit({
                        type: 'tabPress',
                        target: route.key,
                        canPreventDefault: true,
                    });

                    if (!isFocused && !event.defaultPrevented) {
                        navigation.navigate(route.name);
                    }
                };

                return (
                    <TouchableOpacity
                        key={route.key}
                        onPress={onPress}
                        style={styles.tabItem}
                        activeOpacity={0.7}
                    >
                        <Icon
                            name={isFocused ? tab.activeIconName : tab.iconName}
                            size={26}
                            color={isFocused ? '#0FA37F' : '#000'}
                        />
                        <Text
                            style={{
                                fontSize: 12,
                                marginTop: 2,
                                color: isFocused ? '#0FA37F' : '#000',
                                fontWeight: isFocused ? '600' : '400',
                            }}
                        >
                            {tab.name}
                        </Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
};

const HeadMainTabs = () => {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => {
                const tab = TabsConfig.find((t) => t.name === route.name);
                return {
                    headerShown: false,
                    tabData: tab,
                };
            }}
            tabBar={(props) => <CustomTabBar {...props} />}
        >
            {TabsConfig.map((tab) => (
                <Tab.Screen key={tab.name} name={tab.name} component={tab.component} />
            ))}
        </Tab.Navigator>
    );
};

const styles = StyleSheet.create({
    tabBar: {
        flexDirection: 'row',
        height: 70,
        alignItems: 'center',
        justifyContent: 'space-around',
        backgroundColor: '#fff',
        borderTopWidth: 0.5,
        borderTopColor: '#ddd',
    },
    tabItem: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
});

export default HeadMainTabs;