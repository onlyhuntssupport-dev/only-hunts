import {
  Html,
  Body,
  Head,
  Heading,
  Text,
  Link,
  Container,
  Section,
  Preview,
} from '@react-email/components';

interface InquiryAlertProps {
  outfitterName: string;
  hunterName: string;
  huntTitle: string;
  message: string;
}

export default function InquiryAlert({
  outfitterName,
  hunterName,
  huntTitle,
  message,
}: InquiryAlertProps) {
  const previewText = `New inquiry from ${hunterName} for ${huntTitle}`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>New Inquiry for {huntTitle}</Heading>
          <Text style={paragraph}>Hi {outfitterName},</Text>
          <Text style={paragraph}>
            You've received a new inquiry from a prospective hunter through the OnlyHunts platform.
          </Text>
          <Section style={messageSection}>
            <Text style={messageHeader}>
              <strong>From:</strong> {hunterName}
            </Text>
            <Text style={messageText}>"{message}"</Text>
          </Section>
          <Link
            href="https://onlyhunts.co.za/outfitter/dashboard/leads" // TODO: Use env var for base URL
            style={button}
          >
            View & Respond in Dashboard
          </Link>
          <Text style={footerText}>
            We recommend responding within 24 hours to secure the booking.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 40px 48px',
  marginBottom: '64px',
  borderRadius: '8px',
  border: '1px solid #eaeaea',
  maxWidth: '465px',
};

const heading = {
  color: '#3d441e',
  fontSize: '24px',
  fontWeight: 'bold',
  textAlign: 'center' as const,
  margin: '30px 0',
};

const paragraph = {
  color: '#5F5F5F',
  fontSize: '14px',
  lineHeight: '22px',
  textAlign: 'left' as const,
};

const messageSection = {
  margin: '28px 0',
  padding: '20px',
  backgroundColor: '#f9f9f9',
  borderRadius: '4px',
  border: '1px solid #eaeaea',
};

const messageHeader = {
  ...paragraph,
  padding: '0',
  margin: '0 0 10px 0',
  color: '#2f2f2f',
  fontWeight: 'bold'
};

const messageText = {
  ...paragraph,
  padding: '0',
  margin: '0',
  color: '#525252',
  fontStyle: 'italic',
};


const button = {
  backgroundColor: '#3d441e',
  borderRadius: '5px',
  color: '#fff',
  fontSize: '15px',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  width: '100%',
  padding: '15px 0',
  margin: '30px 0',
};

const footerText = {
  ...paragraph,
  fontSize: '12px',
  color: '#888888',
  textAlign: 'center' as const,
}
