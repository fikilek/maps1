import { getIn, useFormikContext } from "formik";
import { useEffect, useRef } from "react";
import FormSelect from "./FormSelect";

export const AnomalyDetailSelect = ({ anomalies, disabled }) => {
  const { values, setFieldValue } = useFormikContext();

  const currentAnomaly = getIn(values, "ast.anomalies.anomaly");
  const previousAnomaly = useRef(currentAnomaly);

  useEffect(() => {
    // 🏛️ THE SOVEREIGN WATCHER
    if (previousAnomaly.current && currentAnomaly !== previousAnomaly.current) {
      // ⏳ THE DELAYED SCRUB:
      // We wait for the next tick to ensure the parent update is complete.
      setTimeout(() => {
        console.log("🧹 [FORENSIC RESET]: Clearing stale details.");
        setFieldValue("ast.anomalies.anomalyDetail", "");
      }, 0);
    }
    previousAnomaly.current = currentAnomaly;
  }, [currentAnomaly]); // 🎯 Removed setFieldValue from deps to prevent unnecessary loops

  const selectedAnomalyData = anomalies.find(
    (a) => a.anomaly === currentAnomaly,
  );
  const options = selectedAnomalyData?.anomalyDetails || [];

  // 🛡️ HIDE COMPLETELY IF "METER OK"
  // If the meter is fine, we don't even show this field to the agent.
  if (!currentAnomaly || currentAnomaly === "Meter Ok") return null;

  return (
    <FormSelect
      label="ANOMALY DETAIL"
      name="ast.anomalies.anomalyDetail"
      options={options}
      disabled={disabled}
    />
  );
};

// import { getIn, useFormikContext } from "formik";
// import { useEffect, useRef } from "react";
// import FormSelect from "./FormSelect"; // Uses the generic base

// export const AnomalyDetailSelect = ({ anomalies, disabled }) => {
//   const { values, setFieldValue } = useFormikContext();

//   // 🎯 1. Track the parent's current state
//   const currentAnomaly = getIn(values, "ast.anomalies.anomaly");
//   const previousAnomaly = useRef(currentAnomaly);

//   // 🎯 2. The Watcher: If parent changes, I reset myself
//   useEffect(() => {
//     if (previousAnomaly.current && currentAnomaly !== previousAnomaly.current) {
//       console.log("🧹 [SELF-RESET]: Anomaly changed. Clearing Detail.");
//       setFieldValue("ast.anomalies.anomalyDetail", "");
//     }
//     previousAnomaly.current = currentAnomaly;
//   }, [currentAnomaly, setFieldValue]);

//   // 🎯 3. Find my specific options based on the parent
//   const selectedAnomalyData = anomalies.find(
//     (a) => a.anomaly === currentAnomaly,
//   );
//   const options = selectedAnomalyData?.anomalyDetails || [];

//   return (
//     <FormSelect
//       label="Anomaly Detail"
//       name="ast.anomalies.anomalyDetail"
//       options={options}
//       disabled={disabled || !currentAnomaly}
//       placeholder={
//         !currentAnomaly ? "Select Anomaly First..." : "Select Detail..."
//       }
//     />
//   );
// };
