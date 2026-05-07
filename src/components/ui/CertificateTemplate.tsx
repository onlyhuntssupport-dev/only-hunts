import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer';
import { oswaldBase64 } from './fontBase64';
// New: Import the Base64 data for the provided kudu skull logo
import { kuduLogoBase64 } from './logoBase64';

// Register the font directly from memory using the Base64 data URI
if (typeof window !== 'undefined') {
  Font.register({
    family: 'Oswald',
    src: `data:font/truetype;charset=utf-8;base64,${oswaldBase64}`
  });
}

const styles = StyleSheet.create({
  page: {
    backgroundColor: '#2A3324',
    padding: 30, // Strict outer margin for perfect fitting
  },
  borderWrap: {
    width: '100%',
    height: '100%',
    borderWidth: 4,
    borderColor: '#F3F0E6',
    padding: 20,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'space-between', 
  },
  topSection: {
    alignItems: 'center',
  },
  logo: {
    width: 100, // Adjusted scale to ensure visual balance
    height: 100,
    marginBottom: 10,
  },
  brandHeader: {
    fontFamily: 'Oswald',
    fontSize: 50,
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 3,
    marginBottom: 5,
  },
  slogan: {
    fontFamily: 'Oswald',
    fontSize: 14,
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 6,
    textAlign: 'center',
    lineHeight: 1.5,
  },
  achievementSection: {
    alignItems: 'center',
  },
  certificationText: {
    fontFamily: 'Helvetica',
    fontSize: 14,
    color: '#e5e7eb',
    textTransform: 'uppercase',
    letterSpacing: 4,
    marginBottom: 10,
  },
  outfitterName: {
    fontFamily: 'Oswald',
    fontSize: 44,
    color: '#ea580c',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  bottomSection: {
    width: '100%',
    alignItems: 'center',
  },
  tacticalBanner: {
    backgroundColor: '#ca8a04',
    paddingVertical: 10,
    paddingHorizontal: 40,
    borderTopWidth: 2,
    borderBottomWidth: 2,
    borderColor: '#fef08a',
    marginBottom: 15,
    width: '80%',
  },
  tacticalBannerText: {
    fontFamily: 'Oswald',
    color: '#000000',
    fontSize: 20,
    textTransform: 'uppercase',
    letterSpacing: 8,
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: '#4b5563',
    paddingTop: 10,
  },
  footerText: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: 2,
  }
});

interface CertificateProps {
  outfitterName: string;
  verificationYear: number;
}

export default function CertificateTemplate({ outfitterName, verificationYear }: CertificateProps) {
  const certId = Math.random().toString(36).substring(2, 8).toUpperCase();

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        {/* wrap={false} is critical to prevent phantom second page breaks */}
        <View style={styles.borderWrap} wrap={false}>
          
          <View style={styles.topSection}>
            {/* New: The old placeholder is gone. We use the provided kudu skull image, now Base64 encoded for maximum reliability. */}
            {/* eslint-disable-next-line jsx-a11y/alt-text */}
            <Image 
              src={`data:image/png;base64,${kuduLogoBase64}`} 
              style={styles.logo}
            />
          </View>

          <View style={styles.topSection}>
            <Text style={styles.brandHeader}>Only-Hunts</Text>
            <Text style={styles.slogan}>
              Ancient Pursuit.{'\n'}Modern Precision.
            </Text>
          </View>

          <View style={styles.achievementSection}>
            <Text style={styles.certificationText}>Official Verification Granted To</Text>
            <Text style={styles.outfitterName}>{outfitterName}</Text>
          </View>

          <View style={styles.bottomSection}>
            <View style={styles.tacticalBanner}>
              <Text style={styles.tacticalBannerText}>Verified Outfitter</Text>
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>ID: OH-V-{verificationYear}-{certId}</Text>
              <Text style={styles.footerText}>Valid Through {verificationYear}</Text>
            </View>
          </View>

        </View>
      </Page>
    </Document>
  );
}