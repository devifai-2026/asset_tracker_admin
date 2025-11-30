import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

interface ExpandableTextProps {
    label: string;
    value: string;
    maxLength?: number;
}

const ExpandableText = ({ label, value, maxLength = 50 }: ExpandableTextProps) => {
    const [expanded, setExpanded] = useState(false);

    const shouldTruncate = value.length > maxLength;
    const displayText = expanded || !shouldTruncate ? value : `${value.substring(0, maxLength)}...`;

    return (
        <View style={styles.expandableRow}>
            <Text style={styles.label}>{label}</Text>
            <View style={styles.valueContainer}>
                <Text style={styles.value}>
                    {displayText}
                </Text>
                {shouldTruncate && (
                    <TouchableOpacity onPress={() => setExpanded(!expanded)}>
                        <Text style={styles.seeMoreText}>
                            {expanded ? "See less" : "See more"}
                        </Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
};


const styles = StyleSheet.create({

    expandableRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginVertical: 5,
    },
    valueContainer: {
        flex: 1,
        marginLeft: 10,
    },
    seeMoreText: {
        color: "#0FA37F",
        fontSize: 12,
        fontWeight: "600",
        marginTop: 4,
        textAlign: "right",
    },
});


export default ExpandableText;