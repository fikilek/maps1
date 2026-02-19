import { View } from "react-native";
import FormInputMeterNo from "../../src/features/meters/FormInputMeterNo";
import SovereignLocationPicker from "../maps/SovereignLocationPicker";
import { IrepsMedia } from "../media/IrepsMedia";
import { AnomalySection } from "./AnomalySection";
import FormInput from "./FormInput";
import { FormSection } from "./FormSection";
import FormSelect from "./FormSelect";

export const WaterSections = ({
  values,
  setFieldValue,
  getOptions,
  disabled,
  agentName,
  agentUid,
  errors,
  setShowMapPicker, // 🛰️ Passed from parent
  erfBoundary = [],
  erfNo = "",
  erfCentroid = null,
  landingPoint,
  icon,
}) => {
  return (
    <View style={disabled && { opacity: 0.7 }}>
      <FormSection title="Water Meter Description">
        <FormInputMeterNo
          label="Meter Number"
          name="ast.astData.astNo"
          disabled={disabled}
        />
        <IrepsMedia
          tag={"astNoPhoto"}
          agentName={agentName}
          agentUid={agentUid}
        />

        <FormSelect
          label="Category (Normal/Bulk)"
          options={["Normal", "Bulk"]}
          name="ast.astData.meter.category"
          disabled={disabled}
        />
        <FormSelect
          label="Manufacture"
          options={getOptions("water_manufacturers")}
          name="ast.astData.astManufacturer"
          disabled={disabled}
        />
        <FormInput
          label="Model Name"
          name="ast.astData.astName"
          disabled={disabled}
        />
      </FormSection>

      <FormSection title="Meter Reading">
        <FormInput
          label="Meter Reading"
          name="ast.meterReading"
          disabled={disabled}
        />

        {values?.ast?.meterReading && (
          <IrepsMedia
            tag={"meterReadingPhoto"}
            agentName={agentName}
            agentUid={agentUid}
          />
        )}
      </FormSection>

      <AnomalySection
        values={values}
        getOptions={getOptions}
        agentName={agentName}
        agentUid={agentUid}
        setFieldValue={setFieldValue}
      />

      <SovereignLocationPicker
        label="METER GPS LOCATION"
        name="ast.location.gps"
        initialGps={landingPoint}
        icon={icon}
        referenceBoundary={erfBoundary}
        erfNo={erfNo}
        erfCentroid={erfCentroid}
      />
    </View>
  );
};
