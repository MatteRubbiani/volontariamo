import { LoginForm } from "@/components/login-form";

type AuthPageProps = {
  searchParams: Promise<{
    redirectTo?: string;
    error?: string;
  }>;
};

export default async function Page({ searchParams }: AuthPageProps) {
  const params = await searchParams;
  const redirectTo = params.redirectTo?.startsWith("/") ? params.redirectTo : "";
  const errorMessage = params.error;

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <LoginForm redirectTo={redirectTo} errorMessage={errorMessage} />
      </div>
    </div>
  );
}
