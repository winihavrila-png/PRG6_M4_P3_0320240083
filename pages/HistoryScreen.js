import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator
} from "react-native";

import { MaterialIcons } from "@expo/vector-icons";
import { AuthContext } from "../context/AuthContext";
import { useFocusEffect } from "@react-navigation/native";

export default function HistoryScreen({ navigation }) {

  const { userData } = React.useContext(AuthContext);

  // 1. STATE UNTUK DATA & CONTROL
  const [historyData, setHistoryData] = useState([]); // Mulai dengan array kosong
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // pagination state
  const [page, setPage] = useState(10);
  const [isLastPage, setIsLastPage] = useState(false);

  const BASE_URL = "http://10.1.10.131:8080/api/presensi"; 

  // FUNGSI GET API DENGAN PAGINATION
    const fetchAttendanceData = async (targetPage = 0) => {
        if (isLoading || (isLastPage && targetPage !== 0)) return;

        setIsLoading(true);

        try {
            // Memanggil API Spring Boot
            const response = await fetch(`${BASE_URL}/history/${userData.mhsNim}?page=${targetPage}&size=10`);
            const json = await response.json();

            // Spring Boot Pageable menyimpan array di dalam properti 'content'
            const newItems = json.content;

            if (targetPage === 0) {
                setHistoryData(newItems); // Refresh halaman awal
            } else {
                setHistoryData(prev => [...prev, ...newItems]); // Append (Load More)
            }

            setPage(targetPage);
            setIsLastPage(json.last); // 'last' adalah boolean dari Spring Boot


        } catch (error) {
            console.error("Gagal Tarik data:", error);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    // Otomatis refresh saat Layar dibuka
    useFocusEffect(
        useCallback(() => {
            fetchAttendanceData(0);
        }, [])
    );

    const onRefresh = () => {
        setIsRefreshing(true);
        fetchAttendanceData(0);
    };

    const handleLoadMore = () => {
        if (!isLastPage && !isLoading) {
            fetchAttendanceData(page + 1);
        }
    };

    const renderItem = ({ item }) => (
        <TouchableOpacity
            style={styles.item}
            onPress={() => navigation.navigate("Detail", { dataPresensi: item })}
        >
            <View style={{ flex: 1 }}>
                <Text style={styles.course}>{item.course}</Text>
                <Text style={styles.date}>{item.date} | {item.jamPresensi}</Text>
            </View>
            <Text style={item.status === "Present" ? styles.present : styles.absent}>
                {item.status}
            </Text>
            <MaterialIcons name="chevron-right" size={24} color="#999" style={{marginLeft: 10}} />
        </TouchableOpacity>
    );

    const renderFooter = () => {
        if (!isLoading) return null;
        return (
            <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color="#0056A0" />
                <Text style={styles.loaderText}>Menarik data dari server...</Text>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <FlatList
                data={historyData}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderItem}
                contentContainerStyle={styles.content}
                refreshing={isRefreshing}
                onRefresh={onRefresh}
                onEndReached={handleLoadMore}
                onEndReachedThreshold={0.5}
                ListFooterComponent={renderFooter}
                ListEmptyComponent={
                    !isLoading && <Text style={styles.emptyText}>Tidak ada riwayat absensi.</Text>
                }
            />
        </SafeAreaView>
    );
};
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5F5" },

  content: { padding: 20 },

  item: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    elevation: 2
  },

  course: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333"
  },

  date: {
    fontSize: 12,
    color: "gray",
    marginTop: 4
  },

  present: {
    color: "green",
    fontWeight: "bold",
    marginRight: 5
  },

  absent: {
    color: "red",
    fontWeight: "bold",
    marginRight: 5
  },

  footerLoader: {
    paddingVertical: 20,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center"
  },

  loaderText: {
    marginLeft: 10,
    color: "#666",
    fontSize: 12
  },

  emptyText: {
    textAlign: "center",
    marginTop: 50,
    color: "#999"
  }
});