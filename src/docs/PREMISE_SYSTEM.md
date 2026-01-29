# 🏛️ iREPS Premise Module: System Design Story

**Status:** STABILIZATION PHASE  
**Owner:** My Leader  
**Last Updated:** 2026-01-29

---

## 1. Schema & Design Story

This table defines the forensic life-cycle of every data point in the Premise object.

| Data Item               | Type      | Rules & Validation          | Default          | Journey / Evolution                                             | Description                                                              |
| :---------------------- | :-------- | :-------------------------- | :--------------- | :-------------------------------------------------------------- | :----------------------------------------------------------------------- |
| **id**                  | `string`  | Unique, Immutable           | `PRM_{ts}_{erf}` | **Form:** Generated on Mount -> **Firestore:** Document ID      | The primary key. Built from timestamp and ErfNo to ensure no collisions. |
| **erfId**               | `string`  | Mandatory                   | `id` from URL    | **Context:** Injected from `useLocalSearchParams`               | The link to the parent land parcel. Used for indexing.                   |
| **address.strNo**       | `string`  | Required, Alpha-numeric     | `""`             | **Form:** Input -> **UI:** Displayed on Premise Card            | The street number. Can include letters (e.g., 12A).                      |
| **address.strName**     | `string`  | Required, Title Case        | `""`             | **Form:** Auto-capitalized on change                            | The official name of the street.                                         |
| **propertyType.type**   | `enum`    | Required, Must match Matrix | `"RESD"`         | **Form:** Picker -> **CF:** Determines spawning logic           | Determines if we create 1 main house or a block of units.                |
| **structure.backrooms** | `number`  | Integer >= 0                | `0`              | **Form:** Counter -> **CF:** Triggers loop to create N premises | Critical for infrastructure load analysis.                               |
| **geometry.centroid**   | `array`   | Required, `[lat, lng]`      | `erfCentroid`    | **Form:** Manual Map Drag -> **Map:** Draggable Marker          | The "Human Truth" location of the building footprint.                    |
| **isTownship**          | `boolean` | Required                    | `false`          | **Form:** Toggle -> **Firestore:** Filter key                   | Segregates data for municipal reporting (Township vs Suburb).            |
| **metadata.lmPcode**    | `string`  | Mandatory                   | `geoState.lm.id` | **Submit:** Attached as payload key                             | The "Security Key" that ensures the data lands in the correct LM cache.  |

# PREMISE_SYSTEM Documentation

## Overview

This document contains system documentation for the PREMISE system within the maps1 project.

## File Location

- **Path**: `/C:/Users/User/OneDrive/Documents/swprojects/projects_expo/expo5/maps1/src/docs/PREMISE_SYSTEM.md`

## Purpose

[Add detailed description of the PREMISE_SYSTEM purpose and functionality]

## Key Components

- [Component 1]
- [Component 2]
- [Component 3]

## Usage

[Add usage instructions and examples]

## Related Files

- [Related file paths]

## Last Updated

[Date and version information]

## Author

## [Author information]

## 2. initialValues (Implementation)

_The landing logic for the form. Stays focused on the Erf Centroid._

```javascript
const initialValues = {
  id: `PRM_${Date.now()}_${selectedErf?.erfNo}`,
  erfId: id,
  address: { strNo: "", strName: "", strType: "Street" },
  propertyType: { type: "Residential", name: "", unitNo: "" },
  structure: { backrooms: 0 },
  geometry: { centroid: [selectedErf.centroid.lat, selectedErf.centroid.lng] },
  isTownship: selectedErf.isTownship || false,
};
```
