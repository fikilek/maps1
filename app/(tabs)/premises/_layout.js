import { Stack } from "expo-router";
import { useWarehouse } from "../../../src/context/WarehouseContext";
import { PremiseFilterModal } from "../../../src/features/premises/PremiseFilterModal";
import { PremiseHeader } from "../../../src/features/premises/PremiseHeader";
import { PremiseSearch } from "../../../src/features/premises/PremiseSearch"; // 🔍 Added
import { PremiseStatsModal } from "../../../src/features/premises/PremiseStatsModal";
import { useAuth } from "../../../src/hooks/useAuth";
import { usePremiseStats } from "../../../src/hooks/usePremiseStats";
import { useGetTrnsByLmPcodeQuery } from "../../../src/redux/trnsApi";

// 🎯 THE DECOUPLED CONTEXT IMPORT
import {
  PremiseFilterProvider,
  usePremiseFilter,
} from "../../../src/context/PremiseFilterContext";

function PremisesLayoutContent() {
  const { all } = useWarehouse();
  const { activeWorkbase } = useAuth();
  const lmPcode = activeWorkbase?.id;

  // 🛡️ CONSUME CONTEXT SAFELY
  const {
    showFilters,
    setShowFilters,
    showStats,
    setShowStats,
    showSearch,
    setShowSearch,
    filterState,
    setFilterState,
  } = usePremiseFilter();

  // 🛰️ DATA FETCHING
  const { data: transactions = [] } = useGetTrnsByLmPcodeQuery(
    { lmPcode },
    { skip: !lmPcode },
  );

  // 📊 STATS DERIVATION
  const stats = usePremiseStats(
    all?.prems || [],
    transactions || [],
    all?.erfs,
  );

  return (
    <>
      <Stack screenOptions={{ headerShown: true, headerShadowVisible: false }}>
        <Stack.Screen
          name="index"
          options={{
            header: () => (
              <PremiseHeader
                onFilterPress={() => setShowFilters(true)}
                onStatsPress={() => setShowStats(true)}
                onSearchPress={() => setShowSearch(true)}
              />
            ),
          }}
        />
        <Stack.Screen
          name="form"
          options={{
            title: "Meter Discovery",
            presentation: "modal",
            headerShown: true,
          }}
        />
        <Stack.Screen
          name="premiseMedia"
          options={{
            title: "Forensic Gallery",
            presentation: "modal",
            headerShown: true,
          }}
        />
        {/* 🎯 Added: No Access Screen */}
        <Stack.Screen
          name="NaScreen"
          options={{ title: "No Access Ledger", presentation: "card" }}
        />
      </Stack>

      {/* 🏛️ GLOBAL UI OVERLAYS */}
      <PremiseFilterModal
        visible={showFilters}
        onClose={() => setShowFilters(false)}
        filterState={filterState}
        setFilterState={setFilterState}
        allData={all}
        stats={stats}
      />

      <PremiseStatsModal
        visible={showStats}
        onDismiss={() => setShowStats(false)}
        stats={stats}
      />

      {/* 🔍 SEARCH OVERLAY (Moved to Layout level) */}
      <PremiseSearch
        visible={showSearch}
        onClose={() => setShowSearch(false)}
        value={filterState.searchQuery}
        onChange={(text) =>
          setFilterState((prev) => ({ ...prev, searchQuery: text }))
        }
      />
    </>
  );
}

export default function PremisesLayout() {
  return (
    <PremiseFilterProvider>
      <PremisesLayoutContent />
    </PremiseFilterProvider>
  );
}

// import { Stack } from "expo-router";
// import { useWarehouse } from "../../../src/context/WarehouseContext";
// import { PremiseFilterModal } from "../../../src/features/premises/PremiseFilterModal";
// import { PremiseHeader } from "../../../src/features/premises/PremiseHeader";
// import { PremiseStatsModal } from "../../../src/features/premises/PremiseStatsModal";
// import { usePremiseStats } from "../../../src/hooks/usePremiseStats";
// import { useGetTrnsByLmPcodeQuery } from "../../../src/redux/trnsApi";

// import {
//   PremiseFilterProvider,
//   usePremiseFilter,
// } from "../../../src/context/PremiseFilterContext";
// import { useAuth } from "../../../src/hooks/useAuth";

// // 🏛️ INTERNAL CONTENT COMPONENT
// // This component sits inside the Provider so it can use the hooks
// function PremisesLayoutContent() {
//   const { all } = useWarehouse();
//   const { activeWorkbase } = useAuth();
//   const lmPcode = activeWorkbase?.id; // 🎯 Use the activeWorkbase instead of peeking at data

//   const {
//     showFilters,
//     setShowFilters,
//     showStats,
//     setShowStats,
//     showSearch,
//     setShowSearch,
//     filterState,
//     setFilterState,
//   } = usePremiseFilter();

//   const { data: transactions = [] } = useGetTrnsByLmPcodeQuery(
//     { lmPcode },
//     { skip: !lmPcode },
//   );

//   const stats = usePremiseStats(
//     all?.prems || [],
//     transactions || [],
//     all?.erfs,
//   );

//   return (
//     <>
//       <Stack screenOptions={{ headerShown: true, headerShadowVisible: false }}>
//         <Stack.Screen
//           name="index"
//           options={{
//             header: () => (
//               <PremiseHeader
//                 onFilterPress={() => setShowFilters(true)}
//                 onStatsPress={() => setShowStats(true)}
//                 onSearchPress={() => setShowSearch(true)}
//               />
//             ),
//           }}
//         />
//         <Stack.Screen
//           name="form"
//           options={{ title: "Meter Discovery", presentation: "modal" }}
//         />
//         <Stack.Screen
//           name="premiseMedia"
//           options={{ title: "Forensic Gallery", presentation: "modal" }}
//         />
//       </Stack>

//       <PremiseFilterModal
//         visible={showFilters}
//         onClose={() => setShowFilters(false)}
//         filterState={filterState}
//         setFilterState={setFilterState}
//         allData={all}
//         stats={stats}
//       />

//       <PremiseStatsModal
//         visible={showStats}
//         onDismiss={() => setShowStats(false)}
//         stats={stats}
//       />
//     </>
//   );
// }

// // 🏛️ MAIN EXPORT
// export default function PremisesLayout() {
//   return (
//     <PremiseFilterProvider>
//       <PremisesLayoutContent />
//     </PremiseFilterProvider>
//   );
// }
