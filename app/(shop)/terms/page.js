import LegalPage from '@/components/LegalPage';
import { STORE_NAME, BRAND_NAME, EMAIL, PHONES, formatPhone, DELIVERY_TIME, RETURN_DAYS, GOVERNING_CITY, POLICY_UPDATED } from '@/lib/siteConfig';

export const metadata = {
  title: `Terms & Conditions | ${STORE_NAME}`,
  description: `The terms that apply when you browse or buy from ${STORE_NAME}.`,
};

const sections = [
  {
    id: 'acceptance',
    title: 'Accepting these terms',
    paras: [
      `These terms apply to everyone who visits or buys from ${STORE_NAME} (${BRAND_NAME}). By placing an order or using this website you agree to them. If you do not agree, please do not use the site.`,
    ],
  },
  {
    id: 'eligibility',
    title: 'Who can order',
    paras: [
      'You must be at least 18 years old, or use the site under the supervision of a parent or guardian, to place an order. You agree to give correct name, address, phone number and email so we can deliver and reach you.',
    ],
  },
  {
    id: 'products',
    title: 'Products and pricing',
    list: [
      'We show colours as accurately as screens allow, but a slight difference between the photo and the product can happen.',
      'All prices are in Indian Rupees (INR) and include applicable taxes unless the checkout says otherwise.',
      'We may change prices, offers and stock at any time. The price you see when you place the order is the price you pay.',
      'If a product is listed at the wrong price or is out of stock, we may cancel the order and refund anything you paid.',
    ],
  },
  {
    id: 'orders',
    title: 'Placing and accepting orders',
    paras: [
      'An order is confirmed only after we send you an order confirmation. We may decline or cancel an order, for example because of suspected fraud, an address we cannot deliver to, or a stock error. If we cancel a paid order, we refund the full amount.',
    ],
  },
  {
    id: 'payments',
    title: 'Payments',
    paras: [
      'We accept UPI, cards and net banking through secure payment partners, and cash on delivery (COD) on eligible pin codes. We do not store your card details. COD orders must be paid in full to the delivery partner when the parcel arrives. Repeated refusal of COD parcels may lead us to switch off COD for your account.',
    ],
  },
  {
    id: 'shipping',
    title: 'Shipping and delivery',
    paras: [
      `We ship across India. Most orders arrive within ${DELIVERY_TIME} depending on your location. Delivery times are estimates, not guarantees, and can be affected by courier delays, weather, festivals or events outside our control.`,
      'Risk of loss passes to you once the parcel is delivered to the address you gave us.',
    ],
  },
  {
    id: 'returns',
    title: 'Returns and exchanges',
    paras: [
      `If the fit or the product is not right, you can request a return or exchange within ${RETURN_DAYS} days of delivery, or the window shown on the product page if it is different.`,
    ],
    list: [
      'Items must be unworn, unwashed, with tags and original packaging intact.',
      'Innerwear, products marked non-returnable, and custom or altered items cannot be returned unless they arrive damaged or wrong.',
      'If you received a damaged, defective or wrong item, tell us within 48 hours of delivery with clear photos and we will replace it or refund you.',
      'Approved refunds go back to the original payment method. For COD orders we refund to a bank account or UPI ID you provide.',
    ],
    after: ['To start a return or exchange, message us on WhatsApp or email us with your order number.'],
  },
  {
    id: 'accounts',
    title: 'Your account',
    paras: [
      'You are responsible for keeping your login details safe and for all activity under your account. Tell us straight away if you think someone else has used it.',
    ],
  },
  {
    id: 'conduct',
    title: 'Acceptable use',
    paras: ['You agree not to:'],
    list: [
      'use the site for anything unlawful or fraudulent,',
      'try to break, scrape or overload the site or its security,',
      'post reviews that are false, abusive or not about a product you bought.',
    ],
  },
  {
    id: 'ip',
    title: 'Our content',
    paras: [
      `The photos, text, logos and designs on this site belong to ${STORE_NAME} or its licensors. You may not copy, resell or reuse them without our written permission.`,
    ],
  },
  {
    id: 'liability',
    title: 'Limits on our liability',
    paras: [
      'To the extent the law allows, we are not liable for indirect or consequential loss, or for delays and failures caused by events outside our reasonable control. Our total liability for any order is limited to the amount you paid for that order. Nothing here limits rights you have under Indian consumer law.',
    ],
  },
  {
    id: 'law',
    title: 'Governing law',
    paras: [
      `These terms are governed by the laws of India. Courts in ${GOVERNING_CITY}, Tamil Nadu have jurisdiction over any dispute, subject to your rights under the Consumer Protection Act, 2019.`,
    ],
  },
  {
    id: 'changes',
    title: 'Changes to these terms',
    paras: ['We may update these terms from time to time. The date at the top shows the latest version. Continuing to use the site after a change means you accept it.'],
  },
  {
    id: 'contact',
    title: 'Contact us',
    paras: [`Questions about these terms? Email ${EMAIL} or call ${formatPhone(PHONES[0])}.`],
  },
];

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms & Conditions"
      intro="Plain-language terms for browsing and buying from us. Please read them before you place an order."
      updated={POLICY_UPDATED}
      sections={sections}
    />
  );
}