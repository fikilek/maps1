import { Picker } from "@react-native-picker/picker";
import { useEffect, useState } from "react";
import { Text, View } from "react-native";

import {
  useGetCountriesQuery,
  useGetDistrictsQuery,
  useGetLocalMunicipalitiesQuery,
  useGetProvincesQuery,
  useGetTownsQuery,
  useGetWardsQuery,
} from "../src/redux/geoApi";

/**
 * CascadingSelect
 *
 * Props:
 * - initialLocalMunicipalityId (string | null)
 * - onChange (function)
 * - disabled (boolean)
 */
const CascadingSelect = ({
  initialLocalMunicipalityId = null,
  onChange,
  disabled = false,
}) => {
  /* =========================
     LOCAL SELECTION STATE
  ========================= */
  const [countryId, setCountryId] = useState(null);
  const [provinceId, setProvinceId] = useState(null);
  const [districtId, setDistrictId] = useState(null);
  const [localMunicipalityId, setLocalMunicipalityId] = useState(null);
  const [townId, setTownId] = useState(null);
  const [wardId, setWardId] = useState(null);

  /* =========================
     RTK QUERY DATA (CACHE)
  ========================= */
  const { data: countries = [] } = useGetCountriesQuery();

  const { data: provinces = [] } = useGetProvincesQuery(countryId, {
    skip: !countryId,
  });

  const { data: districts = [] } = useGetDistrictsQuery(provinceId, {
    skip: !provinceId,
  });

  const { data: localMunicipalities = [] } = useGetLocalMunicipalitiesQuery(
    districtId,
    { skip: !districtId }
  );

  const { data: towns = [] } = useGetTownsQuery(localMunicipalityId, {
    skip: !localMunicipalityId,
  });

  const { data: wards = [] } = useGetWardsQuery(townId, { skip: !townId });

  /* =========================
     AUTO-FILL PARENTS
     (FROM LOCAL MUNICIPALITY)
  ========================= */
  useEffect(() => {
    if (!initialLocalMunicipalityId) return;

    // 1️⃣ Find LM (from ANY cached list)
    const lm =
      localMunicipalities.find((l) => l.id === initialLocalMunicipalityId) ||
      null;

    if (!lm) return;

    // 2️⃣ Find District
    const district = districts.find((d) => d.id === lm.districtId) || null;

    if (!district) return;

    // 3️⃣ Find Province
    const province =
      provinces.find((p) => p.id === district.provinceId) || null;

    if (!province) return;

    // 4️⃣ Find Country
    const country = countries.find((c) => c.id === province.countryId) || null;

    if (!country) return;

    // 🔥 SET FROM TOP → DOWN (VERY IMPORTANT)
    setCountryId(country.id);
    setProvinceId(province.id);
    setDistrictId(district.id);
    setLocalMunicipalityId(lm.id);
  }, [
    initialLocalMunicipalityId,
    countries,
    provinces,
    districts,
    localMunicipalities,
  ]);

  /* =========================
     CHILD RESET LOGIC 🔥
  ========================= */

  // Country → reset everything below
  useEffect(() => {
    setProvinceId(null);
    setDistrictId(null);
    setLocalMunicipalityId(null);
    setTownId(null);
    setWardId(null);
  }, [countryId]);

  // Province → reset below
  useEffect(() => {
    setDistrictId(null);
    setLocalMunicipalityId(null);
    setTownId(null);
    setWardId(null);
  }, [provinceId]);

  // District → reset below
  useEffect(() => {
    setLocalMunicipalityId(null);
    setTownId(null);
    setWardId(null);
  }, [districtId]);

  // Local Municipality → reset below
  useEffect(() => {
    setTownId(null);
    setWardId(null);
  }, [localMunicipalityId]);

  // Town → reset ward
  useEffect(() => {
    setWardId(null);
  }, [townId]);

  /* =========================
     EMIT SELECTION
  ========================= */
  useEffect(() => {
    onChange?.({
      countryId,
      provinceId,
      districtId,
      localMunicipalityId,
      townId,
      wardId,
    });
  }, [countryId, provinceId, districtId, localMunicipalityId, townId, wardId]);

  /* =========================
     RENDER PICKER HELPER
  ========================= */
  const renderPicker = (label, value, onChange, items, enabled = true) => (
    <View
      style={{
        marginBottom: 12,
        opacity: enabled ? 1 : 0.5,
        flexDirection: "row",
      }}
    >
      <Text style={{ marginBottom: 4 }}>{label}</Text>
      <Picker
        selectedValue={value}
        enabled={enabled && !disabled}
        onValueChange={onChange}
      >
        <Picker.Item label="Select…" value={null} />
        {items.map((item) => (
          <Picker.Item key={item.id} label={item.name} value={item.id} />
        ))}
      </Picker>
    </View>
  );

  /* =========================
     RENDER
  ========================= */
  return (
    <View>
      {renderPicker("Country", countryId, setCountryId, countries, true)}

      {renderPicker(
        "Province",
        provinceId,
        setProvinceId,
        provinces,
        !!countryId
      )}

      {renderPicker(
        "District Municipality",
        districtId,
        setDistrictId,
        districts,
        !!provinceId
      )}

      {renderPicker(
        "Local Municipality",
        localMunicipalityId,
        setLocalMunicipalityId,
        localMunicipalities,
        !!districtId
      )}

      {renderPicker("Town", townId, setTownId, towns, !!localMunicipalityId)}

      {renderPicker("Ward", wardId, setWardId, wards, !!townId)}
    </View>
  );
};

export default CascadingSelect;
