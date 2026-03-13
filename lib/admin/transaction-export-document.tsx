/**
 * Transaction Detail Export PDF Document
 * 
 * Professional PDF export for admin transaction details
 * Uses @react-pdf/renderer for PDF generation
 */

import React from "react"
import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
} from "@react-pdf/renderer"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TransactionExportData {
  // Transaction
  donationId: string
  receiptNumber: string | null
  amount: number
  currency: string
  paymentStatus: string
  reviewStatus: string
  provider: string
  createdAt: Date
  confirmedAt: Date | null
  reviewedAt: Date | null
  
  // Donor
  donorName: string
  donorEmail: string
  donorPhone: string | null
  donorMessage: string | null
  
  // Payment Technical
  paymentIntentId: string | null
  sessionId: string | null
  subscriptionId: string | null
  customerId: string | null
  paymentId: string | null
  verificationId: string | null
  
  // Review Notes
  reviewNotes: Array<{
    noteText: string
    createdAt: Date
    adminName: string
  }>
  
  // Status Changes
  statusChanges: Array<{
    oldStatus: string
    newStatus: string
    reason: string
    createdAt: Date
    adminName: string
  }>
  
  // Export metadata
  exportedBy: string
  exportedAt: Date
}

// ---------------------------------------------------------------------------
// Brand Colors - Deesha Foundation Ocean Blue
// ---------------------------------------------------------------------------

const C = {
  // Primary brand
  ocean: "#3FABDE",       // Ocean Blue
  oceanDark: "#0B5F8A",   // Deep Ocean
  oceanLight: "#E8F6FC",  // Light Ocean bg
  oceanSoft: "#C7E9F7",   // Soft Ocean border
  oceanPale: "#F0F9FE",   // Very pale ocean
  
  // Neutrals
  dark: "#1F2937",
  muted: "#6B7280",
  light: "#F3F4F6",
  white: "#FFFFFF",
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: "Helvetica",
    backgroundColor: C.white,
  },
  accentBar: {
    height: 4,
    backgroundColor: C.ocean,
    marginBottom: 15,
  },
  header: {
    marginBottom: 20,
    borderBottom: `2pt solid ${C.ocean}`,
    paddingBottom: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: C.oceanDark,
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 9,
    color: C.muted,
  },
  section: {
    marginTop: 18,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: C.oceanDark,
    marginBottom: 10,
    borderBottom: `1pt solid ${C.oceanSoft}`,
    paddingBottom: 5,
  },
  row: {
    flexDirection: "row",
    marginBottom: 6,
  },
  label: {
    width: "40%",
    fontWeight: "bold",
    color: C.muted,
    fontSize: 9,
  },
  value: {
    width: "60%",
    color: C.dark,
    fontSize: 9,
    lineHeight: 1.4,
  },
  note: {
    marginBottom: 10,
    padding: 8,
    backgroundColor: C.oceanPale,
    borderLeft: `2pt solid ${C.ocean}`,
  },
  noteHeader: {
    fontSize: 9,
    color: C.muted,
    marginBottom: 3,
  },
  noteText: {
    fontSize: 10,
    color: C.dark,
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: "center",
    fontSize: 8,
    color: C.muted,
    borderTop: `1pt solid ${C.oceanSoft}`,
    paddingTop: 10,
  },
})

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function TransactionExportDocument({ data }: { data: TransactionExportData }) {
  const formatDate = (date: Date | null) => {
    if (!date) return "Not available"
    return new Date(date).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Accent Bar */}
        <View style={styles.accentBar} />
        
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Transaction Detail Export</Text>
          <Text style={styles.subtitle}>
            Exported by {data.exportedBy} on {formatDate(data.exportedAt)}
          </Text>
        </View>

        {/* Transaction Overview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Transaction Overview</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Transaction ID:</Text>
            <Text style={styles.value}>{data.donationId}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Receipt Number:</Text>
            <Text style={styles.value}>{data.receiptNumber || "Not generated"}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Amount:</Text>
            <Text style={styles.value}>
              {data.amount} {data.currency}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Payment Status:</Text>
            <Text style={styles.value}>{data.paymentStatus}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Review Status:</Text>
            <Text style={styles.value}>{data.reviewStatus}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Provider:</Text>
            <Text style={styles.value}>{data.provider}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Created:</Text>
            <Text style={styles.value}>{formatDate(data.createdAt)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Confirmed:</Text>
            <Text style={styles.value}>{formatDate(data.confirmedAt)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Reviewed:</Text>
            <Text style={styles.value}>{formatDate(data.reviewedAt)}</Text>
          </View>
        </View>

        {/* Donor Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Donor Information</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Name:</Text>
            <Text style={styles.value}>{data.donorName}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Email:</Text>
            <Text style={styles.value}>{data.donorEmail}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Phone:</Text>
            <Text style={styles.value}>{data.donorPhone || "Not provided"}</Text>
          </View>
          {data.donorMessage && (
            <View style={styles.row}>
              <Text style={styles.label}>Message:</Text>
              <Text style={styles.value}>{data.donorMessage}</Text>
            </View>
          )}
        </View>

        {/* Payment Technical Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Technical Details</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Payment Intent ID:</Text>
            <Text style={styles.value}>{data.paymentIntentId || "N/A"}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Session ID:</Text>
            <Text style={styles.value}>{data.sessionId || "N/A"}</Text>
          </View>
          {data.subscriptionId && (
            <View style={styles.row}>
              <Text style={styles.label}>Subscription ID:</Text>
              <Text style={styles.value}>{data.subscriptionId}</Text>
            </View>
          )}
          <View style={styles.row}>
            <Text style={styles.label}>Customer ID:</Text>
            <Text style={styles.value}>{data.customerId || "N/A"}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Payment ID (Legacy):</Text>
            <Text style={styles.value}>{data.paymentId || "N/A"}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Verification ID:</Text>
            <Text style={styles.value}>{data.verificationId || "N/A"}</Text>
          </View>
        </View>

        {/* Review Notes */}
        {data.reviewNotes.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Review Notes ({data.reviewNotes.length})
            </Text>
            {data.reviewNotes.map((note, index) => (
              <View key={index} style={styles.note}>
                <Text style={styles.noteHeader}>
                  {formatDate(note.createdAt)} by {note.adminName}
                </Text>
                <Text style={styles.noteText}>{note.noteText}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Status Changes */}
        {data.statusChanges.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Status Change Log ({data.statusChanges.length})
            </Text>
            {data.statusChanges.map((change, index) => (
              <View key={index} style={styles.note}>
                <Text style={styles.noteHeader}>
                  {formatDate(change.createdAt)} by {change.adminName}
                </Text>
                <Text style={styles.noteText}>
                  {change.oldStatus} → {change.newStatus}
                </Text>
                {change.reason && (
                  <Text style={styles.noteText}>Reason: {change.reason}</Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text>
            This is a confidential document. For internal use only.
          </Text>
          <Text>
            Generated on {formatDate(data.exportedAt)}
          </Text>
        </View>
      </Page>
    </Document>
  )
}
