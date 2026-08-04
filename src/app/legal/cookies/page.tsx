import LegalPage from "@/components/LegalPage";

export const metadata = {
  title: "Cookie Policy — THE WALL",
};

export default function CookiesPage() {
  return (
    <LegalPage
      title="Cookie Policy"
      updated="August 2, 2026"
      intro="This Cookie Policy explains how THE WALL uses cookies and similar technologies to store your preferences and keep the platform fast and secure."
      sections={[
        {
          heading: "1. What Are Cookies?",
          paragraphs: [
            "Cookies are small text files stored in your browser. THE WALL primarily uses browser local storage and functional cookies to remember your choices.",
          ],
        },
        {
          heading: "2. Cookies We Use",
          paragraphs: [
            "Preferences — we remember your selected theme (light/dark), accent color, and interface language so your choices persist between visits.",
            "Security — rate-limiting and anti-abuse measures use transient technical data to protect the service.",
            "Functional — we may store a short-lived token when you sign in to keep your session active.",
          ],
        },
        {
          heading: "3. Third-Party Cookies",
          paragraphs: [
            "Some embedded content (such as X/Twitter posts or chart widgets) may set cookies from those providers, subject to their own cookie policies.",
          ],
        },
        {
          heading: "4. Managing Cookies",
          paragraphs: [
            "You can clear cookies and site data at any time through your browser settings. Doing so will reset your preferences (theme and language).",
          ],
        },
        {
          heading: "5. Changes to This Policy",
          paragraphs: [
            "We may update this Cookie Policy from time to time. The 'Last updated' date reflects the most recent revision.",
          ],
        },
      ]}
    />
  );
}
