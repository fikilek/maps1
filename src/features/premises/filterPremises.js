function getNoAccessCount(item = {}) {
  return Array.isArray(item?.metadata?.noAccessTrnIds)
    ? item.metadata.noAccessTrnIds.length
    : 0;
}

function getGeofenceIds(item = {}) {
  return Array.isArray(item?.geofenceIds) ? item.geofenceIds : [];
}

function getElectricityMeterCount(item = {}) {
  return Number(item?.counts?.electricityMeters || 0);
}

function getWaterMeterCount(item = {}) {
  return Number(item?.counts?.waterMeters || 0);
}

function getSearchHaystack(item = {}) {
  const strNo = String(item?.address?.strNo || "").toLowerCase();
  const strName = String(item?.address?.strName || "").toLowerCase();
  const strType = String(item?.address?.strType || "").toLowerCase();
  const erfNo = String(item?.erfNo || "").toLowerCase();
  const propertyType = String(item?.propertyType?.type || "").toLowerCase();
  const occupancyStatus = String(item?.occupancy?.status || "").toLowerCase();

  return [strNo, strName, strType, erfNo, propertyType, occupancyStatus]
    .filter(Boolean)
    .join(" ");
}

export function filterPremises(list = [], filterState = {}) {
  let next = [...list];

  // Property Type
  if (filterState?.propertyTypes?.length > 0) {
    next = next.filter((item) =>
      filterState.propertyTypes.includes(item?.propertyType?.type),
    );
  }

  // Occupancy
  if (filterState?.occupancyStatuses?.length > 0) {
    next = next.filter((item) =>
      filterState.occupancyStatuses.includes(item?.occupancy?.status),
    );
  }

  // Geofences
  if (filterState?.geofenceIds?.length > 0) {
    next = next.filter((item) => {
      const ids = getGeofenceIds(item);
      return filterState.geofenceIds.some((id) => ids.includes(id));
    });
  }

  // Electricity meters
  if (filterState?.electricityMeterCounts?.length > 0) {
    next = next.filter((item) =>
      filterState.electricityMeterCounts.includes(
        getElectricityMeterCount(item),
      ),
    );
  }

  // Water meters
  if (filterState?.waterMeterCounts?.length > 0) {
    next = next.filter((item) =>
      filterState.waterMeterCounts.includes(getWaterMeterCount(item)),
    );
  }

  // No Access counts
  if (filterState?.noAccessCounts?.length > 0) {
    next = next.filter((item) =>
      filterState.noAccessCounts.includes(getNoAccessCount(item)),
    );
  }

  // Search
  const query = String(filterState?.searchQuery || "")
    .trim()
    .toLowerCase();

  if (query) {
    next = next.filter((item) => getSearchHaystack(item).includes(query));
  }

  return next;
}
