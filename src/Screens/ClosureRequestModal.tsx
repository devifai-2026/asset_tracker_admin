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
}

const ClosureRequestModal: React.FC<ClosureRequestModalProps> = ({
    visible,
    onClose,
    onSubmit,
}) => {
    const [temporary, setTemporary] = useState(false);

    const handleSubmit = () => {
        onSubmit(temporary);
        setTemporary(false);
    };

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>Request Maintenance Closure</Text>
                    <Text style={styles.modalText}>
                        Are you sure you want to request closure for this maintenance?
                    </Text>

                    <View style={styles.switchContainer}>
                        <Text style={styles.switchLabel}>Close Temporarily</Text>
                        <Switch
                            value={temporary}
                            onValueChange={setTemporary}
                            trackColor={{ false: "#767577", true: "#81b0ff" }}
                            thumbColor={temporary ? "#0FA37F" : "#f4f3f4"}
                        />
                    </View>

                    <View style={styles.modalButtons}>
                        <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                            <Text style={styles.buttonText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
                            <Text style={styles.buttonText}>Confirm</Text>
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
    },
    modalText: {
        fontSize: 16,
        marginBottom: 15,
    },
    switchContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 20,
    },
    switchLabel: {
        fontSize: 16,
    },
    modalButtons: {
        flexDirection: "row",
        justifyContent: "space-between",
    },
    cancelButton: {
        backgroundColor: "#ccc",
        padding: 10,
        borderRadius: 5,
        flex: 1,
        marginRight: 10,
        alignItems: "center",
    },
    submitButton: {
        backgroundColor: "#0FA37F",
        padding: 10,
        borderRadius: 5,
        flex: 1,
        marginLeft: 10,
        alignItems: "center",
    },
    buttonText: {
        color: "white",
        fontWeight: "bold",
    },
});

export default ClosureRequestModal;