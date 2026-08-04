import LegalPage from "@/components/LegalPage";

export const metadata = {
  title: "Terms of Use — THE WALL",
};

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Use"
      updated="August 2, 2026"
      intro="These Terms of Use govern your access to and use of THE WALL, a real-time Stock Token marketplace and on-chain analytics dashboard for Robinhood Chain (Chain ID 4663). By accessing or using THE WALL, you agree to be bound by these terms."
      sections={[
        {
          heading: "1. Acceptance of Terms",
          paragraphs: [
            "By using THE WALL you confirm that you have read, understood, and agree to these Terms of Use, along with our Privacy Policy and Cookie Policy. If you do not agree, please do not use the platform.",
          ],
        },
        {
          heading: "2. Use of the Service",
          paragraphs: [
            "THE WALL provides live market data, on-chain analytics, developer profiles, and search tools for informational purposes only.",
            "You agree to use the platform in accordance with all applicable laws and regulations and not to attempt to gain unauthorized access, disrupt, or interfere with the service.",
          ],
        },
        {
          heading: "3. Stock Tokens and Financial Information",
          paragraphs: [
            "Stock Tokens are tokenized debt securities issued by Robinhood Assets (Jersey) Limited. They provide economic exposure to underlying securities but do not grant investors any legal or beneficial rights in, or against the issuer of, those underlying securities.",
            "Stock Tokens are not registered under U.S. securities laws and may not be offered, sold, or delivered, directly or indirectly, in the United States or to, or for the account or benefit of, U.S. persons.",
            "Nothing on THE WALL constitutes financial, investment, or legal advice. Information may be delayed or inaccurate. You are solely responsible for your investment decisions.",
          ],
        },
        {
          heading: "4. No Warranty",
          paragraphs: [
            "THE WALL is provided 'as is' and 'as available', without warranties of any kind, express or implied, including accuracy, reliability, availability, or fitness for a particular purpose.",
          ],
        },
        {
          heading: "5. Limitation of Liability",
          paragraphs: [
            "To the maximum extent permitted by law, THE WALL and its operators shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or data, arising out of your use of the platform.",
          ],
        },
        {
          heading: "6. Third-Party Links",
          paragraphs: [
            "THE WALL may link to third-party websites and services (e.g., Blockscout, X, exchange platforms). We are not responsible for the content or practices of any third-party sites.",
          ],
        },
        {
          heading: "7. Changes to These Terms",
          paragraphs: [
            "We may update these Terms of Use from time to time. The 'Last updated' date at the top of this page reflects the most recent revision. Continued use of THE WALL after changes constitutes acceptance.",
          ],
        },
        {
          heading: "8. Contact",
          paragraphs: [
            "If you have questions about these Terms of Use, reach out to the community through the official X account @officialWALLrh.",
          ],
        },
      ]}
    />
  );
}
