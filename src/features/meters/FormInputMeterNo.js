import { CameraView, useCameraPermissions } from "expo-camera";
import { getIn, useFormikContext } from "formik";
import { useState } from "react";
import { Alert, Keyboard, StyleSheet, View } from "react-native";
import {
  Button,
  IconButton,
  Modal,
  Portal,
  Text,
  TextInput,
} from "react-native-paper";
import { useWarehouse } from "../../context/WarehouseContext";

const FormInputMeterNo = ({ label, name, disabled, onCameraPress }) => {
  const { setFieldValue, values } = useFormikContext();
  const { all } = useWarehouse();

  const [scannerVisible, setScannerVisible] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();

  // Get current value to determine icon state
  const currentValue = getIn(values, name);

  const validateMeterNo = (val) => {
    const cleanedVal = val.trim().toUpperCase();
    setFieldValue(name, cleanedVal);

    if (cleanedVal.length > 3) {
      const duplicate =
        (all?.meters || []).find((m) => m.meterNo === cleanedVal) ||
        (all?.prems || []).find(
          (p) =>
            p.ast?.astData?.astNo === cleanedVal ||
            p.services?.waterMeterNo === cleanedVal ||
            p.services?.electricityMeterNo === cleanedVal,
        );

      if (duplicate) {
        Alert.alert(
          "🚨 DUPLICATE METER DETECTED",
          `Meter [${cleanedVal}] is already linked to:\n📍 ${duplicate.address?.strNo || ""} ${duplicate.address?.StrName || ""}`,
          [
            {
              text: "I WILL FIX IT",
              style: "destructive",
              onPress: () => setFieldValue(name, ""),
            },
          ],
        );
      }
    }
  };

  const handleOpenScanner = async () => {
    Keyboard.dismiss();
    if (!permission?.granted) {
      const { granted } = await requestPermission();
      if (!granted) return;
    }
    setScannerVisible(true);
  };

  // 🗑️ Clear Function
  const handleClear = () => {
    setFieldValue(name, "");
  };

  const onBarCodeScanned = ({ data }) => {
    setScannerVisible(false);
    validateMeterNo(data);
  };

  return (
    <View>
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <TextInput
            label={label}
            value={currentValue || ""}
            onChangeText={validateMeterNo}
            disabled={disabled}
            mode="outlined"
            autoCapitalize="characters"
          />
        </View>

        {/* 🔄 DYNAMIC ICON: SCAN vs DELETE */}
        <IconButton
          icon={currentValue ? "close-circle" : "barcode-scan"}
          mode="contained"
          containerColor={currentValue ? "#EF4444" : "#3B82F6"} // Red for delete, Blue for scan
          iconColor="white"
          onPress={currentValue ? handleClear : handleOpenScanner}
          disabled={disabled}
          style={styles.inlineBtn}
        />
      </View>

      {/* PORTAL SCANNER MODAL */}
      <Portal>
        <Modal
          visible={scannerVisible}
          onDismiss={() => setScannerVisible(false)}
          contentContainerStyle={styles.modal}
        >
          <CameraView
            style={StyleSheet.absoluteFill}
            onBarcodeScanned={scannerVisible ? onBarCodeScanned : undefined}
          />
          <View style={styles.overlay}>
            <View style={styles.reticle} />
            <Text style={styles.scanText}>ALIGN METER BARCODE</Text>
          </View>
          <Button
            mode="contained"
            onPress={() => setScannerVisible(false)}
            style={styles.cancelBtn}
            buttonColor="red"
          >
            CANCEL
          </Button>
        </Modal>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 5 },
  inlineBtn: { margin: 0, height: 50, width: 50, borderRadius: 8 },
  modal: { flex: 1, backgroundColor: "blue" },
  overlay: { flex: 1, justifyContent: "center", alignItems: "center" },
  reticle: {
    width: 250,
    height: 150,
    borderWidth: 2,
    borderColor: "#00FF00",
    borderRadius: 10,
  },
  scanText: { color: "white", marginTop: 15, fontWeight: "bold" },
  cancelBtn: { position: "absolute", bottom: 40, alignSelf: "center" },
});

export default FormInputMeterNo;
