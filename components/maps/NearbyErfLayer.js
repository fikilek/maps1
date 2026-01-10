import { Marker } from "react-native-maps";

export default function NearbyErfLayer({ erfs }) {
  return (
    <>
      {erfs.map((erf) => (
        <Marker
          key={erf.id}
          coordinate={{
            latitude: erf.centroid.lat,
            longitude: erf.centroid.lng,
          }}
          anchor={{ x: 0.5, y: 0.5 }}
        >
          {/* simple dot */}
          <svg width="6" height="6">
            <circle cx="3" cy="3" r="3" fill="#2563eb" />
          </svg>
        </Marker>
      ))}
    </>
  );
}
