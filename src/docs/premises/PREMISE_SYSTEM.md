# 🏛️ iREPS Premise Module: System Design Story

**Status:** STABILIZATION PHASE  
**Owner:** My Leader  
**Last Updated:** 2026-01-29

---

## 1. Schema & Design Story

This table defines the forensic life-cycle of every data point in the Premise object.

| Field Path           | Type     | Design Story & Evolution                                 | Validation |
| :------------------- | :------- | :------------------------------------------------------- | :--------- |
| **id**               | `string` | `PRM_{timestamp}_{erfNo}`. The immutable primary key.    | Required   |
| **erfId**            | `string` | The heavy ID for the parent Erf (link to geoLibrary).    | Required   |
| **erfNo**            | `string` | Redundant for fast list filtering and UI display.        | Required   |
| **context**          | `string` | Allowed: `suburb` OR `township`.                         | Required   |
| **address**          | `object` | `{ strNo, strName, strType }`. Street address.           | Required   |
| **geometry**         | `object` | `{ centroid: [lat, lng] }`. The human-verified anchor.   | Required   |
| **propertyType**     | `object` | `{ type, unitName, unitNo     }`. (Renamed from 'name'). | Required   |
| **occupancy.status** | `enum`   | [See Status List Below]                                  | Required   |
| **services**         | `object` | `{ waterMeters: [IDs], electricityMeters: [IDs] }`.      | Required   |
| **metadata**         | `object` | Includes `created`, `updated`, and `lmPcode`.            | Required   |
| **parents**          | `object` | DM, LM, and Province IDs for regional reporting.         | Required   |

# PREMISE_SYSTEM Documentation

## Overview

This document contains system documentation for the PREMISE system within the maps1 project.

### 🛠️ Occupancy Status Registry

The following values are the only allowed inputs for `occupancy.status`:

1. `OCCUPIED` - Standard usage.
2. `UNOCCUPIED` - No sign of life/usage.
3. `VANDALISED` - Infrastructure stripped or damaged.
4. `UNDER_CONSTRUCTION` - Active building site.
5. `DILAPIDATED` - Structurally unsound/ruins.

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
