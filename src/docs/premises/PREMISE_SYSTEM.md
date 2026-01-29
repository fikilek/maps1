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

|     | Premise Schema              |        |               |                  |                                     |                          |            |
| --- | --------------------------- | ------ | ------------- | ---------------- | ----------------------------------- | ------------------------ | ---------- |
| #   |  Path                       | Type   | default value | allowed valuees  | Description                         | Design Story & Evolution | Validation |
| 1   | id                          | string |               |                  | uniquie identifier for each premise |                          | required   |
| 2   | erfId                       | string |               |                  | id of the premise parent erf        |                          | required   |
| 3   | erfNo                       | string |               |                  | erfNo of the parent erf             |                          | required   |
| 4   | context                     | string |               | township, suburb |                                     |                          | required   |
| 5   | address.strNo               | string |               |                  |                                     |                          | required   |
| 6   | address.strName             | string |               |                  |                                     |                          | required   |
| 7   | address.strType             | string |               |                  |                                     |                          | required   |
| 8   | geometry.lat                | number |               |                  |                                     |                          | required   |
| 9   | geometry.lng                | number |               |                  |                                     |                          | required   |
| 10  | propertyType.type           | string |               |                  |                                     |                          | required   |
| 11  | propertyType.unitName       | string |               |                  |                                     |                          | required   |
| 12  | propertyType.unitNo         | string |               |                  |                                     |                          | required   |
| 13  | services .waterMeters       | array  |               |                  |                                     |                          | required   |
| 14  | services .electricityMeters | array  |               |                  |                                     |                          | required   |
| 15  | metadata.created.at         | string |               |                  |                                     |                          | required   |
| 16  | metadata.created.byUid      | string |               |                  |                                     |                          | required   |
| 17  | metadata.created.byUser     | string |               |                  |                                     |                          | required   |
| 18  | metadata.updated.at         | string |               |                  |                                     |                          | required   |
| 19  | metadata.updated.byUid      | string |               |                  |                                     |                          | required   |
| 20  | metadata.updated.byUser     | string |               |                  |                                     |                          | required   |
| 21  | parents.lmId                | string |               |                  |                                     |                          | required   |
| 22  | parents.dmId                | string |               |                  |                                     |                          | required   |
| 23  | parents.provinceId          | string |               |                  |                                     |                          | required   |

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
