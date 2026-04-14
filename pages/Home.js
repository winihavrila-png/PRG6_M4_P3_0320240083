import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Alert,
  TextInput
} from "react-native";

import { MaterialIcons } from "@expo/vector-icons";

// Data awal (Initial State) - dipindah ke atas sebelum komponen
const initialHistory = [
  { id: "1", course: "Mobile Programming", date: "10 Mar 2026", status: "Present" },
  { id: "2", course: "Database Systems", date: "9 Mar 2026", status: "Absent" },
  { id: "3", course: "Web Programming", date: "8 Mar 2026", status: "Present" },
  { id: "4", course: "Data Structures", date: "7 Mar 2026", status: "Present" },
  { id: "5", course: "Operating Systems", date: "6 Mar 2026", status: "Absent" },
  { id: "6", course: "Computer Networks", date: "5 Mar 2026", status: "Present" },
  { id: "7", course: "Artificial Intelligence", date: "4 Mar 2026", status: "Present" },
  { id: "8", course: "Software Engineering", date: "3 Mar 2026", status: "Absent" },
  { id: "9", course: "Human Computer Interaction", date: "2 Mar 2026", status: "Present" },
  { id: "10", course: "Cloud Computing", date: "1 Mar 2026", status: "Present" },
  { id: "11", course: "Cyber Security", date: "28 Feb 2026", status: "Absent" },
  { id: "12", course: "Data Mining", date: "27 Feb 2026", status: "Present" },
  { id: "13", course: "Machine Learning", date: "26 Feb 2026", status: "Present" },
  { id: "14", course: "Web Programming", date: "25 Feb 2026", status: "Absent" },
  { id: "15", course: "Mobile Programming", date: "24 Feb 2026", status: "Present" },
  { id: "16", course: "Database Systems", date: "23 Feb 2026", status: "Present" },
  { id: "17", course: "Computer Networks", date: "22 Feb 2026", status: "Absent" },
  { id: "18", course: "Operating Systems", date: "21 Feb 2026", status: "Present" },
  { id: "19", course: "Software Engineering", date: "20 Feb 2026", status: "Present" },
  { id: "20", course: "Artificial Intelligence", date: "19 Feb 2026", status: "Absent" },
  { id: "21", course: "Cloud Computing", date: "18 Feb 2026", status: "Present" },
  { id: "22", course: "Data Structures", date: "17 Feb 2026", status: "Present" },
];

