"use client";

import { useState } from "react";
import { ArrowLeft, ShieldCheck, Upload, CheckCircle } from "lucide-react";
import Link from "next/link";

export default function VerifIdentite() {
  const [step, setStep] = useState(1);

  return (
    <main className="min-h-screen bg-white font-sans">
      <header className="px-6 py-4 bg-white border-b border-gray-50 sticky top-0 z-50 flex items-center gap-4">
        <Link href="/profil"><ArrowLeft size={24} className="text-gray-900" /></Link>
        <h1 className="text-xl font-black text-yamo-teal">Vérification d'identité</h1>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-12 text-center">
        {step === 1 ? (
          <div className="animate-in fade-in zoom-in duration-500">
            <div className="w-24 h-24 bg-yamo-teal/10 rounded-full flex items-center justify-center mx-auto mb-8 text-yamo-teal">
              <ShieldCheck size={48} />
            </div>
            <h2 className="text-3xl font-black text-gray-900 mb-4">Renforçons la confiance</h2>
            <p className="text-gray-500 text-lg mb-10 leading-relaxed">
              Pour assurer la sécurité de tous sur **Yamoh**, nous vérifions les documents officiels de nos membres.
            </p>
            
            <div className="bg-gray-50 p-6 rounded-3xl text-left mb-10 space-y-4">
              <p className="font-bold text-gray-700 flex items-center gap-3">
                <CheckCircle size={18} className="text-green-500" /> Votre document reste strictement confidentiel.
              </p>
              <p className="font-bold text-gray-700 flex items-center gap-3">
                <CheckCircle size={18} className="text-green-500" /> Seul un badge "Vérifié" sera visible.
              </p>
            </div>

            <button onClick={() => setStep(2)} className="w-full bg-yamo-teal text-white font-black py-5 rounded-2xl shadow-xl shadow-yamo-teal/20 transition">
              Télécharger ma pièce d'identité (CNI / Passeport)
            </button>
          </div>
        ) : (
          <div className="animate-in slide-in-from-bottom-8 duration-500">
            <h2 className="text-2xl font-black mb-8">Prendre en photo le document</h2>
            <div className="border-4 border-dashed border-gray-200 rounded-[2.5rem] p-20 flex flex-col items-center justify-center gap-4 group hover:border-yamo-teal transition cursor-pointer">
              <Upload size={48} className="text-gray-300 group-hover:text-yamo-teal transition" />
              <p className="text-gray-400 font-bold">Cliquez pour scanner ou uploader</p>
            </div>
            <button onClick={() => alert("Document envoyé pour vérification !")} className="w-full mt-10 bg-yamo-orange text-white font-black py-5 rounded-2xl shadow-xl">
              Soumettre pour vérification
            </button>
          </div>
        )}
      </div>
    </main>
  );
}