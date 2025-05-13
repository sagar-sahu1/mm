
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck } from "lucide-react";

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <Card className="shadow-xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <ShieldCheck className="h-16 w-16 text-primary" />
          </div>
          <CardTitle className="text-4xl font-bold">Privacy Policy</CardTitle>
          <CardDescription className="text-xl text-muted-foreground">
            Your privacy is important to us. Last updated: {new Date().toLocaleDateString()}.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 md:p-8 space-y-6 text-lg leading-relaxed">
          <section>
            <h2 className="text-2xl font-semibold mb-3">1. Introduction</h2>
            <p>
              Welcome to MindMash. This Privacy Policy explains how we collect, use, disclose, and safeguard your
              information when you use our application. We respect your privacy and are committed to protecting it.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">2. Information We Collect</h2>
            <p>
              We may collect personal information such as your name, email address, and quiz performance data when you
              register an account and use our services. We also collect information about your quiz topics and AI-generated
              questions to improve our service. Non-personal data like browser type and usage patterns may also be collected.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">3. How We Use Your Information</h2>
            <p>
              Your information is used to:
            </p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Provide, operate, and maintain MindMash.</li>
              <li>Improve, personalize, and expand our services.</li>
              <li>Understand and analyze how you use MindMash.</li>
              <li>Develop new products, services, features, and functionality.</li>
              <li>Communicate with you, either directly or through one of our partners, including for customer service,
                to provide you with updates and other information relating to the website, and for marketing and
                promotional purposes (with your consent).</li>
              <li>Process your transactions and manage your orders.</li>
              <li>Find and prevent fraud.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">4. Sharing Your Information</h2>
            <p>
              We do not sell, trade, or otherwise transfer to outside parties your Personally Identifiable Information
              unless we provide users with advance notice. This does not include website hosting partners and other
              parties who assist us in operating our website, conducting our business, or serving our users, so long
              as those parties agree to keep this information confidential. We may also release information when
              it's release is appropriate to comply with the law, enforce our site policies, or protect ours or
              others' rights, property or safety.
            </p>
          </section>
          
          <section>
            <h2 className="text-2xl font-semibold mb-3">5. Data Security</h2>
            <p>
              We implement a variety of security measures to maintain the safety of your personal information.
              However, no electronic storage or transmission over the Internet is 100% secure. While we strive to use
              commercially acceptable means to protect your personal information, we cannot guarantee its absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">6. Your Data Rights</h2>
            <p>
              Depending on your location, you may have rights regarding your personal data, including the right to access,
              correct, or delete your personal information. Please contact us to exercise these rights.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">7. Changes to This Privacy Policy</h2>
            <p>
              We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new
              Privacy Policy on this page. You are advised to review this Privacy Policy periodically for any changes.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">8. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy, please contact us through the details provided on our
              Contact Us page.
            </p>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
