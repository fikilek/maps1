import NetInfo from "@react-native-community/netinfo";
import { setOffline, setOnline } from "./offlineSlice";

export function startNetworkListener(store) {
  return NetInfo.addEventListener((state) => {
    if (state.isConnected && state.isInternetReachable) {
      store.dispatch(setOnline());
    } else {
      store.dispatch(setOffline());
    }
  });
}
