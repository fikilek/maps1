import { getIn, useFormikContext } from "formik";
import { useEffect, useRef } from "react";
import FormSelect from "./FormSelect";

export const AnomalyDetailSelect = ({ anomalies, disabled }) => {
  const { values, setFieldValue } = useFormikContext();

  const currentAnomaly = getIn(values, "ast.anomalies.anomaly");
  const currentDetail = getIn(values, "ast.anomalies.anomalyDetail");

  const previousAnomaly = useRef(currentAnomaly);

  useEffect(() => {
    if (previousAnomaly.current && currentAnomaly !== previousAnomaly.current) {
      setTimeout(() => {
        if (currentAnomaly === "Meter Ok") {
          setFieldValue("ast.anomalies.anomalyDetail", "Operationally OK");
        } else {
          setFieldValue("ast.anomalies.anomalyDetail", "");
        }
      }, 0);
    }

    previousAnomaly.current = currentAnomaly;
  }, [currentAnomaly]);

  const selectedAnomalyData = anomalies.find(
    (a) => a.anomaly === currentAnomaly,
  );

  const options = selectedAnomalyData?.anomalyDetails || [];

  return (
    <FormSelect
      label="ANOMALY DETAIL"
      name="ast.anomalies.anomalyDetail"
      options={options}
      disabled={disabled || currentAnomaly === "Meter Ok"}
    />
  );
};
