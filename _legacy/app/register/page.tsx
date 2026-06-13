import { RegisterForm } from "@/components/register-form";
import { InternalLayout } from "@/components/internal-layout";

export default function RegisterPage() {
  return (
    <InternalLayout
      title="Register Certificate"
      subtitle="Initialize an immutable record within the decentralized ledger architecture."
    >
      <RegisterForm />
    </InternalLayout>
  );
}
