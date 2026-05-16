"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function CgvPage() {
  return (
    <main className="min-h-screen bg-[#F8FAFC] text-gray-900 font-sans selection:bg-[#166C82] selection:text-white">
      <header className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between border-b border-gray-100 bg-white/50 backdrop-blur-md sticky top-0 z-50">
        <Link href="/" className="flex items-center gap-2 text-sm font-bold text-gray-600 hover:text-[#166C82] transition-colors group">
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Retour à l'accueil
        </Link>
        <img src="/Yamo_Logo.png" alt="Yamoh" className="h-10 w-auto object-contain" />
      </header>

      <section className="max-w-3xl mx-auto px-6 py-16 md:py-24">
        <h1 className="text-3xl md:text-5xl font-black tracking-tight mb-12">Conditions Générales & Confidentialité</h1>
        
        <div className="space-y-10 text-gray-600 font-medium leading-relaxed">
          
          <div>
            <h2 className="text-2xl font-black text-gray-950 mb-4">1. Objet de la Plateforme</h2>
            <p>
              Yamoh est une plateforme numérique de mise en relation amicale et solidaire facilitant le partage des frais de déplacement entre particuliers. Yamoh n'est pas une entreprise de transport, ne possède aucun véhicule et n'emploie aucun chauffeur. Les trajets s'effectuent sous la seule responsabilité des membres de la communauté.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-black text-gray-950 mb-4">2. Non-lucrativité des trajets</h2>
            <p>
              Les conducteurs s'engagent formellement à ne publier des trajets que dans le cadre d'un partage de frais réels (essence, péage). Tout usage à des fins professionnelles, commerciales ou visant à générer un bénéfice financier est strictement interdit et entraînera la clôture immédiate du compte.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-black text-gray-950 mb-4">3. Collecte et Utilisation des données</h2>
            <p>
              Pour assurer le bon fonctionnement et la sécurité de l'application, Yamoh collecte exclusivement les données nécessaires : identité (KYC), numéro de téléphone, et données de localisation GPS lors d'un trajet en cours. 
            </p>
            <p className="mt-3">
              Conformément à nos principes éthiques et aux exigences de protection de la vie privée d'Apple et Google, **aucune donnée n'est vendue, louée, ou partagée avec des courtiers publicitaires ou des tiers**. Vos données ne servent qu'à vous connecter avec les membres de la communauté.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-black text-gray-950 mb-4">4. Droits des utilisateurs</h2>
            <p>
              Chaque membre dispose d'un droit d'accès, de modification et de suppression de ses données personnelles. Vous pouvez à tout moment résilier votre compte directement depuis les paramètres de l'application Yamoh, ce qui entraînera la suppression définitive et irréversible de l'intégralité de vos informations de nos bases de données.
            </p>
          </div>

        </div>
      </section>

      <footer className="border-t border-gray-100 py-8 text-center text-sm font-bold text-gray-400 bg-white">
        © {new Date().getFullYear()} Yamoh Côte d'Ivoire. Tous droits réservés.
      </footer>
    </main>
  );
}