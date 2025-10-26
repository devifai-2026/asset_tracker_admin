import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

interface ClosureBannerProps {
    onClosePress: () => void;
}

const ClosureBanner = ({ onClosePress }: ClosureBannerProps) => {
    return (
        <View style={styles.closureBanner}>
            <View style={styles.closureBannerContent}>
                <View style={styles.closureTextContainer}>
                    <Text style={styles.closureTitle}>Closer Requested</Text>
                    <Text style={styles.closureDescription}>
                        Closer request has been created by cataloged service engineer, please click the button to close.
                    </Text>
                </View>
                <TouchableOpacity
                    style={styles.closeButton}
                    onPress={onClosePress}
                >
                    <Text style={styles.closeButtonText}>Close</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    closureBanner: {
        backgroundColor: "#FFF5F5",
        marginHorizontal: 16,
        marginTop: 16,
        borderRadius: 12,
        padding: 16,
        borderLeftWidth: 4,
        borderLeftColor: "#FF5252",
        position: "relative",
    },
    closureBannerContent: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    closureTextContainer: {
        flex: 1,
        paddingRight: 12,
    },
    closureTitle: {
        fontSize: 16,
        fontWeight: "600",
        color: "#D32F2F",
        marginBottom: 4,
    },
    closureDescription: {
        fontSize: 13,
        color: "#757575",
        lineHeight: 18,
    },
    closeButton: {
        backgroundColor: "#FF5252",
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 6,
    },
    closeButtonText: {
        color: "#ffffff",
        fontSize: 14,
        fontWeight: "600",
    },
    dismissButton: {
        position: "absolute",
        top: 8,
        right: 8,
        padding: 4,
    },
});

export default ClosureBanner;