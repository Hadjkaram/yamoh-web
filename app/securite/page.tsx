"use client";

import Link from "next/link";
import { ShieldCheck, LockKeyhole, UserCheck, ShieldAlert, ChevronLeft } from "lucide-react";
import { GoogleFonts } from "google-fonts"; // Assure-toi d'avoir configuré Lexend dans ton layout

export default function SecurityPage() {
  return (
    <main className="min-h-screen bg-[#F8FAFC] font-sans text-[#0f172a]">
      {/* Navbar simplifiée */}
      <nav className="p-8 max-w-7xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 font-bold text-gray-500 hover:text-[#166C82] transition">
          <ChevronLeft size={20} /> Retour à l'accueil
        </Link>
      </nav>

      <section className="max-w-4xl mx-auto px-6 py-12">
        <div className="bg-white p-10 lg:p-16 rounded-[3rem] shadow-sm border border-gray-100">
          <div className="w-20 h-20 bg-[#166C82]/10 text-[#166C82] rounded-3xl flex items-center justify-center mb-10">
            <ShieldCheck size={40} />
          </div>
          
          <h1 className="text-4xl lg:text-6xl font-black mb-8 tracking-tighter leading-tight">Votre sécurité est notre priorité absolue.</h1>
          
          <p className="text-xl text-gray-500 font-medium mb-16 leading-relaxed">
            Chez Yamoh, nous croyons qu'une mobilité partagée réussie repose sur une confiance totale. Nous avons mis en place un écosystème de sécurité strict pour protéger chaque trajet.
          </p>

          <div className="space-y-12">
            <SecurityPoint 
              icon={<UserCheck className="text-[#166C82]" size={28}/>}
              title="Vérification d'identité systématique (KYC)"
              description="Chaque utilisateur, qu'il soit passager ou conducteur, doit valider son identité via notre processus KYC. Zéro profil anonyme n'est autorisé à publier ou réserver un trajet."
            />
            <SecurityPoint 
              icon={<LockKeyhole className="text-[#E66825]" size={28}/>}
              title="Confidentialité des données"
              description="Vos données personnelles et vos documents d'identité sont chiffrés et stockés en toute sécurité. Nous ne partageons jamais vos informations avec des tiers à des fins commerciales."
            />
            <SecurityPoint 
              icon={<ShieldAlert className="text-red-500" size={28}/>}
              title="Assistance et SOS"
              description="En cas de problème pendant un trajet, notre bouton SOS permet d'envoyer immédiatement votre position GPS à notre équipe de sécurité pour une intervention rapide."
            />
          </div>

          <div className="mt-20 p-8 bg-[#F8FAFC] rounded-3xl border border-gray-100">
            <h4 className="font-black text-xl mb-4">Un doute ou une question ?</h4>
            <p className="text-gray-600 font-medium mb-6">Notre équipe sécurité est disponible 24/7 pour traiter vos signalements via support@yamoh.net</p>
            <Link href="/" className="inline-block bg-[#0f172a] text-white px-8 py-4 rounded-full font-bold hover:bg-black transition">
              Retour à l'accueil
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

function SecurityPoint({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="flex gap-6">
      <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center flex-shrink-0 border border-gray-100">
        {icon}
      </div>
      <div>
        <h3 className="text-2xl font-black mb-3">{title}</h3>
        <p className="text-gray-500 font-medium leading-relaxed">{description}</p>
      </div>
    </div>
  );
}