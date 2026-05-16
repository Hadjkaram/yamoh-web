"use client";

import Link from "next/link";
import { ShieldCheck, EyeOff, ShieldAlert, MapPin, ArrowLeft, Smartphone } from "lucide-react";

export default function SecuritePage() {
  return (
    <main className="min-h-screen bg-[#F8FAFC] text-gray-900 font-sans selection:bg-[#166C82] selection:text-white">
      {/* Halo de fond */}
      <div className="absolute top-0 right-0 w-[50vw] h-[50vw] bg-[#166C82]/5 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Header Épuré */}
      <header className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between relative z-10">
        <Link href="/" className="flex items-center gap-2 text-sm font-bold text-gray-600 hover:text-[#166C82] transition-colors group">
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Retour à l'accueil
        </Link>
        <img src="/Yamo_Logo.png" alt="Yamoh" className="h-10 w-auto object-contain" />
      </header>

      {/* Contenu Principal */}
      <section className="max-w-4xl mx-auto px-6 pt-16 pb-24 relative z-10">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#166C82]/10 text-[#166C82] font-bold text-xs uppercase tracking-widest mb-6">
          Confiance et Sérénité
        </div>
        <h1 className="text-4xl md:text-6xl font-black tracking-tighter mb-8 leading-none">
          Votre sécurité est <br/><span className="text-[#166C82]">notre priorité absolue.</span>
        </h1>
        <p className="text-xl text-gray-500 font-medium leading-relaxed mb-16">
          Pour que l'entraide fonctionne, chacun doit se sentir serein. Yamoh n'est pas un espace d'inconnus anonymes, c'est une communauté de confiance bâtie sur la transparence et le respect.
        </p>

        {/* Grille Responsive Asymétrique */}
        <div className="space-y-12">
          
          <div className="flex flex-col md:flex-row gap-6 md:gap-12 items-start border-l-2 border-[#166C82] pl-6 md:pl-8">
            <div className="p-3 bg-[#166C82]/10 text-[#166C82] rounded-xl"><ShieldCheck size={24} /></div>
            <div className="flex-1">
              <h3 className="text-2xl font-black mb-3">Vérification stricte de l'identité (KYC)</h3>
              <p className="text-gray-600 font-medium leading-relaxed">
                Chaque membre souhaitant partager un trajet doit impérativement faire vérifier sa pièce d'identité officielle (CNI, Passeport). Nos équipes analysent chaque document pour s'assurer de l'authenticité des profils. Aucun profil fantôme n'est toléré.
              </p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-6 md:gap-12 items-start border-l-2 border-[#E66825] pl-6 md:pl-8">
            <div className="p-3 bg-[#E66825]/10 text-[#E66825] rounded-xl"><MapPin size={24} /></div>
            <div className="flex-1">
              <h3 className="text-2xl font-black mb-3">Suivi GPS en temps réel</h3>
              <p className="text-gray-600 font-medium leading-relaxed">
                Dès qu'un trajet commence, la position géographique est partagée en direct avec notre système central. Vos proches peuvent savoir à tout moment où vous vous trouvez pour garantir un voyage l'esprit tranquille.
              </p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-6 md:gap-12 items-start border-l-2 border-red-500 pl-6 md:pl-8">
            <div className="p-3 bg-red-50 text-red-500 rounded-xl"><ShieldAlert size={24} /></div>
            <div className="flex-1">
              <h3 className="text-2xl font-black mb-3">Bouton SOS d'urgence</h3>
              <p className="text-gray-600 font-medium leading-relaxed">
                L'application intègre un dispositif d'alerte immédiat. En cas de comportement inhabituel ou de problème sur la route, une simple pression transmet instantanément vos données GPS à l'administration pour une assistance prioritaire.
              </p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-6 md:gap-12 items-start border-l-2 border-gray-900 pl-6 md:pl-8">
            <div className="p-3 bg-gray-100 text-gray-900 rounded-xl"><EyeOff size={24} /></div>
            <div className="flex-1">
              <h3 className="text-2xl font-black mb-3">Protection et Anonymat des données</h3>
              <p className="text-gray-600 font-medium leading-relaxed">
                Nous protégeons farouchement votre vie privée. Vos informations sensibles ne sont jamais vendues à des tiers ni utilisées à des fins publicitaires. Seuls les détails indispensables au trajet sont partagés entre les membres connectés.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* Footer épuré */}
      <footer className="mt-auto border-t border-gray-100 py-8 text-center text-sm font-bold text-gray-400">
        © {new Date().getFullYear()} Yamoh Côte d'Ivoire. Tous droits réservés.
      </footer>
    </main>
  );
}