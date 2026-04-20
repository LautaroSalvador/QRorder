import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";

type TableQrDocumentProps = {
  pages: Array<{
    qrDataUrl: string;
    tableName: string;
    tableNumber: number;
    tableUrl: string;
  }>;
};

const styles = StyleSheet.create({
  page: {
    alignItems: "center",
    backgroundColor: "#fffaf5",
    display: "flex",
    flexDirection: "column",
    gap: 18,
    justifyContent: "center",
    padding: 40,
  },
  badge: {
    border: "2 solid #d26b32",
    borderRadius: 999,
    color: "#d26b32",
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: 1.8,
    paddingHorizontal: 18,
    paddingVertical: 8,
    textTransform: "uppercase",
  },
  qr: {
    border: "10 solid #ffffff",
    borderRadius: 24,
    height: 320,
    width: 320,
  },
  subtitle: {
    color: "#6b5b52",
    fontSize: 16,
    textAlign: "center",
  },
  tableName: {
    color: "#231f1c",
    fontSize: 30,
    fontWeight: 700,
    textAlign: "center",
  },
  tableNumber: {
    color: "#d26b32",
    fontSize: 64,
    fontWeight: 900,
    textAlign: "center",
  },
  url: {
    color: "#6b5b52",
    fontSize: 12,
    textAlign: "center",
  },
});

export function TableQrsDocument({ pages }: TableQrDocumentProps) {
  return (
    <Document author="MesaQR" title="QRs de mesas">
      {pages.map((page) => (
        <Page key={page.tableUrl} size="A4" style={styles.page}>
          <Text style={styles.badge}>MesaQR</Text>
          <Text style={styles.subtitle}>Escaneá para ver el menú y pedir desde la mesa</Text>
          <Text style={styles.tableName}>{page.tableName}</Text>
          <Text style={styles.tableNumber}>Mesa {page.tableNumber}</Text>
          <View>
            {/* eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image has no alt prop */}
            <Image src={page.qrDataUrl} style={styles.qr} />
          </View>
          <Text style={styles.url}>{page.tableUrl}</Text>
        </Page>
      ))}
    </Document>
  );
}
