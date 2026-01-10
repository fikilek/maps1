import { Marker } from "react-native-maps";

export default function PremiseLayer({ premises, onSelectPremise }) {
  return (
    <>
      {premises.map((premise) => {
        const [lng, lat] = premise.geometry?.centroid || [];
        if (!lat || !lng) return null;

        return (
          <Marker
            key={premise.premiseId}
            coordinate={{
              latitude: lat,
              longitude: lng,
            }}
            title={premise.identity?.label}
            description={`${premise.address.streetNumber} ${premise.address.streetName}`}
            onPress={() => onSelectPremise(premise.premiseId)}
          />
        );
      })}
    </>
  );
}
