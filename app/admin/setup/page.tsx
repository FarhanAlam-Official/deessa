import { redirect } from "next/navigation"
import { checkSetupRequired } from "@/lib/actions/admin-setup"
import { SetupForm } from "@/components/admin/setup-form"

export const metadata = {
  title: "Admin Setup | deessa Foundation",
  description: "Set up your first admin account",
}

export default async function AdminSetupPage() {
  const setupRequired = await checkSetupRequired()

  // If setup is not required (admin exists), redirect to login
  if (!setupRequired) {
    redirect("/admin/login")
  }

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-background rounded-lg border shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-8 h-8 text-primary"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold">Admin Setup</h1>
            <p className="text-muted-foreground mt-2">Create your first super admin account to get started</p>
          </div>

          <SetupForm />

          <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              <strong>Note:</strong> This setup page will only work once. After creating the first admin, you'll need to
              use the admin panel to create additional users.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
