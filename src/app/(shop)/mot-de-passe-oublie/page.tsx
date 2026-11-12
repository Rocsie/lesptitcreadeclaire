import type { Metadata } from 'next';
import ForgotForm from './ForgotForm';

export const metadata: Metadata = {
  title: 'Mot de passe oublié',
  robots: { index: false },
};

export default function ForgotPasswordPage() {
  return <ForgotForm />;
}
