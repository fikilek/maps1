import { IrepsMedia } from "../media/IrepsMedia";
import { AnomalyDetailSelect } from "./AnomalyDetailSelect";
import { FormSection } from "./FormSection";
import FormSelect from "./FormSelect";

// 🛑 Stop relying on 'values' from props
export const AnomalySection = ({ getOptions, disabled, ...props }) => {
  // const { values } = useFormikContext(); // 🏛️ Real-time context access
  const anomalies = getOptions("anomalies") || [];

  return (
    <FormSection title="Anomalies & Actions">
      <FormSelect
        label="ANOMALY"
        name="ast.anomalies.anomaly"
        options={anomalies.map((a) => a.anomaly)}
        disabled={disabled}
      />

      {/* 🧠 Now this component sees the update INSTANTLY */}
      <AnomalyDetailSelect anomalies={anomalies} disabled={disabled} />

      {/* 📸 Media slot will now appear on the first click */}
      <IrepsMedia tag="anomalyPhoto" {...props} />
    </FormSection>
  );
};

// import { IrepsMedia } from "../media/IrepsMedia";
// import { AnomalyDetailSelect } from "./AnomalyDetailSelect";
// import { FormSection } from "./FormSection";
// import FormSelect from "./FormSelect";

// export const AnomalySection = ({ values, getOptions, disabled, ...props }) => {
//   const anomalies = getOptions("anomalies") || [];
//   // console.log(`anomalies`, anomalies);

//   return (
//     <FormSection title="Anomalies & Actions">
//       {/* 🏛️ GENERIC: Just sets the anomaly value */}
//       <FormSelect
//         label="ANOMALY"
//         name="ast.anomalies.anomaly"
//         options={anomalies.map((a) => a.anomaly)}
//         disabled={disabled}
//       />

//       {/* 🧠 SPECIALIZED: Observes the anomaly and resets itself */}
//       <AnomalyDetailSelect anomalies={anomalies} disabled={disabled} />

//       <IrepsMedia tag="anomalyPhoto" {...props} />
//     </FormSection>
//   );
// };
