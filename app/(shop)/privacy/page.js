import LegalPage from '@/components/LegalPage';
import { STORE_NAME, EMAIL, PHONES, formatPhone, POLICY_UPDATED } from '@/lib/siteConfig';

export const metadata = {
  title: `Privacy Policy | ${STORE_NAME}`,
  description: `How ${STORE_NAME} collects, uses and protects your personal information.`,
};

const sections = [
  {
    id: 'about',
    title: 'About this policy',
    paras: [
      `This policy explains what personal information ${STORE_NAME} collects when you use this website, why we collect it and what choices you have. We follow the Information Technology Act, 2000 and the Digital Personal Data Protection Act, 2023.`,
    ],
  },
  {
    id: 'collect',
    title: 'What we collect',
    list: [
      'Details you give us: name, phone number, email address, delivery and billing address.',
      'Order details: what you bought, order value, payment status and delivery status.',
      'Account details: login information and your wishlist or cart.',
      'Messages: what you send us on WhatsApp, email or through the site.',
      'Device and usage data: browser type, pages viewed and approximate location, collected through cookies and similar tools.',
    ],
    after: ['We do not store your full card number, CVV or UPI PIN. Payments are handled by our payment partners.'],
  },
  {
    id: 'use',
    title: 'How we use it',
    list: [
      'To process, deliver and support your orders, returns and exchanges.',
      'To send order updates by SMS, WhatsApp or email.',
      'To keep the site secure and prevent fraud.',
      'To improve the site, products and service.',
      'To send offers and new arrivals, only if you agree. You can opt out at any time.',
    ],
  },
  {
    id: 'sharing',
    title: 'Who we share it with',
    paras: ['We do not sell your personal information. We share only what is needed with:'],
    list: [
      'courier and logistics partners, to deliver your order,',
      'payment gateways and banks, to take payment and process refunds,',
      'service providers who host the site or send messages for us,',
      'authorities, when the law requires it.',
    ],
    after: ['These partners may only use your information to provide their service to us.'],
  },
  {
    id: 'cookies',
    title: 'Cookies',
    paras: [
      'We use cookies to keep you logged in, remember your cart and understand how the site is used. You can block or delete cookies in your browser settings, but some parts of the site, such as the cart, may stop working.',
    ],
  },
  {
    id: 'retention',
    title: 'How long we keep it',
    paras: [
      'We keep your information for as long as your account is active and as long as needed for orders, returns, accounting and legal requirements. After that we delete it or make it anonymous.',
    ],
  },
  {
    id: 'security',
    title: 'Keeping it safe',
    paras: [
      'We use secure connections (HTTPS), access controls and trusted providers to protect your data. No system is completely secure, so please use a strong password and keep it private.',
    ],
  },
  {
    id: 'rights',
    title: 'Your choices and rights',
    paras: ['You can ask us to:'],
    list: [
      'show you the personal information we hold about you,',
      'correct anything that is wrong or out of date,',
      'delete your information or close your account, unless we must keep it by law,',
      'stop sending you marketing messages.',
    ],
    after: [`To make a request, email ${EMAIL}. We will reply within a reasonable time.`],
  },
  {
    id: 'children',
    title: 'Children',
    paras: [
      'We sell kids’ clothing, but the site is meant for parents and guardians. We do not knowingly collect personal information from children under 18 without a parent’s or guardian’s consent.',
    ],
  },
  {
    id: 'changes',
    title: 'Changes to this policy',
    paras: ['We may update this policy. The date at the top shows the latest version. If we make a big change, we will tell you on the site.'],
  },
  {
    id: 'contact',
    title: 'Contact us',
    paras: [`For privacy questions, email ${EMAIL} or call ${formatPhone(PHONES[0])}.`],
  },
];

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      intro="What we collect, why we collect it, and the choices you have. We keep it short and clear."
      updated={POLICY_UPDATED}
      sections={sections}
    />
  );
}