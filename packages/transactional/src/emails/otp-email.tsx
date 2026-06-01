import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
  Tailwind,
} from "react-email"
import * as React from "react"

interface OTPEmailProps {
  otp: string
}

export function OTPEmail({ otp }: OTPEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Your StockSync Login Code: {otp}</Preview>
      <Tailwind>
        <Body className="bg-gray-50 font-sans text-gray-900">
          <Container className="mx-auto my-[40px] max-w-[600px] rounded border border-solid border-gray-200 bg-white p-[20px] shadow-sm">
            <Heading className="text-left text-2xl font-bold text-blue-600">
              StockSync
            </Heading>

            <Text className="text-[16px] leading-[24px]">Hello,</Text>

            <Text className="text-[16px] leading-[24px]">
              Use the following 6-digit code to log securely into your
              dashboard. This code is valid for 5 minutes.
            </Text>

            <Section className="my-[32px] text-left">
              <Text className="inline-block rounded-md bg-gray-100 px-[24px] py-[16px] text-4xl font-bold tracking-widest text-gray-900">
                {otp}
              </Text>
            </Section>

            <Text className="text-[14px] text-gray-500">
              If you didn't request this email, there's nothing to worry about.
              You can safely ignore it.
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  )
}

export default OTPEmail
