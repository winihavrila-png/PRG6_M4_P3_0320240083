import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useContext,
} from 'react';
import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { MaterialIcons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';

const HomeScreen = ({ navigation }) => {

  // Ambil userData DAN logout dari Context
  const { userData, logout } = useContext(AuthContext);

  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [currentTime, setCurrentTime] = useState('Memuat jam...');
  const [note, setNote] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const noteInputRef = useRef(null);

  // ── TAMBAHAN W7: State untuk QR Scanner ──────────────────────────────────
  const [permission, requestPermission] = useCameraPermissions();
  const [scannedData, setScannedData] = useState(null);       // data hasil scan QR
  const [isScanning, setIsScanning] = useState(true);         // kunci agar tidak scan berulang
  const [showCamera, setShowCamera] = useState(false);        // toggle tampil kamera
  // ─────────────────────────────────────────────────────────────────────────

  const attendanceStats = useMemo(() => {
    return { totalPresent: 12, totalAbsent: 2 };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('id-ID', { hour12: false }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // ── TAMBAHAN W7: Handler saat QR Code terdeteksi kamera ──────────────────
  const handleBarCodeScanned = ({ type, data }) => {
    // Jika sedang terkunci, abaikan scan agar tidak looping
    if (!isScanning) return;

    // Kunci scanner
    setIsScanning(false);

    try {
      // Ubah teks JSON dari QR Code menjadi Objek JavaScript
      const qrData = JSON.parse(data);
      setScannedData(qrData);

      Alert.alert(
        "QR Code Terdeteksi",
        `Mata Kuliah: ${qrData.kodeMk}\nPertemuan: ${qrData.pertemuanKe}\nRuangan: ${qrData.ruangan}\n\nLanjutkan Presensi (Check-In)?`,
        [
          {
            text: "Batal",
            onPress: () => {
              // Reset jika batal
              setIsScanning(true);
              setScannedData(null);
            },
            style: "cancel"
          },
          {
            text: "Ya, Check In",
            // Lemparkan objek hasil parse ke fungsi submit
            onPress: () => handleSubmitPresensi(qrData)
          },
        ]
      );
    } catch (error) {
      // Handle jika QR Code yang di-scan bukan format JSON (misal salah scan QR Link biasa)
      Alert.alert("QR Tidak Valid", "Pastikan Anda memindai QR Code Presensi Dosen.");
      setIsScanning(true);
    }
  };
  // ─────────────────────────────────────────────────────────────────────────

  // ── TAMBAHAN W7: Fungsi kirim data ke API menggunakan data dari QR ────────
  const handleSubmitPresensi = async (qrData) => {
    if (isCheckedIn) return Alert.alert("Perhatian", "Anda sudah Check In.");

    setIsPosting(true);
    setShowCamera(false);

    // Payload dinamis mengambil nilai dari objek qrData
    const payload = {
      kodeMk: qrData.kodeMk,
      nimMhs: userData.mhsNim,         // Ambil NIM dari Context (login)
      pertemuanKe: qrData.pertemuanKe,
      date: new Date().toISOString().split('T')[0],
      jamPresensi: new Date().toLocaleTimeString('en-GB'),
      status: "Present",
      ruangan: qrData.ruangan
    };

    try {
      const response = await fetch("http://10.1.10.131:8080/api/presensi", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (response.ok) {
        setIsCheckedIn(true);
        Alert.alert("Berhasil!", "Presensi sukses dicatat ke Database.", [
          { text: "Lihat Riwayat", onPress: () => navigation.navigate('HistoryTab') }
        ]);
      } else {
        Alert.alert("Gagal", result.message || "Terjadi kesalahan di server.");
      }
    } catch (error) {
      Alert.alert("Error Jaringan", "Pastikan IP Laptop benar dan API berjalan.");
      console.error(error);
    } finally {
      // Reset state agar siap untuk presensi selanjutnya
      setIsPosting(false);
      setIsScanning(true);
      setScannedData(null);
    }
  };
  // ─────────────────────────────────────────────────────────────────────────

  // ── TAMBAHAN W7: Handler buka kamera (cek permission dulu) ───────────────
  const handleOpenCamera = async () => {
    if (!permission || !permission.granted) {
      await requestPermission();
    }
    setIsScanning(true);
    setShowCamera(true);
  };
  // ─────────────────────────────────────────────────────────────────────────

  // ── TAMBAHAN W7: Render layar kamera fullscreen jika showCamera = true ───
  if (showCamera) {
    // Jika permission masih loading
    if (!permission) {
      return (
        <View style={styles.container}>
          <Text style={styles.infoText}>Memuat perizinan kamera...</Text>
        </View>
      );
    }
    // Jika user belum memberikan izin atau menolak
    if (!permission.granted) {
      return (
        <View style={styles.container}>
          <Text style={styles.infoText}>
            Aplikasi butuh akses kamera untuk memindai QR Code Presensi Dosen!
          </Text>
          <TouchableOpacity style={styles.buttonRequest} onPress={requestPermission}>
            <Text style={styles.buttonText}>Aktifkan Kamera</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // Render CameraView fullscreen dengan overlay kotak pemandu
    return (
      <View style={{ flex: 1, backgroundColor: 'black' }}>
        <CameraView
          style={StyleSheet.absoluteFillObject}
          facing="back"
          onBarcodeScanned={isScanning ? handleBarCodeScanned : undefined}
          barcodeScannerSettings={{
            barcodeTypes: ["qr"], // Batasi HANYA memindai QR Code agar lebih cepat
          }}
        >
          {/* Desain Overlay Kotak Pemandu di tengah layar */}
          <View style={styles.overlay}>
            <View style={styles.unfocusedContainer} />
            <View style={styles.focusedContainer}>
              <View style={styles.borderCornerTopLeft} />
              <View style={styles.borderCornerTopRight} />
              <View style={styles.borderCornerBottomLeft} />
              <View style={styles.borderCornerBottomRight} />
            </View>
            <View style={styles.unfocusedContainer}>
              <Text style={styles.scanText}>Arahkan Kamera ke QR Code Dosen</Text>

              {/* Tombol darurat jika scanner terkunci */}
              {!isScanning && (
                <TouchableOpacity
                  style={[styles.buttonRequest, { marginTop: 12 }]}
                  onPress={() => setIsScanning(true)}
                >
                  <Text style={styles.buttonText}>Scan Lagi</Text>
                </TouchableOpacity>
              )}

              {/* Tombol kembali ke HomeScreen */}
              <TouchableOpacity
                style={[styles.buttonRequest, { marginTop: 12, backgroundColor: '#d9534f' }]}
                onPress={() => setShowCamera(false)}
              >
                <Text style={styles.buttonText}>Batal / Kembali</Text>
              </TouchableOpacity>
            </View>
          </View>
        </CameraView>
      </View>
    );
  }
  // ─────────────────────────────────────────────────────────────────────────

  // ── UI UTAMA (struktur asli dipertahankan) ────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>

        {/* Header Row — tambahin tombol Logout */}
        <View style={styles.headerRow}>
          <Text style={styles.title}>Attendance App</Text>
          <Text style={styles.clockText}>{currentTime}</Text>
          <TouchableOpacity onPress={logout} style={styles.logoutButton}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        {/* Student Card */}
        <View style={styles.card}>
          <View style={styles.icon}>
            <MaterialIcons name="person" size={40} color="#555" />
          </View>
          <View>
            <Text style={styles.name}>{userData?.mhsName}</Text>
            <Text>NIM : {userData?.mhsNim}</Text>
            <Text>Class : Informatika-2B</Text>
          </View>
        </View>

        {/* Today's Class */}
        <View style={styles.classCard}>
          <Text style={styles.subtitle}>Today's Class</Text>
          <Text>Mobile Programming (TRPL205)</Text>
          <Text>08:00 - 10:00</Text>
          <Text>Lab 3</Text>

          {/* ── TAMBAHAN W7: Tombol Scan QR & status Check In ── */}
          {isPosting ? (
            <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 15 }} />
          ) : isCheckedIn ? (
            <TouchableOpacity
              style={[styles.button, styles.buttonDisabled]}
              disabled={true}
            >
              <Text style={styles.buttonText}>✓ CHECKED IN</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.button, styles.buttonActive]}
              onPress={handleOpenCamera}
            >
              <MaterialIcons name="qr-code-scanner" size={20} color="white" />
              <Text style={[styles.buttonText, { marginLeft: 8 }]}>
                SCAN QR CODE DOSEN
              </Text>
            </TouchableOpacity>
          )}
          {/* ─────────────────────────────────────────────────── */}
        </View>

        {/* Stats Card */}
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

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  // ── Styles asli ───────────────────────────────────────────────────────────
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  content: { padding: 20 },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: { fontSize: 20, fontWeight: 'bold', color: '#0056A0' },
  clockText: { fontSize: 16, color: '#555' },
  logoutButton: {
    marginLeft: 12,
    backgroundColor: '#d9534f',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  logoutText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 10,
    marginBottom: 16,
    elevation: 2,
  },
  icon: { marginRight: 12 },
  name: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  classCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 10,
    marginBottom: 16,
    elevation: 2,
  },
  subtitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 6, color: '#333' },
  inputCatatan: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    marginTop: 12,
    fontSize: 14,
  },
  button: {
    flexDirection: 'row',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  buttonActive: { backgroundColor: '#0056A0' },
  buttonDisabled: { backgroundColor: '#aaa' },
  buttonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  statsCard: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 10,
    elevation: 2,
  },
  statBox: { alignItems: 'center' },
  statNumber: { fontSize: 28, fontWeight: 'bold', color: '#0056A0' },
  statLabel: { fontSize: 13, color: '#666' },

  // ── Styles TAMBAHAN W7: Scanner & Overlay ────────────────────────────────
  infoText: {
    color: 'white',
    textAlign: 'center',
    margin: 30,
    fontSize: 16,
  },
  buttonRequest: {
    backgroundColor: '#0056A0',
    padding: 15,
    borderRadius: 10,
    alignSelf: 'center',
  },
  // Styling Overlay Scanner
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)', // Latar gelap transparan
  },
  unfocusedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  focusedContainer: {
    width: 250,
    height: 250,
    alignSelf: 'center',
    backgroundColor: 'transparent',
    position: 'relative',
  },
  scanText: {
    color: 'white',
    fontSize: 16,
    marginTop: 20,
    fontWeight: 'bold',
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 10,
    borderRadius: 5,
  },
  // Membuat Sudut Kotak Biru
  borderCornerTopLeft: {
    position: 'absolute', top: 0, left: 0, width: 40, height: 40,
    borderTopWidth: 5, borderLeftWidth: 5, borderColor: '#007bff',
  },
  borderCornerTopRight: {
    position: 'absolute', top: 0, right: 0, width: 40, height: 40,
    borderTopWidth: 5, borderRightWidth: 5, borderColor: '#007bff',
  },
  borderCornerBottomLeft: {
    position: 'absolute', bottom: 0, left: 0, width: 40, height: 40,
    borderBottomWidth: 5, borderLeftWidth: 5, borderColor: '#007bff',
  },
  borderCornerBottomRight: {
    position: 'absolute', bottom: 0, right: 0, width: 40, height: 40,
    borderBottomWidth: 5, borderRightWidth: 5, borderColor: '#007bff',
  },
});

export default HomeScreen;