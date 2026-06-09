import React from "react";
import { Page, Text, View, Document, StyleSheet } from "@react-pdf/renderer";

// Professional styling for the vector PDF spec sheet
const styles = StyleSheet.create({
  page: {
    padding: 45,
    backgroundColor: "#08080C", // Deep dark slate background
    color: "#E2E8F0",
    fontFamily: "Helvetica",
  },
  header: {
    borderBottomWidth: 2,
    borderBottomColor: "#C9A84C", // Gold accent line
    paddingBottom: 20,
    marginBottom: 30,
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#C9A84C", // Premium Gold
    letterSpacing: 3,
  },
  brandSubtitle: {
    fontSize: 9,
    color: "#67E8F9", // Cyan accent
    letterSpacing: 2,
    textTransform: "uppercase",
    marginTop: 4,
  },
  docTitle: {
    fontSize: 11,
    color: "#94A3B8",
    textTransform: "uppercase",
    letterSpacing: 2,
  },
  metaContainer: {
    marginBottom: 35,
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 9,
    color: "#94A3B8",
  },
  metaGroupLeft: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  metaGroupRight: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
    alignItems: "flex-end",
  },
  metaLabel: {
    color: "#64748B",
    fontSize: 8,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  metaValue: {
    color: "#E2E8F0",
    fontWeight: "bold",
  },
  sectionTitle: {
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 2,
    color: "#C9A84C",
    marginBottom: 12,
    marginTop: 15,
    borderLeftWidth: 2,
    borderLeftColor: "#67E8F9",
    paddingLeft: 8,
  },
  table: {
    display: "flex",
    flexDirection: "column",
    borderWidth: 1,
    borderColor: "#1E293B",
    borderRadius: 8,
    overflow: "hidden",
    marginBottom: 25,
    backgroundColor: "#0D0D15",
  },
  tableRow: {
    display: "flex",
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#1E293B",
    padding: 14,
  },
  tableRowLast: {
    display: "flex",
    flexDirection: "row",
    padding: 14,
  },
  tableLabel: {
    width: "35%",
    fontSize: 9,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    color: "#64748B",
  },
  tableValue: {
    width: "65%",
    fontSize: 10,
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  notesBlock: {
    backgroundColor: "#0D0D15",
    borderWidth: 1,
    borderColor: "#1E293B",
    borderRadius: 8,
    padding: 14,
    fontSize: 9.5,
    lineHeight: 1.5,
    color: "#CBD5E1",
    marginBottom: 30,
  },
  priceSection: {
    borderTopWidth: 1,
    borderTopColor: "#1E293B",
    paddingTop: 20,
    marginBottom: 35,
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  priceLabel: {
    fontSize: 9,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    color: "#94A3B8",
  },
  priceValue: {
    fontSize: 16,
    color: "#C9A84C",
    fontWeight: "bold",
    letterSpacing: 1,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: "#1E293B",
    paddingTop: 15,
    position: "absolute",
    bottom: 40,
    left: 45,
    right: 45,
    fontSize: 8,
    color: "#475569",
    textAlign: "center",
    lineHeight: 1.5,
  },
  footerBrand: {
    fontWeight: "bold",
    color: "#C9A84C",
    fontSize: 9,
    letterSpacing: 2,
    marginBottom: 4,
  },
});

interface SavedBuildData {
  id: string;
  name: string;
  type: string;
  technology: string;
  tier: string;
  finish: string;
  notes?: string;
}

interface BuildSpecDocumentProps {
  build: SavedBuildData;
  dateString: string;
  userEmail: string;
  userName: string;
}

export const BuildSpecDocument: React.FC<BuildSpecDocumentProps> = ({
  build,
  dateString,
  userEmail,
  userName,
}) => {
  const getPriceRange = (tier: string) => {
    switch (tier?.toLowerCase()) {
      case "essential":
        return "₹25,000 – ₹35,000 (Estimated)";
      case "premium":
        return "₹75,000 – ₹2,00,000 (Estimated)";
      case "apex":
        return "₹2,00,000+ (Estimated)";
      default:
        return "Contact for Custom Quote";
    }
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.brandTitle}>SOUNDWAVE</Text>
            <Text style={styles.brandSubtitle}>High-Fidelity Audio Engineering</Text>
          </View>
          <Text style={styles.docTitle}>Bespoke Specification</Text>
        </View>

        {/* Client & Document Meta */}
        <View style={styles.metaContainer}>
          <View style={styles.metaGroupLeft}>
            <Text>
              <Text style={styles.metaLabel}>Client: </Text>
              <Text style={styles.metaValue}>{userName || "Soundwave Enthusiast"}</Text>
            </Text>
            <Text>
              <Text style={styles.metaLabel}>Email: </Text>
              <Text style={styles.metaValue}>{userEmail}</Text>
            </Text>
          </View>
          <View style={styles.metaGroupRight}>
            <Text>
              <Text style={styles.metaLabel}>Date Created: </Text>
              <Text style={styles.metaValue}>{dateString}</Text>
            </Text>
            <Text>
              <Text style={styles.metaLabel}>Specification ID: </Text>
              <Text style={styles.metaValue}>#{build.id.substring(0, 8).toUpperCase()}</Text>
            </Text>
          </View>
        </View>

        {/* Build Selections Table */}
        <Text style={styles.sectionTitle}>Build Specifications</Text>
        <View style={styles.table}>
          <View style={styles.tableRow}>
            <Text style={styles.tableLabel}>Configuration Name</Text>
            <Text style={styles.tableValue}>{build.name}</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableLabel}>Equipment Type</Text>
            <Text style={styles.tableValue}>{build.type}</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableLabel}>Core Technology</Text>
            <Text style={styles.tableValue}>{build.technology}</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableLabel}>Aesthetic Finish</Text>
            <Text style={styles.tableValue}>{build.finish || "N/A"}</Text>
          </View>
          <View style={styles.tableRowLast}>
            <Text style={styles.tableLabel}>Performance Tier</Text>
            <Text style={styles.tableValue}>{build.tier}</Text>
          </View>
        </View>

        {/* Special Requirements */}
        {build.notes ? (
          <View>
            <Text style={styles.sectionTitle}>Acoustic & Engineering Notes</Text>
            <View style={styles.notesBlock}>
              <Text>{build.notes}</Text>
            </View>
          </View>
        ) : null}

        {/* Pricing Block */}
        <View style={styles.priceSection}>
          <Text style={styles.priceLabel}>Estimated Price Range</Text>
          <Text style={styles.priceValue}>{getPriceRange(build.tier)}</Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerBrand}>SOUNDWAVE BESPOKE AUDIO SYSTEMS</Text>
          <Text>
            This document outlines your custom configuration draft. Our engineering staff will review
          </Text>
          <Text>
            the acoustics, power profiles, and finish availability before sending a final design quote.
          </Text>
          <Text style={{ marginTop: 6, color: "#64748B" }}>
            support@soundwave.com | CallMeBot WhatsApp Queue Enabled
          </Text>
        </View>
      </Page>
    </Document>
  );
};
