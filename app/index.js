import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../src/hooks/useAuth";
import { useSignoutMutation } from "../src/redux/authApi";

const snapshotStats = [
  {
    label: "Total ERFs",
    value: "34,200+",
    icon: "map-marker-radius",
    hint: "Territorial property records",
  },
  {
    label: "Total Premises",
    value: "18,450+",
    icon: "home-city-outline",
    hint: "Structured premise registry",
  },
  {
    label: "Total Meters",
    value: "12,980+",
    icon: "counter",
    hint: "Linked service points",
  },
  {
    label: "Total TRNs",
    value: "56,700+",
    icon: "file-document-outline",
    hint: "Operational transaction records",
  },
];

const capabilities = [
  {
    title: "Territorial Operations",
    text: "Operate with clear municipal and ward scope for structured field workflows.",
    icon: "map-outline",
  },
  {
    title: "ERF & Premise Registry",
    text: "Manage ERFs and premises with location, context, and operational parentage.",
    icon: "office-building-marker-outline",
  },
  {
    title: "Meter Discovery",
    text: "Capture discovered meters and link them to the right premise and service context.",
    icon: "meter-electric-outline",
  },
  {
    title: "TRN Tracking",
    text: "Record inspections, no-access outcomes, discoveries, and related operational events.",
    icon: "clipboard-text-clock-outline",
  },
  {
    title: "Revenue Visibility",
    text: "Support reporting, operational review, and future dashboards for municipal revenue work.",
    icon: "chart-line",
  },
  {
    title: "Management Oversight",
    text: "Give managers and admins a structured view of users, workbases, and reporting flows.",
    icon: "shield-account-outline",
  },
];

