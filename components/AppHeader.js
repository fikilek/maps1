import { Appbar } from "react-native-paper";

export default function AppHeader({ title }) {
  return (
    <Appbar.Header>
      <Appbar.Content title={title} />
    </Appbar.Header>
  );
}
