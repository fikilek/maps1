import { useFormikContext } from "formik";
import FormSelect from "./FormSelect"; // Import the generic base

export const AnomalySelect = ({ anomalies, disabled }) => {
  const { setFieldValue } = useFormikContext();

  const handleAnomalyChange = (val) => {
    // 1. Set the Parent value
    setFieldValue("ast.anomalies.anomaly", val);

    // 2. 🧹 THE SURGICAL RESET (The reason this component exists)
    console.log("🧹 [ANOMALY SYSTEM]: Resetting detail dependency.");
    setFieldValue("ast.anomalies.anomalyDetail", "");
  };

  return (
    <FormSelect
      label="ANOMALY"
      name="ast.anomalies.anomaly"
      options={anomalies.map((a) => a.anomaly)}
      disabled={disabled}
      onValueChange={handleAnomalyChange} // 🎯 This is the new bridge
    />
  );
};
