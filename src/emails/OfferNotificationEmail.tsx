import {
    Body,
    Container,
    Head,
    Heading,
    Html,
    Preview,
    Section,
    Text,
    Button,
    Tailwind,
  } from "@react-email/components";
  import * as React from "react";
  
  interface OfferEmailProps {
    hunterName: string;
    outfitterName: string;
    huntTitle: string;
    message: string;
    dashboardLink: string;
  }
  
  export default function OfferNotificationEmail({
    hunterName = "Hunter",
    outfitterName = "An Outfitter",
    huntTitle = "a premium package",
    message = "I have a special deal for you if you book soon.",
    dashboardLink = "https://only-hunts.com/hunter/dashboard",
  }: OfferEmailProps) {
    const previewText = `${outfitterName} sent you an exclusive offer for ${huntTitle}`;
  
    return (
      <Html>
        <Head />
        <Preview>{previewText}</Preview>
        <Tailwind>
          <Body className="bg-gray-50 font-sans my-auto mx-auto px-2">
            <Container className="border border-gray-200 rounded-lg my-[40px] mx-auto p-[40px] max-w-[600px] bg-white">
              <Section className="text-center mb-6">
                <Heading className="text-2xl font-black text-[#2C3829] m-0 uppercase tracking-wide">
                  Only-Hunts
                </Heading>
                <Text className="text-[#D35400] font-bold tracking-widest text-xs uppercase mt-2">
                  VIP Exclusive Offer
                </Text>
              </Section>
  
              <Section>
                <Text className="text-[#2C3829] text-base leading-6 font-medium">
                  Hi {hunterName},
                </Text>
                <Text className="text-[#2C3829] text-base leading-6">
                  Because you saved <strong>"{huntTitle}"</strong> to your wishlist, <strong>{outfitterName}</strong> has sent you a private, exclusive offer:
                </Text>
              </Section>
  
              <Section className="bg-[#FFF4E6] border border-[#FFD8A8] rounded-lg p-6 my-6">
                <Text className="text-[#D35400] text-lg font-bold italic m-0">
                  "{message}"
                </Text>
              </Section>
  
              <Section className="text-center mt-[32px] mb-[32px]">
                <Button
                  className="bg-[#2C3829] text-white font-bold rounded-lg py-4 px-8 text-center block w-full"
                  href={dashboardLink}
                >
                  View Offer in Dashboard
                </Button>
              </Section>
  
              <Section>
                <Text className="text-gray-400 text-sm leading-6">
                  This offer is strictly between you and the outfitter. To secure your dates or ask questions, click the link above to view the package and contact them directly.
                </Text>
                <Text className="text-gray-400 text-sm leading-6 mt-4">
                  Happy Hunting,<br />
                  The Only-Hunts Team
                </Text>
              </Section>
            </Container>
          </Body>
        </Tailwind>
      </Html>
    );
  }