function SectionHeader({ eyebrow, title, subtitle }) {
  return (
    <View style={styles.sectionHeader}>
      {eyebrow ? <Text style={styles.sectionEyebrow}>{eyebrow}</Text> : null}
      <Text style={styles.sectionTitle}>{title}</Text>
      {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
    </View>
  );
}

function PrimaryButton({ label, onPress, icon = "arrow-right" }) {
  return (
    <TouchableOpacity style={styles.primaryButton} onPress={onPress}>
      <Text style={styles.primaryButtonText}>{label}</Text>
      <MaterialCommunityIcons name={icon} size={18} color="#ffffff" />
    </TouchableOpacity>
  );
}

function SecondaryButton({ label, onPress, icon = "arrow-right" }) {
  return (
    <TouchableOpacity style={styles.secondaryButton} onPress={onPress}>
      <Text style={styles.secondaryButtonText}>{label}</Text>
      <MaterialCommunityIcons name={icon} size={18} color="#0f172a" />
    </TouchableOpacity>
  );
}

function SnapshotCard({ icon, label, value, hint }) {
  return (
    <View style={styles.snapshotCard}>
      <View style={styles.snapshotTopRow}>
        <View style={styles.snapshotIconWrap}>
          <MaterialCommunityIcons name={icon} size={22} color="#2563eb" />
        </View>
        <MaterialCommunityIcons
          name="arrow-top-right"
          size={18}
          color="#94a3b8"
        />
      </View>

      <Text style={styles.snapshotValue}>{value}</Text>
      <Text style={styles.snapshotLabel}>{label}</Text>
      <Text style={styles.snapshotHint}>{hint}</Text>
    </View>
  );
}

function CapabilityCard({ icon, title, text }) {
  return (
    <View style={styles.capabilityCard}>
      <View style={styles.capabilityIconWrap}>
        <MaterialCommunityIcons name={icon} size={22} color="#1d4ed8" />
      </View>
      <View style={styles.capabilityBody}>
        <Text style={styles.capabilityTitle}>{title}</Text>
        <Text style={styles.capabilityText}>{text}</Text>
      </View>
    </View>
  );
}

function MiniPill({ icon, label }) {
  return (
    <View style={styles.miniPill}>
      <MaterialCommunityIcons name={icon} size={15} color="#cbd5e1" />
      <Text style={styles.miniPillText}>{label}</Text>
    </View>
  );
}

export default function Welcome() {
  const router = useRouter();
  const [signout] = useSignoutMutation();
  const { user, profile, status, isLoading } = useAuth();

  if (isLoading) return null;

  const isCompleted = status === "COMPLETED";

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* HERO */}
        <View style={styles.hero}>
          <View style={styles.heroTopRow}>
            <View style={styles.brandWrap}>
              <View style={styles.brandIcon}>
                <MaterialCommunityIcons
                  name="city-variant-outline"
                  size={26}
                  color="#ffffff"
                />
              </View>
              <View>
                <Text style={styles.brandTitle}>iREPS</Text>
                <Text style={styles.brandSubTitle}>
                  Intelligent Revenue Enhancement and Protection Solution
                </Text>
              </View>
            </View>

            <View style={styles.versionBadge}>
              <Text style={styles.versionBadgeText}>
                Enterprise Utility Management Platform
              </Text>
            </View>
          </View>

          <Text style={styles.heroHeading}>
            One structured platform for registry, inspections, transactions, and
            revenue operations.
          </Text>

          <Text style={styles.heroDescription}>
            iREPS helps teams manage ERFs, premises, meters, transactions,
            inspections, and operational work across municipal territories in a
            clearer and more controlled way.
          </Text>

          <View style={styles.heroPills}>
            <MiniPill icon="map-marker-outline" label="Territory-aware" />
            <MiniPill icon="clipboard-check-outline" label="Field-ready" />
            <MiniPill icon="chart-box-outline" label="Report-driven" />
          </View>

          {!user ? (
            <View style={styles.heroActionGroup}>
              <PrimaryButton
                label="Login to My Account"
                icon="login"
                onPress={() => router.push("/signin")}
              />
              <SecondaryButton
                label="Register New Account"
                icon="account-plus-outline"
                onPress={() => router.push("/signup")}
              />
            </View>
          ) : (
            <View style={styles.activeSessionCard}>
              <View style={styles.activeSessionHeader}>
                <View style={styles.activeSessionBadge}>
                  <MaterialCommunityIcons
                    name="check-circle-outline"
                    size={16}
                    color="#86efac"
                  />
                  <Text style={styles.activeSessionBadgeText}>
                    Active Session
                  </Text>
                </View>
              </View>

              <Text style={styles.activeSessionTitle}>Signed in to iREPS</Text>
              <Text style={styles.activeSessionEmail}>
                {profile?.identity?.email || "NAv"}
              </Text>

              <View style={styles.heroActionGroup}>
                {!isCompleted ? (
                  <PrimaryButton
                    label="Continue Onboarding"
                    icon="progress-check"
                    onPress={() => router.push("/onboarding/select-workbase")}
                  />
                ) : (
                  <PrimaryButton
                    label="Open iREPS Workspace"
                    icon="arrow-right-circle-outline"
                    onPress={() => router.push("/(tabs)/erfs")}
                  />
                )}

                <SecondaryButton
                  label="Sign Out"
                  icon="logout"
                  onPress={() => signout()}
                />
              </View>
            </View>
          )}
        </View>

        {/* WHAT IS IREPS */}
        <View style={styles.section}>
          <SectionHeader
            eyebrow="INTRODUCTION"
            title="What is iREPS?"
            subtitle="A structured municipal operations system for territory, registry, fieldwork, and reporting."
          />

          <View style={styles.infoCard}>
            <Text style={styles.infoLead}>
              iREPS is designed to bring municipal field operations and registry
              data into one coordinated system.
            </Text>

            <Text style={styles.infoText}>
              It supports the management of ERFs, premises, meters, inspections,
              transaction records, and operational reporting so that teams can
              work with cleaner structure, clearer scope, and more reliable
              records.
            </Text>

            <View style={styles.infoPoints}>
              <View style={styles.infoPointRow}>
                <MaterialCommunityIcons
                  name="check-circle-outline"
                  size={18}
                  color="#2563eb"
                />
                <Text style={styles.infoPointText}>
                  Organised around municipal territorial structures
                </Text>
              </View>

              <View style={styles.infoPointRow}>
                <MaterialCommunityIcons
                  name="check-circle-outline"
                  size={18}
                  color="#2563eb"
                />
                <Text style={styles.infoPointText}>
                  Supports registry and field workflows in one place
                </Text>
              </View>

              <View style={styles.infoPointRow}>
                <MaterialCommunityIcons
                  name="check-circle-outline"
                  size={18}
                  color="#2563eb"
                />
                <Text style={styles.infoPointText}>
                  Ready for future dashboards, reports, and operational insights
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* VIDEO PLACEHOLDER */}
        <View style={styles.section}>
          <SectionHeader
            eyebrow="OVERVIEW"
            title="See iREPS in motion"
            subtitle="A product walkthrough video can live here later."
          />

          <View style={styles.videoCard}>
            <View style={styles.videoGlow} />
            <View style={styles.videoPlayButton}>
              <MaterialCommunityIcons name="play" size={34} color="#ffffff" />
            </View>
            <Text style={styles.videoTitle}>iREPS Platform Overview</Text>
            <Text style={styles.videoText}>
              This section is ready for a future introduction video, demo
              preview, or guided walkthrough of the platform.
            </Text>

            <View style={styles.videoTags}>
              <View style={styles.videoTag}>
                <Text style={styles.videoTagText}>Intro Video</Text>
              </View>
              <View style={styles.videoTag}>
                <Text style={styles.videoTagText}>Product Tour</Text>
              </View>
              <View style={styles.videoTag}>
                <Text style={styles.videoTagText}>Coming Soon</Text>
              </View>
            </View>
          </View>
        </View>

        {/* SNAPSHOT */}
        <View style={styles.section}>
          <SectionHeader
            eyebrow="SNAPSHOT"
            title="Platform at a glance"
            subtitle="Placeholder stats for now. Later we can wire real totals and trends."
          />

          <View style={styles.snapshotGrid}>
            {snapshotStats.map((item) => (
              <SnapshotCard
                key={item.label}
                icon={item.icon}
                label={item.label}
                value={item.value}
                hint={item.hint}
              />
            ))}
          </View>
        </View>

        {/* CAPABILITIES */}
        <View style={styles.section}>
          <SectionHeader
            eyebrow="CAPABILITIES"
            title="What can iREPS do?"
            subtitle="A quick look at the operational areas the platform is built to support."
          />

          <View style={styles.capabilitiesList}>
            {capabilities.map((item) => (
              <CapabilityCard
                key={item.title}
                icon={item.icon}
                title={item.title}
                text={item.text}
              />
            ))}
          </View>
        </View>

        {/* FOOTER CTA */}
        <View style={styles.footerCard}>
          <Text style={styles.footerEyebrow}>READY TO ENTER?</Text>
          <Text style={styles.footerTitle}>
            Explore the platform and continue into iREPS
          </Text>
          <Text style={styles.footerText}>
            This welcome page is the front door. Later we can turn it into a
            full WOW product page with live stats, visuals, screenshots, and a
            richer iREPS story.
          </Text>

          {!user ? (
            <View style={styles.footerActions}>
              <PrimaryButton
                label="Sign In"
                icon="login"
                onPress={() => router.push("/signin")}
              />
            </View>
          ) : (
            <View style={styles.footerActions}>
              {!isCompleted ? (
                <PrimaryButton
                  label="Continue Onboarding"
                  icon="progress-check"
                  onPress={() => router.push("/onboarding/select-workbase")}
                />
              ) : (
                <PrimaryButton
                  label="Open iREPS Workspace"
                  icon="arrow-right-circle-outline"
                  onPress={() => router.push("/(tabs)/erfs")}
                />
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },

  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },

  contentContainer: {
    padding: 18,
    paddingBottom: 36,
  },

  section: {
    marginBottom: 28,
  },

  sectionHeader: {
    marginBottom: 14,
  },

  sectionEyebrow: {
    fontSize: 12,
    fontWeight: "800",
    color: "#2563eb",
    letterSpacing: 1,
    marginBottom: 6,
  },

  sectionTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 6,
  },

  sectionSubtitle: {
    fontSize: 14,
    lineHeight: 21,
    color: "#475569",
  },

  hero: {
    backgroundColor: "#0f172a",
    borderRadius: 28,
    padding: 20,
    marginBottom: 28,
  },

  heroTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },

  brandWrap: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    paddingRight: 10,
  },

  brandIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: "#1e3a8a",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  brandTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: "#ffffff",
    marginBottom: 2,
  },

  brandSubTitle: {
    fontSize: 12,
    color: "#cbd5e1",
    fontWeight: "600",
    lineHeight: 18,
    maxWidth: 220,
  },

  versionBadge: {
    backgroundColor: "#172554",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    maxWidth: 150,
  },

  versionBadgeText: {
    color: "#bfdbfe",
    fontSize: 11,
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 15,
  },

  heroHeading: {
    fontSize: 30,
    lineHeight: 38,
    fontWeight: "800",
    color: "#ffffff",
    marginBottom: 12,
  },

  heroDescription: {
    fontSize: 15,
    lineHeight: 24,
    color: "#cbd5e1",
    marginBottom: 18,
  },

  heroPills: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 20,
  },

  miniPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1e293b",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    gap: 6,
  },

  miniPillText: {
    color: "#e2e8f0",
    fontSize: 12,
    fontWeight: "700",
  },

  heroActionGroup: {
    gap: 12,
  },

  primaryButton: {
    minHeight: 52,
    backgroundColor: "#2563eb",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  primaryButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "800",
  },

  secondaryButton: {
    minHeight: 52,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  secondaryButtonText: {
    color: "#0f172a",
    fontSize: 15,
    fontWeight: "800",
  },

  activeSessionCard: {
    marginTop: 4,
    backgroundColor: "#111827",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#1f2937",
  },

  activeSessionHeader: {
    marginBottom: 10,
  },

  activeSessionBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#052e16",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },

  activeSessionBadgeText: {
    color: "#bbf7d0",
    fontSize: 12,
    fontWeight: "700",
  },

  activeSessionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#ffffff",
    marginBottom: 4,
  },

  activeSessionEmail: {
    fontSize: 14,
    color: "#cbd5e1",
    marginBottom: 14,
  },

  infoCard: {
    backgroundColor: "#ffffff",
    borderRadius: 22,
    padding: 18,
  },

  infoLead: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 10,
  },

  infoText: {
    fontSize: 14,
    lineHeight: 22,
    color: "#475569",
    marginBottom: 16,
  },

  infoPoints: {
    gap: 12,
  },

  infoPointRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },

  infoPointText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 21,
    color: "#334155",
    fontWeight: "500",
  },

  videoCard: {
    overflow: "hidden",
    backgroundColor: "#1e293b",
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 250,
    position: "relative",
  },

  videoGlow: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "#2563eb",
    opacity: 0.12,
    top: -40,
  },

  videoPlayButton: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: "#2563eb",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },

  videoTitle: {
    fontSize: 21,
    fontWeight: "800",
    color: "#ffffff",
    marginBottom: 8,
    textAlign: "center",
  },

  videoText: {
    fontSize: 14,
    lineHeight: 21,
    color: "#cbd5e1",
    textAlign: "center",
    marginBottom: 16,
  },

  videoTags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "center",
  },

  videoTag: {
    backgroundColor: "#334155",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },

  videoTagText: {
    color: "#e2e8f0",
    fontSize: 12,
    fontWeight: "700",
  },

  snapshotGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
  },

  snapshotCard: {
    width: "48%",
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 16,
  },

  snapshotTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },

  snapshotIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#dbeafe",
    alignItems: "center",
    justifyContent: "center",
  },

  snapshotValue: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 4,
  },

  snapshotLabel: {
    fontSize: 13,
    fontWeight: "800",
    color: "#334155",
    marginBottom: 6,
  },

  snapshotHint: {
    fontSize: 12,
    lineHeight: 18,
    color: "#64748b",
  },

  capabilitiesList: {
    gap: 12,
  },

  capabilityCard: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 16,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
  },

  capabilityIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: "#eff6ff",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },

  capabilityBody: {
    flex: 1,
  },

  capabilityTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 6,
  },

  capabilityText: {
    fontSize: 14,
    lineHeight: 21,
    color: "#475569",
  },

  footerCard: {
    backgroundColor: "#e2e8f0",
    borderRadius: 24,
    padding: 22,
  },

  footerEyebrow: {
    fontSize: 12,
    fontWeight: "800",
    color: "#2563eb",
    letterSpacing: 1,
    marginBottom: 8,
  },

  footerTitle: {
    fontSize: 24,
    lineHeight: 31,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 8,
  },

  footerText: {
    fontSize: 14,
    lineHeight: 22,
    color: "#334155",
    marginBottom: 16,
  },

  footerActions: {
    gap: 12,
  },
});
