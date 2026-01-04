import { useSignoutMutation } from "@/src/redux/authApi";
import { useState } from "react";
import { Pressable } from "react-native";
import { Appbar, Avatar } from "react-native-paper";

export default function AppHeader({ title, user }) {
  // console.log(`AppHeader ----title`, title);
  // console.log(`AppHeader ----user`, user);

  const [menuVisible, setMenuVisible] = useState(false);
  const [signout] = useSignoutMutation();

  const initials =
    user?.profile?.name && user?.profile?.surname
      ? (user.profile.name[0] + user.profile.surname[0]).toUpperCase()
      : "U";

  const onSignOut = async () => {
    setMenuVisible(false);
    await signout();
  };

  return (
    <Appbar.Header>
      {/* LEFT: TITLE */}
      <Appbar.Content title={title} />

      {/* RIGHT: USER MENU */}
      <Pressable onPress={onSignOut} hitSlop={10}>
        <Avatar.Text size={32} label={initials} />
      </Pressable>
      {/* <Menu
        visible={menuVisible}
        onDismiss={() => setMenuVisible(false)}
        anchor={
          <Pressable onPress={() => setMenuVisible(true)} hitSlop={10}>
            <Avatar.Text size={32} label={initials} />
          </Pressable>
        }
      >
        <Menu.Item onPress={onSignOut} title="Sign out" />
        <Menu.Item title="User settings" disabled />
      </Menu> */}
    </Appbar.Header>
  );
}