export default function Home() {

  // 1. STATE UNTUK RIWAYAT PRESENSI
  const [historyData, setHistoryData] = useState(initialHistory);

  // 2. STATE UNTUK STATUS TOMBOL CHECK-IN
  const [isCheckedIn, setIsCheckedIn] = useState(false);

  // 3. STATE UNTUK JAM DIGITAL
  const [currentTime, setCurrentTime] = useState('Memuat jam...');

  // 4. STATE & REF UNTUK CATATAN (Baru)
  const [note, setNote] = useState('');
  const noteInputRef = useRef(null); // Membuat "kait" kosong untuk UI

  // useEffect untuk Jam Real-time
  useEffect(() => {
    // Jalankan timer setiap 1000 milidetik (1 detik)
    const timer = setInterval(() => {
      const timeString = new Date().toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
      setCurrentTime(timeString);
    }, 1000);

    // CLEANUP: Matikan timer jika layar ditutup
    return () => clearInterval(timer);
  }, []); // Array kosong [] artinya jalankan hanya satu kali saat awal dibuka

  // 5. OPTIMASI KOMPUTASI DENGAN useMemo
  const attendanceStats = useMemo(() => {
    // Teks ini hanya akan tercetak di terminal HANYA jika historyData bertambah,
    // BUKAN setiap detik saat jam berubah!
    console.log("Menghitung ulang statistik kehadiran...");

    const presentCount = historyData.filter((item) => item.status === 'Present').length;
    const absentCount = historyData.filter((item) => item.status === 'Absent').length;

    return { totalPresent: presentCount, totalAbsent: absentCount };
  }, [historyData]); // <-- Dependencies: Hanya hitung ulang kalau 'historyData' berubah

  // FUNGSI LOGIKA ABSEN (Diperbarui)
  const handleCheckIn = () => {
    if (isCheckedIn) {
      Alert.alert('Perhatian', 'Anda sudah melakukan Check In.');
      return;
    }

    // Validasi Catatan menggunakan useRef
    if (note.trim() === '') {
      Alert.alert('Peringatan', 'Catatan kehadiran wajib diisi!');
      noteInputRef.current.focus(); // <-- Sihir useRef: Memaksa kursor pindah ke input
      return;
    }

    const newAttendance = {
      id: Date.now().toString(),
      course: "Mobile Programming",
      date: new Date().toLocaleDateString('id-ID'),
      status: "Present",
      // Anda juga bisa menambahkan properti catatan ke objek jika ingin ditampilkan
    };

    setHistoryData(value => [newAttendance, ...value]);
    setIsCheckedIn(true);
    Alert.alert('Sukses', `Berhasil Check In pada pukul ${currentTime}`);
  };

  // renderItem sama seperti kode W2
  const renderItem = ({ item }) => {
    return (
      <View style={styles.historyCard}>
        <View>
          <Text style={styles.course}>{item.course}</Text>
          <Text style={styles.date}>{item.date}</Text>
        </View>

        <View style={styles.statusContainer}>
          {item.status === "Present" ? (
            <MaterialIcons name="check-circle" size={20} color="green" />
          ) : (
            <MaterialIcons name="cancel" size={20} color="red" />
          )}
          <Text
            style={[
              styles.status,
              { color: item.status === "Present" ? "green" : "red" },
            ]}
          >
            {item.status}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>

        {/* Header Row dengan Jam Digital */}
        <View style={styles.headerRow}>
          <Text style={styles.title}>Attendance App</Text>
          {/* Tampilkan State Jam Digital */}
          <Text style={styles.clockText}>{currentTime}</Text>
        </View>

        {/* Student Card */}
        <View style={styles.card}>
          <View style={styles.profileRow}>
            <View style={styles.avatar}>
              <MaterialIcons name="person" size={40} color="#666" />
            </View>
            <View>
              <Text style={styles.name}>Yana Winih Avrila</Text>
              <Text style={styles.info}>NIM   : 0320240083</Text>
              <Text style={styles.info}>Class : Manajemen Informatika</Text>
            </View>
          </View>
        </View>

        {/* Today's Class */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Today's Class</Text>
          <Text>Mobile Programming</Text>
          <Text>08:00 - 10:00</Text>
          <Text>Lab 3</Text>

          {/* Fitur Baru: Kolom Input Catatan dengan useRef */}
          {!isCheckedIn && (
            <TextInput
              ref={noteInputRef} // <-- Menempelkan referensi ke elemen ini
              style={styles.inputCatatan}
              placeholder="Tulis catatan (cth: Hadir lab)"
              value={note}
              onChangeText={setNote}
            />
          )}

          {/* Tombol Check In */}
          <TouchableOpacity
            style={[styles.button, isCheckedIn ? styles.buttonDisabled : styles.buttonActive]}
            onPress={handleCheckIn}
            disabled={isCheckedIn} // Matikan fungsi klik jika sudah absen
          >
            <Text style={styles.buttonText}>
              {isCheckedIn ? "CHECKED IN" : "CHECK IN"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Fitur Baru: Statistik Kehadiran (Hasil useMemo) */}
        <View style={styles.statsCard}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{attendanceStats.totalPresent}</Text>
            <Text style={styles.statLabel}>Total Present</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statNumber, { color: 'red' }]}>{attendanceStats.totalAbsent}</Text>
            <Text style={styles.statLabel}>Total Absent</Text>
          </View>
        </View>

        {/* Attendance History */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Attendance History</Text>

          <FlatList
            data={historyData}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            scrollEnabled={false}
          />
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#0d3998",
  },

  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  clockText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
    fontVariant: ['tabular-nums'],
  },
  buttonActive: {
    backgroundColor: "#007AFF",
  },
  buttonDisabled: {
    backgroundColor: "#A0C4FF", // Warna lebih pucat saat disable
  },

  // Style dari W2 (tidak diubah)
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 20,
    color: "white",
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#e0e0e0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  card: {
    backgroundColor: "white",
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 3,
  },
  name: {
    fontSize: 18,
    fontWeight: "bold",
  },
  info: {
    color: "#555",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  button: {
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
    width: "100%",
    alignItems: "center"
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
  },
  historyCard: {
    backgroundColor: "white",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  course: {
    fontWeight: "bold",
  },
  date: {
    color: "gray",
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  status: {
    marginLeft: 5,
    fontWeight: "bold",
  },

  // Styling Baru (Langkah 6)
  inputCatatan: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    marginTop: 15,
    backgroundColor: '#fafafa',
  },
  statsCard: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: "white",
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  statBox: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'green',
  },
  statLabel: {
    fontSize: 14,
    color: 'gray',
  },
});