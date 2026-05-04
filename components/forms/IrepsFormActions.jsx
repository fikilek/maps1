import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export function IrepsFormActions({
  resetLabel = "RESET",
  submitLabel = "SUBMIT",
  onReset,
  onSubmit,
  canSubmit = false,
  loading = false,
  disabledReason = "",
}) {
  const isSubmitDisabled = !canSubmit || loading;

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <TouchableOpacity
          style={[
            styles.button,
            styles.resetButton,
            loading && styles.resetButtonDisabled,
          ]}
          onPress={onReset}
          disabled={loading}
          activeOpacity={0.82}
        >
          <Text
            style={[
              styles.resetButtonText,
              loading && styles.resetButtonTextDisabled,
            ]}
          >
            {resetLabel}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.button,
            styles.submitButton,
            !canSubmit && !loading && styles.submitButtonInvalid,
            canSubmit && !loading && styles.submitButtonReady,
            loading && styles.submitButtonLoading,
          ]}
          onPress={onSubmit}
          disabled={isSubmitDisabled}
          activeOpacity={0.86}
        >
          {loading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color="#7C2D12" size="small" />
              <Text style={styles.submitButtonLoadingText}>SUBMITTING</Text>
            </View>
          ) : (
            <Text
              style={[
                styles.submitButtonText,
                !canSubmit && styles.submitButtonInvalidText,
              ]}
            >
              {submitLabel}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: 12,
    marginTop: 8,
    marginBottom: 24,
  },

  row: {
    flexDirection: "row",
    gap: 12,
  },

  button: {
    minHeight: 50,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },

  resetButton: {
    flex: 0.8,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CBD5E1",
  },

  resetButtonDisabled: {
    backgroundColor: "#F8FAFC",
    borderColor: "#E2E8F0",
    opacity: 0.65,
  },

  resetButtonText: {
    color: "#475569",
    fontWeight: "900",
    fontSize: 12,
    letterSpacing: 0.4,
  },

  resetButtonTextDisabled: {
    color: "#94A3B8",
  },

  submitButton: {
    flex: 2,
  },

  submitButtonInvalid: {
    backgroundColor: "#94A3B8",
  },

  submitButtonReady: {
    backgroundColor: "#86EFAC",
  },

  submitButtonLoading: {
    backgroundColor: "#FDE047",
  },

  submitButtonText: {
    color: "#14532D",
    fontWeight: "900",
    fontSize: 12,
    letterSpacing: 0.4,
  },

  submitButtonInvalidText: {
    color: "#F8FAFC",
  },

  submitButtonLoadingText: {
    color: "#7C2D12",
    fontWeight: "900",
    fontSize: 12,
    letterSpacing: 0.4,
    marginLeft: 8,
  },

  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  disabledReason: {
    marginTop: 8,
    fontSize: 11,
    color: "#64748B",
    fontWeight: "700",
    textAlign: "right",
  },
});
