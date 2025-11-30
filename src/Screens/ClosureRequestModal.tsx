// ClosureRequestModal.tsx
import React, { useState } from "react";
import {
    View,
    Text,
    Modal,
    TouchableOpacity,
    StyleSheet,
    Switch,
} from "react-native";

interface ClosureRequestModalProps {
    visible: boolean;
    onClose: () => void;
    onSubmit: (temporary: boolean) => void;
    isTemporaryClosed?: boolean;
}

const ClosureRequestModal: React.FC<ClosureRequestModalProps> = ({
    visible,
    onClose,
    onSubmit,
    isTemporaryClosed = false,
}) => {
    const [temporary, setTemporary] = useState(false);

    const handleSubmit = () => {
        onSubmit(temporary);
        setTemporary(false);
    };

    const handleClose = () => {
        setTemporary(false);
        onClose();
    };

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="slide"
            onRequestClose={handleClose}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>
                        {isTemporaryClosed ? "Request Permanent Closure" : "Request Maintenance Closure"}
                    </Text>
                    <Text style={styles.modalText}>
                        {isTemporaryClosed 
                            ? "This maintenance is temporarily closed. Are you sure you want to request permanent closure?"
                            : "Are you sure you want to request closure for this maintenance?"
                        }
                    </Text>

                    {!isTemporaryClosed && (
                        <View style={styles.switchContainer}>
                            <Text style={styles.switchLabel}>Close Temporarily</Text>
                            <Switch
                                value={temporary}
                                onValueChange={setTemporary}
                                trackColor={{ false: "#767577", true: "#81b0ff" }}
                                thumbColor={temporary ? "#0FA37F" : "#f4f3f4"}
                            />
                        </View>
                    )}

                    <View style={styles.modalButtons}>
                        <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
                            <Text style={styles.buttonText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={styles.submitButton} 
                            onPress={handleSubmit}
                        >
                            <Text style={styles.buttonText}>
                                {isTemporaryClosed ? "Confirm" : "Confirm"}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        justifyContent: "center",
        alignItems: "center",
    },
    modalContent: {
        backgroundColor: "white",
        borderRadius: 10,
        padding: 20,
        width: "80%",
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 10,
        textAlign: "center",
    },
    modalText: {
        fontSize: 16,
        marginBottom: 15,
        textAlign: "center",
        lineHeight: 20,
    },
    switchContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 20,
        paddingHorizontal: 5,
    },
    switchLabel: {
        fontSize: 16,
        color: "#333",
    },
    modalButtons: {
        flexDirection: "row",
        justifyContent: "space-between",
    },
    cancelButton: {
        backgroundColor: "#ccc",
        padding: 12,
        borderRadius: 5,
        flex: 1,
        marginRight: 10,
        alignItems: "center",
    },
    submitButton: {
        backgroundColor: "#0FA37F",
        padding: 12,
        borderRadius: 5,
        flex: 1,
        marginLeft: 10,
        alignItems: "center",
    },
    buttonText: {
        color: "white",
        fontWeight: "bold",
        fontSize: 14,
    },
});

export default ClosureRequestModal;