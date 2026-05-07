import {
    Body,
    Container,
    Head,
    Heading,
    Html,
    Preview,
    Tailwind,
    Text,
    Button,
  } from "@react-email/components";
  import * as React from "react";
  
  interface PlatformNotificationProps {
    userName: string;
    title: string;
    message: string;
    ctaText?: string;
    ctaLink?: string;
  }
  
  export const PlatformNotification = ({
    userName = "Hunter",
    title = "New Update on Only-Hunts",
    message = "You have a new notification regarding your safari.",
    ctaText = "View Dashboard",
    ctaLink = "https://www.only-hunts.com/login",
  }: PlatformNotificationProps) => {
    return (
      <Html>
        <Head />
        <Preview>{title}</Preview>
        <Tailwind
          config={{
            theme: {
              extend: {
                colors: {
                  olive: "#4A5D23",
                  kalahari: "#E36414",
                },
              },
            },
          }}
        >
          <Body className="bg-gray-100 font-sans">
            <Container className="bg-white border border-gray-200 rounded-lg my-10 mx-auto p-8 max-w-xl shadow-sm">
              <Heading className="text-olive text-2xl font-black text-center mb-6 uppercase tracking-wider">
                ONLY-HUNTS
              </Heading>
              <Text className="text-gray-800 text-base font-medium mb-4">
                Hi {userName},
              </Text>
              <Text className="text-gray-600 text-base leading-relaxed mb-6">
                {message}
              </Text>
              {ctaLink && (
                <Button
                  href={ctaLink}
                  className="bg-kalahari text-white font-bold py-3 px-6 rounded-md text-center block w-full no-underline"
                >
                  {ctaText}
                </Button>
              )}
              <Text className="text-gray-400 text-xs text-center mt-10">
                Ancient Pursuit. Modern Precision. <br />
                © 2026 Only-Hunts. All rights reserved.
              </Text>
            </Container>
          </Body>
        </Tailwind>
      </Html>
    );
  };
  
  export default PlatformNotification;