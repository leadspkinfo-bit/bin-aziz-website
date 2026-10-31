import Image from "next/image";
import logo from "../../../../public/brand/logo-ivory.png";
import { AdminLoginForm } from "./AdminLoginForm";

export default function AdminLoginPage() {
  return (
    <main className="relative grid min-h-dvh place-items-center overflow-hidden px-5 py-16">
      <div className="bg-islamic-pattern absolute inset-0" aria-hidden />
      <div className="relative w-full max-w-md">
        <Image src={logo} alt="Bin Aziz" className="mx-auto h-14 w-auto" priority />
        <div className="mt-10 rounded-[2rem] bg-ivory-50 p-8 text-night-900 shadow-2xl md:p-10">
          <p className="text-xs font-semibold tracking-[0.3em] text-gold-600 uppercase">Admin panel</p>
          <h1 className="mt-3 font-display text-4xl">Admin login</h1>
          <AdminLoginForm />
        </div>
      </div>
    </main>
  );
}
