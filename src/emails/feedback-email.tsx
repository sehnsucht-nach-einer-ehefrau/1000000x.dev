import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
  Section,
} from '@react-email/components';
import * as React from 'react';

interface FeedbackEmailProps {
  email: string;
  message: string;
}

const FeedbackEmail = ({ email, message }: FeedbackEmailProps) => (
  <Html>
    <Head />
    <Preview>New Feedback from {email}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={heading}>New Feedback Received</Heading>
        <Section style={section}>
          <Text style={label}>From:</Text>
          <Text style={text}>{email}</Text>
        </Section>
        <Section style={section}>
          <Text style={label}>Message:</Text>
          <Text style={messageText}>{message}</Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

export default FeedbackEmail;

const main = {
  backgroundColor: '#f0f0f0',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
  margin: '0 auto',
  padding: '20px',
  backgroundColor: '#ffffff',
  borderRadius: '8px',
  width: '100%',
  maxWidth: '600px'
};

const heading = {
  color: '#1a1a1a',
  fontSize: '24px',
  fontWeight: 'bold',
  borderBottom: '1px solid #eaeaea',
  paddingBottom: '10px'
};

const section = {
    margin: '20px 0',
};

const label = {
    color: '#666666',
    fontSize: '14px',
    marginBottom: '5px'
}

const text = {
  color: '#1a1a1a',
  fontSize: '16px',
};

const messageText = {
    ...text,
    whiteSpace: 'pre-wrap' as const,
    backgroundColor: '#f9f9f9',
    padding: '15px',
    borderRadius: '4px',
    border: '1px solid #eaeaea',
}
