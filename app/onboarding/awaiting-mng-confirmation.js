// app/onboarding/pending-sp-confirmation.js
import { useRouter } from "expo-router";
import { StyleSheet, View } from "react-native";
import { Avatar, Button, Card, Text } from "react-native-paper";
import { useAuth } from "../../src/hooks/useAuth";
import { useSignoutMutation } from "../../src/redux/authApi";

export default function AwaitingMngConfirmation() {
  const [signout, { isLoading }] = useSignoutMutation();

  const router = useRouter();
  const { profile } = useAuth();

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Title
          title="Approval Pending"
          left={(props) => <Avatar.Icon {...props} icon="clock-outline" />}
        />
        <Card.Content>
          <Text style={styles.text}>
            Hi {profile?.identity?.name}, your registration for
            <Text style={{ fontWeight: "bold" }}>
              {" "}
              {profile?.employment?.serviceProvider?.name}{" "}
            </Text>
            has been received.
          </Text>
          <Text style={styles.subtext}>
            Your Manager (MNG) needs to approve your account and assign your
            Municipalities before you can access iREPS.
          </Text>
        </Card.Content>
        <Card.Actions>
          <Button loading={isLoading} onPress={() => signout()} mode="text">
            Sign Out
          </Button>
          <Button onPress={() => router.replace("/")}>Welcome Screen</Button>
        </Card.Actions>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  card: { elevation: 4 },
  text: { fontSize: 16, marginBottom: 10, lineHeight: 22 },
  subtext: { color: "gray", fontSize: 14 },
});
