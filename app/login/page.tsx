import { LoginForm } from "@/components/login-form"

export default function Page() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center p-6 md:p-10 bg-black">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">cryptoX</h1>
          <p className="text-gray-400">모의 암호화폐 거래 플랫폼</p>
        </div>
        <LoginForm />
        <p className="mt-6 text-center text-xs text-gray-500">
          로그인하면 cryptoX의 이용약관 및 개인정보처리방침에 동의하는 것으로 간주됩니다.
        </p>
      </div>
    </div>
  )
}
