// MaintenanceRatingScreen.tsx
import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Alert,
    SafeAreaView,
    Dimensions,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { useDispatch, useSelector } from "react-redux";
import Icon from "react-native-vector-icons/MaterialIcons";

// API and types
import { authClient } from "../services/api.clients";
import { APIEndpoints } from "../services/api.endpoints";
import { Header } from "./Header";

interface RatingCategory {
    form_name: string;
    id: number;
    percentage: number;
    sub_value: any[];
    titel: string;
    type?: string;
}

interface RatingData {
    id: number;
    percentage: number;
    rating?: number;
    sub_value?: Array<{
        id: number;
        percentage: number;
        rating?: number;
        titel?: string;
    }>;
}

interface ApiResponse {
    "DC Machine"?: RatingCategory[];
    "DC Machine Preventive"?: RatingCategory[];
    "IC Machine"?: RatingCategory[];
    "IC Machine Preventive"?: RatingCategory[];
}

const ITEMS_PER_PAGE = 5;
const { height: SCREEN_HEIGHT } = Dimensions.get('window');

type MachineType = 'DC Machine' | 'IC Machine';

const MaintenanceRatingScreen = () => {
    const route = useRoute();
    const navigation = useNavigation();
    const dispatch = useDispatch();

    const { maintenanceId, temporary, types }: any = route.params || {};
    const [allCategories, setAllCategories] = useState<RatingCategory[]>([]);
    const [filteredCategories, setFilteredCategories] = useState<RatingCategory[]>([]);
    const [ratings, setRatings] = useState<RatingData[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedMachineType, setSelectedMachineType] = useState<MachineType>('DC Machine');

    useEffect(() => {
        fetchRatingCategories();
    }, []);

    useEffect(() => {
        if (allCategories.length > 0) {
            filterCategoriesByType();
        }
    }, [allCategories, types, selectedMachineType]);

    const fetchRatingCategories = async () => {
        try {
            setLoading(true);
            const isPreventive = types === "preventive_maintenance";

            // Use proper endpoint construction
            const endpoint = `/sale-service/get-maintenance-pmc-rate?s=1&preventive=${isPreventive ? 1 : 0}`;

            console.log("Fetching from endpoint:", endpoint);
            const response = await authClient.get(endpoint);
            const data: ApiResponse = response.data || {};

            console.log("API Response Data:", data);

            // Extract categories from API response
            let categories: RatingCategory[] = [];

            if (isPreventive) {
                // For preventive maintenance - get both DC and IC preventive categories
                if (data["DC Machine Preventive"]) {
                    console.log("Found DC Machine Preventive:", data["DC Machine Preventive"].length);
                    categories = [...categories, ...data["DC Machine Preventive"]];
                }
                if (data["IC Machine Preventive"]) {
                    console.log("Found IC Machine Preventive:", data["IC Machine Preventive"].length);
                    categories = [...categories, ...data["IC Machine Preventive"]];
                }
            } else {
                // For non-preventive maintenance
                if (data["DC Machine"]) {
                    console.log("Found DC Machine:", data["DC Machine"].length);
                    categories = [...categories, ...data["DC Machine"]];
                }
                if (data["IC Machine"]) {
                    console.log("Found IC Machine:", data["IC Machine"].length);
                    categories = [...categories, ...data["IC Machine"]];
                }
            }

            console.log("Total categories loaded:", categories.length);
            setAllCategories(categories);

        } catch (error) {
            console.error("Failed to fetch rating categories:", error);
            Alert.alert("Error", "Failed to load rating categories");
        } finally {
            setLoading(false);
        }
    };

    const filterCategoriesByType = () => {
        let filtered: RatingCategory[] = [];

        const isPreventive = types === "preventive_maintenance";

        // Determine the expected form_name based on maintenance type and machine type
        const expectedFormName = isPreventive
            ? `${selectedMachineType} Preventive`
            : selectedMachineType;

        console.log(`Filtering for: ${expectedFormName}, Preventive: ${isPreventive}`);

        // Filter categories by form_name
        const machineFiltered = allCategories.filter(category =>
            category.form_name === expectedFormName
        );

        console.log(`Categories after machine filter: ${machineFiltered.length}`);

        if (isPreventive) {
            // For preventive maintenance - show categories that have sub_values
            filtered = machineFiltered.filter(category =>
                category.sub_value && category.sub_value.length > 0
            );
        } else {
            // For non-preventive maintenance - show categories without sub_values
            filtered = machineFiltered.filter(category =>
                !category.sub_value || category.sub_value.length === 0
            );
        }

        console.log(`Final filtered categories: ${filtered.length}`);
        setFilteredCategories(filtered);

        // Initialize ratings for filtered categories
        const initialRatings = filtered.map((category: RatingCategory) => {
            const ratingData: RatingData = {
                id: category.id,
                percentage: category.percentage,
            };

            // Only include sub_value if there are actual sub values
            if (category.sub_value && category.sub_value.length > 0) {
                ratingData.sub_value = category.sub_value.map((sub: any) => ({
                    id: sub.id,
                    percentage: sub.percentage,
                    titel: sub.titel,
                }));
            }

            return ratingData;
        });

        setRatings(initialRatings);
        setCurrentPage(1); // Reset to first page when filter changes
    };

    const setCategoryRating = (categoryId: number, rating: number) => {
        const updatedRatings = ratings.map(item =>
            item.id === categoryId ? { ...item, rating } : item
        );
        setRatings(updatedRatings);
    };

    const setSubCategoryRating = (categoryId: number, subId: number, rating: number) => {
        const updatedRatings = ratings.map(item => {
            if (item.id === categoryId && item.sub_value) {
                const updatedSubValues = item.sub_value.map(sub =>
                    sub.id === subId ? { ...sub, rating } : sub
                );
                return { ...item, sub_value: updatedSubValues };
            }
            return item;
        });
        setRatings(updatedRatings);
    };

    const calculateFinalRating = () => {
        let totalWeightedScore = 0;
        let totalPercentage = 0;

        ratings.forEach(category => {
            if (category.sub_value && category.sub_value.length > 0) {
                // Preventive maintenance - has sub values
                let subWeightedScore = 0;
                let subTotalPercentage = 0;

                category.sub_value.forEach(sub => {
                    if (sub.rating !== undefined) {
                        subWeightedScore += sub.percentage * sub.rating;
                        subTotalPercentage += sub.percentage;
                    }
                });

                if (subTotalPercentage > 0) {
                    const categoryScore = (subWeightedScore / subTotalPercentage) * (category.percentage / 100);
                    totalWeightedScore += categoryScore;
                }

                totalPercentage += category.percentage / 100;
            } else {
                // Non-preventive maintenance - direct rating
                if (category.rating !== undefined) {
                    totalWeightedScore += category.percentage * category.rating;
                    totalPercentage += category.percentage;
                }
            }
        });

        return totalPercentage > 0 ? totalWeightedScore / totalPercentage : 0;
    };

    const handleSubmit = async () => {
        // Check if all categories are rated
        const allRated = ratings.every(category => {
            if (category.sub_value && category.sub_value.length > 0) {
                return category.sub_value.every(sub => sub.rating !== undefined);
            }
            return category.rating !== undefined;
        });

        if (!allRated) {
            Alert.alert("Incomplete", "Please rate all sections before submitting");
            return;
        }

        try {
            setSubmitting(true);

            // Prepare payload - Clean up the data structure
            const payloadData = ratings.map(category => {
                // For categories with sub_values, clean the sub_value objects
                if (category.sub_value && category.sub_value.length > 0) {
                    const cleanedSubValues = category.sub_value.map(sub => ({
                        id: sub.id,
                        percentage: sub.percentage,
                        rating: sub.rating
                    }));

                    return {
                        id: category.id,
                        percentage: category.percentage,
                        sub_value: cleanedSubValues
                    };
                } else {
                    // For categories without sub_values
                    return {
                        id: category.id,
                        percentage: category.percentage,
                        rating: category.rating
                    };
                }
            });

            const payload = {
                temporary,
                maintenance_id: maintenanceId,
                rating_data: payloadData,
            };

            console.log("Final Payload:", JSON.stringify(payload, null, 2));

            const response = await authClient.post("/sale-service/set-as-complete-pmc", payload);

            console.log("API Response:", response);

            if (response.data.types === "successful") {
                Alert.alert("Success", response.data.msg || "Maintenance task marked as complete", [
                    {
                        text: "OK",
                        onPress: () => {
                            navigation.goBack();
                        }
                    }
                ]);
            } else {
                Alert.alert("Error", response.data.msg || "Failed to submit rating");
            }

        } catch (error) {
            console.error("Failed to submit rating:", error);
            Alert.alert("Error", "Failed to submit rating");
        } finally {
            setSubmitting(false);
        }
    };

    // Pagination logic
    const totalPages = Math.ceil(filteredCategories.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const currentCategories = filteredCategories.slice(startIndex, endIndex);

    // Check if all ratings on the current page are completed
    const isCurrentPageComplete = () => {
        const currentCategoryIds = currentCategories.map(cat => cat.id);
        const currentRatings = ratings.filter(rating => currentCategoryIds.includes(rating.id));

        return currentRatings.every(category => {
            if (category.sub_value && category.sub_value.length > 0) {
                return category.sub_value.every(sub => sub.rating !== undefined);
            }
            return category.rating !== undefined;
        });
    };

    // Check if all ratings are completed
    const isAllRated = () => {
        return ratings.every(category => {
            if (category.sub_value && category.sub_value.length > 0) {
                return category.sub_value.every(sub => sub.rating !== undefined);
            }
            return category.rating !== undefined;
        });
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#0FA37F" />
            </SafeAreaView>
        );
    }

    const ratedCount = ratings.filter(category => {
        if (category.sub_value && category.sub_value.length > 0) {
            return category.sub_value.every(sub => sub.rating !== undefined);
        }
        return category.rating !== undefined;
    }).length;

    const totalCount = ratings.length;

    return (
        <SafeAreaView style={styles.container}>
            {/* Sticky Header */}
            <View style={styles.stickyHeader}>
                <Header />
            </View>

            <ScrollView
                style={styles.scrollContainer}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.card}>
                    <Text style={styles.screenTitle}>Please rate this machine</Text>
                    <Text style={styles.screenSubtitle}>
                        {temporary ? "Temporary Closure" : "Permanent Closure"}
                    </Text>


                    {/* Machine Type Tabs */}
                    <View style={styles.tabContainer}>
                        <TouchableOpacity
                            style={[
                                styles.tab,
                                selectedMachineType === 'DC Machine' && styles.tabActive
                            ]}
                            onPress={() => {
                                setSelectedMachineType('DC Machine');
                                setCurrentPage(1);
                            }}
                        >
                            <Text style={[
                                styles.tabText,
                                selectedMachineType === 'DC Machine' && styles.tabTextActive
                            ]}>
                                DC Machine
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[
                                styles.tab,
                                selectedMachineType === 'IC Machine' && styles.tabActive
                            ]}
                            onPress={() => {
                                setSelectedMachineType('IC Machine');
                                setCurrentPage(1);
                            }}
                        >
                            <Text style={[
                                styles.tabText,
                                selectedMachineType === 'IC Machine' && styles.tabTextActive
                            ]}>
                                IC Machine
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.progressSection}>
                        <Text style={styles.sectionTitle}>Overall Progress</Text>
                        <Text style={styles.progressText}>
                            {ratedCount} / {totalCount} rated
                        </Text>
                    </View>
                </View>

                {currentCategories.length === 0 ? (
                    <View style={styles.card}>
                        <Text style={styles.noDataText}>
                            No rating categories found for {selectedMachineType} {types === "preventive_maintenance" ? "Preventive" : ""} maintenance.
                        </Text>
                        <Text style={styles.noDataSubtext}>
                            Please check if this machine type has available rating criteria.
                        </Text>
                    </View>
                ) : (
                    currentCategories.map(category => (
                        <View key={category.id} style={styles.card}>
                            <Text style={styles.categoryTitle}>{category.titel}</Text>
                            {/* <Text style={styles.categoryWeight}>
                                Weight: {category.percentage}%
                            </Text> */}

                            {category.sub_value && category.sub_value.length > 0 ? (
                                // Preventive maintenance with sub categories
                                category.sub_value.map(sub => (
                                    <View key={sub.id} style={styles.subCategory}>
                                        <Text style={styles.subCategoryTitle}>{sub.titel || `Sub-item ${sub.id}`}</Text>
                                        {/* <Text style={styles.subCategoryWeight}>
                                            Weight: {sub.percentage}%
                                        </Text> */}

                                        <View style={styles.ratingOptions}>
                                            {[0, 2.5, 5].map(rating => (
                                                <TouchableOpacity
                                                    key={rating}
                                                    style={[
                                                        styles.ratingOption,
                                                        getSubRating(category.id, sub.id) === rating &&
                                                        getRatingStyle(rating)
                                                    ]}
                                                    onPress={() => setSubCategoryRating(category.id, sub.id, rating)}
                                                >
                                                    <Text style={[
                                                        styles.ratingOptionText,
                                                        getSubRating(category.id, sub.id) === rating &&
                                                        styles.ratingOptionTextSelected
                                                    ]}>
                                                        {getRatingLabel(rating)}
                                                    </Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    </View>
                                ))
                            ) : (
                                // Non-preventive maintenance - direct rating
                                <>
                                    <Text style={styles.ratingPrompt}>Select an overall rating for this section:</Text>
                                    <View style={styles.ratingOptions}>
                                        {[0, 2.5, 5].map(rating => (
                                            <TouchableOpacity
                                                key={rating}
                                                style={[
                                                    styles.ratingOption,
                                                    getCategoryRating(category.id) === rating &&
                                                    getRatingStyle(rating)
                                                ]}
                                                onPress={() => setCategoryRating(category.id, rating)}
                                            >
                                                <Text style={[
                                                    styles.ratingOptionText,
                                                    getCategoryRating(category.id) === rating &&
                                                    styles.ratingOptionTextSelected
                                                ]}>
                                                    {getRatingLabel(rating)}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </>
                            )}
                        </View>
                    ))
                )}

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <View style={styles.paginationContainer}>
                        <TouchableOpacity
                            style={[styles.paginationButton, currentPage === 1 && styles.paginationButtonDisabled]}
                            onPress={() => setCurrentPage(Math.max(1, currentPage - 1))}
                            disabled={currentPage === 1}
                        >
                            <Text style={styles.paginationButtonText}>Previous</Text>
                        </TouchableOpacity>

                        <Text style={styles.paginationInfo}>
                            Page {currentPage} of {totalPages}
                        </Text>

                        <TouchableOpacity
                            style={[styles.paginationButton,
                            (!isCurrentPageComplete() || currentPage === totalPages) && styles.paginationButtonDisabled]}
                            onPress={() => {
                                if (isCurrentPageComplete()) {
                                    setCurrentPage(Math.min(totalPages, currentPage + 1));
                                }
                            }}
                            disabled={!isCurrentPageComplete() || currentPage === totalPages}
                        >
                            <Text style={styles.paginationButtonText}>Next</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {currentPage === totalPages && isAllRated() && (
                    <View style={styles.submitSection}>
                        <Text style={styles.summaryTitle}>Overall Rating Summary</Text>
                        <Text style={styles.summaryScore}>
                            {calculateFinalRating().toFixed(2)} / 5.00
                        </Text>
                        <Text style={styles.summaryPercentage}>
                            {(calculateFinalRating() * 20).toFixed(1)}% of maximum possible score
                        </Text>

                        <TouchableOpacity
                            style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
                            onPress={handleSubmit}
                            disabled={submitting}
                        >
                            {submitting ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.submitButtonText}>Submit Rating</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                )}

                {/* Bottom spacer to avoid overlap with navigation */}
                <View style={styles.bottomSpacer} />
            </ScrollView>
        </SafeAreaView>
    );

    function getCategoryRating(categoryId: number): number | undefined {
        const category = ratings.find(r => r.id === categoryId);
        return category?.rating;
    }

    function getSubRating(categoryId: number, subId: number): number | undefined {
        const category = ratings.find(r => r.id === categoryId);
        const sub = category?.sub_value?.find(s => s.id === subId);
        return sub?.rating;
    }

    function getRatingLabel(rating: number): string {
        switch (rating) {
            case 0: return "Poor";
            case 2.5: return "Fair";
            case 5: return "Good";
            default: return "";
        }
    }

    function getRatingStyle(rating: number) {
        switch (rating) {
            case 0: return styles.ratingOptionPoor;
            case 2.5: return styles.ratingOptionFair;
            case 5: return styles.ratingOptionGood;
            default: return {};
        }
    }
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#fff"
    },
    stickyHeader: {
        padding: 16
    },
    scrollContainer: {
        flex: 1
    },
    scrollContent: {
        paddingBottom: 120, // Extra padding for navigation bar
    },
    centerContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#fff",
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        padding: 15,
        alignItems: "center",
        borderBottomWidth: 0.5,
        borderBottomColor: "#ddd",
    },
    logoText: {
        fontSize: 18,
        fontWeight: "bold"
    },
    closeButton: {
        padding: 5,
    },
    card: {
        backgroundColor: "#fff",
        marginHorizontal: 12,
        marginTop: 8,
        padding: 15,
        borderRadius: 12,
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 4,
        elevation: 2,
    },
    screenTitle: {
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 5,
        textAlign: "center",
    },
    screenSubtitle: {
        fontSize: 14,
        color: "#666",
        marginBottom: 5,
        textAlign: "center",
    },
    typeIndicator: {
        fontSize: 14,
        color: "#0FA37F",
        fontWeight: "600",
        marginBottom: 15,
        textAlign: "center",
    },
    debugInfo: {
        backgroundColor: '#f8f9fa',
        padding: 10,
        marginBottom: 15,
        borderRadius: 6,
        borderLeftWidth: 4,
        borderLeftColor: '#0FA37F',
    },
    debugText: {
        fontSize: 12,
        color: '#666',
        fontFamily: 'monospace',
    },
    // Tab Styles
    tabContainer: {
        flexDirection: "row",
        marginBottom: 15,
        backgroundColor: "#f5f5f5",
        borderRadius: 8,
        padding: 4,
    },
    tab: {
        flex: 1,
        paddingVertical: 10,
        alignItems: "center",
        borderRadius: 6,
    },
    tabActive: {
        backgroundColor: "#fff",
        shadowColor: "#000",
        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: 1 },
        shadowRadius: 2,
        elevation: 2,
    },
    tabText: {
        fontSize: 14,
        fontWeight: "500",
        color: "#666",
    },
    tabTextActive: {
        color: "#0FA37F",
        fontWeight: "600",
    },
    progressSection: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 10,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: "600",
    },
    progressText: {
        fontSize: 14,
        color: "#666",
    },
    categoryTitle: {
        fontSize: 16,
        fontWeight: "600",
        marginBottom: 5,
    },
    categoryWeight: {
        fontSize: 14,
        color: "#666",
        marginBottom: 10,
    },
    ratingPrompt: {
        fontSize: 14,
        marginBottom: 10,
        color: "#444",
    },
    subCategory: {
        marginBottom: 15,
        padding: 10,
        backgroundColor: "#f9f9f9",
        borderRadius: 8,
    },
    subCategoryTitle: {
        fontSize: 14,
        fontWeight: "500",
        marginBottom: 5,
    },
    subCategoryWeight: {
        fontSize: 12,
        color: "#666",
        marginBottom: 8,
    },
    ratingOptions: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 5,
    },
    ratingOption: {
        flex: 1,
        padding: 10,
        marginHorizontal: 5,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#ddd",
        alignItems: "center",
    },
    ratingOptionPoor: {
        backgroundColor: "#ff4d4d",
        borderColor: "#ff4d4d",
    },
    ratingOptionFair: {
        backgroundColor: "#ffcc00",
        borderColor: "#ffcc00",
    },
    ratingOptionGood: {
        backgroundColor: "#0FA37F",
        borderColor: "#0FA37F",
    },
    ratingOptionText: {
        fontSize: 12,
        fontWeight: "500",
    },
    ratingOptionTextSelected: {
        color: "#fff",
    },
    paginationContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 15,
        marginTop: 10,
        marginBottom: 10,
    },
    paginationButton: {
        paddingVertical: 12,
        paddingHorizontal: 20,
        backgroundColor: "#0FA37F",
        borderRadius: 8,
        minWidth: 80,
        alignItems: 'center',
    },
    paginationButtonDisabled: {
        backgroundColor: "#ccc",
    },
    paginationButtonText: {
        color: "#fff",
        fontWeight: "600",
        fontSize: 14,
    },
    paginationInfo: {
        color: "#666",
        fontWeight: "500",
        fontSize: 14,
    },
    submitSection: {
        backgroundColor: "#fff",
        marginHorizontal: 12,
        marginTop: 8,
        padding: 15,
        borderRadius: 12,
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 4,
        elevation: 2,
        marginBottom: 20,
    },
    summaryTitle: {
        fontSize: 16,
        fontWeight: "bold",
        textAlign: "center",
        marginBottom: 10,
    },
    summaryScore: {
        fontSize: 24,
        fontWeight: "bold",
        color: "#0FA37F",
        textAlign: "center",
        marginBottom: 5,
    },
    summaryPercentage: {
        fontSize: 14,
        color: "#666",
        textAlign: "center",
        marginBottom: 15,
    },
    submitButton: {
        backgroundColor: "#0FA37F",
        padding: 15,
        borderRadius: 8,
        alignItems: "center",
    },
    submitButtonDisabled: {
        backgroundColor: "#ccc",
    },
    submitButtonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "bold",
    },
    bottomSpacer: {
        height: 100,
    },
    noDataText: {
        fontSize: 16,
        textAlign: "center",
        color: "#666",
        marginBottom: 8,
    },
    noDataSubtext: {
        fontSize: 14,
        textAlign: "center",
        color: "#999",
    },
});

export default MaintenanceRatingScreen;