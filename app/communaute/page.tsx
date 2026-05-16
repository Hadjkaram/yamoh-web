"use client";

import Link from "next/link";
import { Heart, Users, Sparkles, Clock, ArrowLeft } from "lucide-react";

export default function CommunautePage() {
  return (
    <main className="min-h-screen bg-[#F8FAFC] text-gray-900 font-sans selection:bg-[#166C82] selection:text-white">
      <div className="absolute top-0 right-0 w-[50vw] h-[50vw] bg-[#E66825]/5 rounded-full blur-[120px] pointer-events-none"></div>

      <header className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between relative z-10">
        <Link href="/" className="flex items-center gap-2 text-sm font-bold text-gray-600 hover:text-[#166C82] transition-colors group">
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Retour à l'accueil
        </Link>
        <img src="/Yamo_Logo.png" alt="Yamoh" className="h-10 w-auto object-contain" />
      </header>

      <section className="max-w-4xl mx-auto px-6 pt-16 pb-24 relative z-10">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#E66825]/10 text-[#E66825] font-bold text-xs uppercase tracking-widest mb-6">
          L'esprit d'équipe
        </div>
        <h1 className="text-4xl md:text-6xl font-black tracking-tighter mb-8 leading-none">
          La Charte de <br/><span className="text-[#E66825]">la famille Yamoh.</span>
        </h1>
        <p className="text-xl text-gray-500 font-medium leading-relaxed mb-16">
          Yamoh n'est pas un service commercial, c'est un réseau d'entraide. Rejoindre notre communauté implique de partager nos valeurs fondamentales pour que chaque voyage soit un moment agréable.
        </p>

        <div className="space-y-12">
          
          <div className="flex flex-col md:flex-row gap-6 md:gap-12 items-start border-l-2 border-[#166C82] pl-6 md:pl-8">
            <div className="p-3 bg-[#166C82]/10 text-[#166C82] rounded-xl"><Heart size={24} /></div>
            <div className="flex-1">
              <h3 className="text-2xl font-black mb-3">Respect mutuel et Convivialité</h3>
              <p className="text-gray-600 font-medium leading-relaxed">
                Il n'y a ni clients ni prestataires sur Yamoh. Nous sommes tous des compagnons de route. La courtoisie, le sourire et la bienveillance sont obligatoires. Discutez, apprenez à vous connaître et passez un bon moment ensemble !
              </p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-6 md:gap-12 items-start border-l-2 border-[#E66825] pl-6 md:pl-8">
            <div className="p-3 bg-[#E66825]/10 text-[#E66825] rounded-xl"><Users size={24} /></div>
            <div className="flex-1">
              <h3 className="text-2xl font-black mb-3">Partage équitable des frais</h3>
              <p className="text-gray-600 font-medium leading-relaxed">
                La participation financière demandée sert uniquement à amortir les frais réels du trajet (carburant, péage, parking). Elle ne doit en aucun cas constituer une source de profit ou un revenu professionnel. L'entraide est notre seul moteur.
              </p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-6 md:gap-12 items-start border-l-2 border-gray-900 pl-6 md:pl-8">
            <div className="p-3 bg-gray-100 text-gray-900 rounded-xl"><Clock size={24} /></div>
            <div className="flex-1">
              <h3 className="text-2xl font-black mb-3">Ponctualité et Communication</h3>
              <p className="text-gray-600 font-medium leading-relaxed">
                Le temps de chacun est précieux. Arrivez au point de rassemblement convenu quelques minutes en avance. En cas de contretemps ou d'imprévu, prévenez immédiatement votre compagnon de route via le tchat intégré à l'application.
              </p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-6 md:gap-12 items-start border-l-2 border-purple-500 pl-6 md:pl-8">
            <div className="p-3 bg-purple-50 text-purple-500 rounded-xl"><Sparkles size={24} /></div>
            <div className="flex-1">
              <h3 className="text-2xl font-black mb-3">Propreté et Bonne conduite</h3>
              <p className="text-gray-600 font-medium leading-relaxed">
                Conducteurs, assurez-vous d'avoir un véhicule propre et respectez scrupuleusement le code de la route. Passagers, respectez l'espace du conducteur. Ensemble, préservons le confort du voyage.
              </p>
            </div>
          </div>

        </div>
      </section>

      <footer className="mt-auto border-t border-gray-100 py-8 text-center text-sm font-bold text-gray-400">
        © {new Date().getFullYear()} Yamoh Côte d'Ivoire. Tous droits réservés.
      </footer>
    </main>
  );
}