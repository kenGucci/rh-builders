import LegalPage from "@/components/LegalPage";

export const metadata = {
  title: "Privacy Policy — THE WALL",
};

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      updated="August 2, 2026"
      intro="This Privacy Policy explains what information THE WALL collects, how it is used, and the choices you have. Your privacy matters to us."
      sections={[
        {
          heading: "1. Information We Collect",
          paragraphs: [
            "We collect minimal information to operate the service. This includes technical data such as your IP address and browser type (for rate limiting and security), and any feedback you voluntarily submit.",
            "When you connect a wallet or sign in, the public wallet address and on-chain activity are used to provide the analytics shown on the platform.",
          ],
        },
        {
          heading: "2. How We Use Information",
          paragraphs: [
            "We use collected information to operate, secure, and improve THE WALL, to display live analytics, to prevent abuse and rate-limit abuse, and to respond to feedback.",
            "We do not sell your personal information to third parties.",
          ],
        },
        {
          heading: "3. Public On-Chain Data",
          paragraphs: [
            "Robinhood Chain is a public blockchain. Wallet addresses, transactions, and token activity are publicly visible and immutable. THE WALL simply indexes and displays this public data.",
          ],
        },
        {
          heading: "4. Cookies and Local Storage",
          paragraphs: [
            "We use local browser storage to remember your preferences (such as theme, language, and assistant settings). For more information, see our Cookie Policy.",
          ],
        },
        {
          heading: "5. Third-Party Services",
          paragraphs: [
            "THE WALL relies on third-party services for hosting, analytics, and data feeds. These providers may process limited technical data in accordance with their own privacy policies.",
          ],
        },
        {
          heading: "6. Data Security",
          paragraphs: [
            "We apply reasonable technical and organizational measures to protect information. However, no method of transmission or storage is completely secure.",
          ],
        },
        {
          heading: "7. Your Rights",
          paragraphs: [
            "You may clear locally stored preferences at any time through your browser settings, and you may stop using the service at any time. For questions, contact us via the official X account @officialWALLrh.",
          ],
        },
      ]}
    />
  );
}
