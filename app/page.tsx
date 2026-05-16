"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { 
  ShieldCheck, Users, MapPin, Smartphone, 
  ArrowRight, Menu, X, LockKeyhole, HeartHandshake,
  CheckCircle2, Music
} from "lucide-react";

export default function LandingPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <main className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans selection:bg-[#166C82] selection:text-white overflow-x-hidden relative">
      
      {/* Taches de couleurs en fond (Effet Premium Blur) */}
      <div className="fixed top-[-20%] left-[-10%] w-[50vw] h-[50vw] bg-[#166C82]/10 rounded-full blur-[120px] pointer-events-none z-0"></div>
      <div className="fixed bottom-[-20%] right-[-10%] w-[40vw] h-[40vw] bg-[#E66825]/10 rounded-full blur-[100px] pointer-events-none z-0"></div>

      {/* --- NAVBAR GLASSMORPHISM --- */}
      <header className={`fixed top-0 w-full z-50 transition-all duration-500 ${scrolled ? "bg-white/60 backdrop-blur-2xl border-b border-white/50 py-3 shadow-[0_10px_30px_rgba(0,0,0,0.03)]" : "bg-transparent py-6"}`}>
        <div className="max-w-7xl mx-auto px-6 lg:px-12 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
             <img src="/Yamo_Logo.png" alt="Yamoh Logo" className="h-12 md:h-16 w-auto object-contain" />
          </Link>
          
          <nav className="hidden md:flex items-center gap-10">
            <a href="#vision" className="text-sm font-bold text-gray-700 hover:text-[#E66825] transition-colors">Vision</a>
            <a href="#communaute" className="text-sm font-bold text-gray-700 hover:text-[#E66825] transition-colors">Communauté</a>
            <a href="#securite" className="text-sm font-bold text-gray-700 hover:text-[#E66825] transition-colors">Sécurité</a>
          </nav>

          <div className="hidden md:flex items-center">
            <a href="#download" className="bg-[#166C82] hover:bg-[#115566] text-white font-bold px-8 py-3.5 rounded-full transition-all flex items-center gap-2 shadow-lg shadow-[#166C82]/30 hover:-translate-y-1">
              Obtenir l'App
            </a>
          </div>

          <button className="md:hidden text-gray-900 bg-white/50 backdrop-blur p-2 rounded-full" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>

      {/* Menu Mobile */}
      {isMenuOpen && (
        <div className="md:hidden fixed inset-0 bg-white/95 backdrop-blur-xl z-40 flex flex-col items-center justify-center gap-10 font-black text-4xl text-gray-900 animate-in fade-in duration-300">
          <a href="#vision" onClick={() => setIsMenuOpen(false)}>Vision</a>
          <a href="#communaute" onClick={() => setIsMenuOpen(false)}>Communauté</a>
          <a href="#securite" onClick={() => setIsMenuOpen(false)}>Sécurité</a>
          <a href="#download" onClick={() => setIsMenuOpen(false)} className="bg-[#E66825] text-white text-3xl px-8 py-4 rounded-full mt-4">Obtenir l'App</a>
        </div>
      )}

      {/* --- HERO SECTION (Typo géante & 2 Iphones Dissociés restaurés) --- */}
      <section className="relative pt-40 pb-20 lg:pt-56 lg:pb-32 px-6 lg:px-12 max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16 z-10 overflow-hidden">
        
        <div className="flex-1 w-full text-center lg:text-left z-20 relative">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 backdrop-blur-md border border-white text-[#166C82] font-bold text-xs uppercase tracking-widest mb-8 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-[#E66825] animate-pulse"></span>
            100% Social • 100% Ivoirien
          </div>
          <h1 className="text-5xl lg:text-[5.5rem] font-black text-[#0f172a] leading-[1] mb-8 tracking-tighter">
            Partagez la route.<br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#166C82] to-[#E66825]">
              Vivez l'instant.
            </span>
          </h1>
          <p className="text-lg lg:text-xl text-gray-500 mb-12 leading-relaxed max-w-xl mx-auto lg:mx-0 font-medium">
            Le premier réseau communautaire pour vos déplacements quotidiens et vos sorties festives à Abidjan. Pas de VTC, juste de l'entraide et de l'enjaillement entre Ivoiriens sûrs.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
            <a href="#download" className="bg-[#0f172a] text-white px-8 py-4.5 rounded-full font-bold text-lg hover:shadow-2xl hover:-translate-y-1 transition-all w-full sm:w-auto text-center">
              Rejoindre la famille
            </a>
          </div>
        </div>
        
        {/* Les 2 Iphones Dissociés et Fun (RESTAURÉS) */}
        <div className="flex-1 relative w-full flex flex-col sm:flex-row items-center justify-center lg:justify-end gap-6 z-10 mt-16 lg:mt-0">
          
          {/* Téléphone 1 (Quotidien) - Penché à gauche */}
          <div className="relative w-[260px] h-[540px] lg:w-[280px] lg:h-[580px] bg-black rounded-[2.5rem] border-[10px] border-gray-900 shadow-2xl transform -rotate-3 sm:-translate-x-4 lg:-translate-x-8 translate-y-0 sm:translate-y-6 overflow-hidden flex-shrink-0 transition-transform duration-700 hover:rotate-0 hover:scale-105">
            <div className="absolute top-2.5 left-1/2 transform -translate-x-1/2 w-24 h-7 bg-black rounded-full z-30"></div>
            <div className="absolute inset-0 bg-[#F8FAFC] z-20">
              <img src="/photo de groupe d'amis souriants en voiture.jpg" alt="Quotidien" className="w-full h-full object-cover grayscale-0 group-hover:grayscale-0" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a]/70 to-transparent flex flex-col justify-end p-6">
                <p className="text-white font-black text-lg">Quotidien Solidaire 🤝</p>
                <div className="mt-2 bg-white/20 backdrop-blur-md border border-white/30 rounded-lg p-2 text-white text-xs font-bold flex justify-between items-center">
                  <span>Cocody ➔ Plateau</span>
                  <span>1500 F</span>
                </div>
              </div>
            </div>
          </div>

          {/* Téléphone 2 (Vivez l'instant - Event) - Penché à droite */}
          <div className="relative w-[260px] h-[540px] lg:w-[280px] lg:h-[580px] bg-black rounded-[2.5rem] border-[10px] border-gray-900 shadow-2xl transform rotate-6 sm:translate-x-4 lg:translate-x-8 sm:-translate-y-12 overflow-hidden flex-shrink-0 transition-transform duration-700 hover:rotate-0 hover:scale-105 mt-8 sm:mt-0">
            <div className="absolute top-2.5 left-1/2 transform -translate-x-1/2 w-24 h-7 bg-black rounded-full z-30"></div>
            <div className="absolute inset-0 bg-[#F8FAFC] z-20">
              <img src="/photo d'amis festifs : Concert.jpg" alt="Concert" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#E66825]/90 via-[#E66825]/40 to-transparent flex flex-col justify-end p-6">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-[#E66825] mb-2"><Music size={20}/></div>
                <p className="text-white font-black text-xl leading-tight">Vivez l'Instant.<br/>L'Enjaillement Partagé.</p>
                <div className="mt-2 text-white/90 text-sm font-medium">Concert, Match, Festival...<br/>Commencez l'ambiance dès la voiture.</div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* --- VISION (Focus Événement & Solidaire) --- */}
      <section id="vision" className="py-24 px-6 lg:px-12 relative z-10 overflow-hidden">
        <div className="absolute top-0 right-0 w-[40vw] h-[40vw] bg-[#E66825]/5 rounded-full blur-[100px]"></div>
        <div className="max-w-7xl mx-auto">
          <div className="mb-16">
            <h2 className="text-4xl lg:text-5xl font-black text-[#0f172a] tracking-tight leading-[1.1]">Yamoh, le bienfait de<br/>se déplacer ensemble.</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="md:col-span-2 bg-[#0f172a] text-white p-10 lg:p-14 rounded-[3rem] shadow-xl hover:shadow-2xl transition-all relative overflow-hidden flex flex-col justify-between">
              <div className="relative z-10">
                <div className="w-16 h-16 bg-[#E66825]/20 text-[#E66825] rounded-2xl flex items-center justify-center mb-10 border border-[#E66825]/20">
                  <Music size={32} />
                </div>
                <h3 className="text-3xl lg:text-4xl font-black mb-6 leading-tight">L'Enjaillement commence ici.</h3>
                <p className="text-gray-300 font-medium text-lg leading-relaxed max-w-xl">
                  Yamoh est le bienfait de vos sorties festives. Ne galérez plus pour rentrer d'un concert ou d'un match. Rejoignez un trajet d'ambiance avec d'autres fans, divisez le péage et le parking, et voyagez en toute sécurité avec la famille.
                </p>
              </div>
              <div className="absolute -bottom-20 -right-20 text-[#E66825]/10">
                <Music size={300} />
              </div>
            </div>

            <div className="md:col-span-1 bg-white p-10 lg:p-14 rounded-[3rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all">
              <div className="w-16 h-16 bg-[#166C82]/10 text-[#166C82] rounded-2xl flex items-center justify-center mb-10">
                <HeartHandshake size={32} />
              </div>
              <h3 className="text-2xl font-black mb-4 tracking-tight">Solidaire à Babi</h3>
              <p className="text-gray-500 font-medium leading-relaxed">
                Le bienfait de s'arranger entre voisins pour le travail ou l'université. Amortissez vos frais d'essence sans stress.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* --- COMMUNAUTÉ --- */}
      <section id="communaute" className="py-24 px-6 lg:px-12 max-w-7xl mx-auto relative z-10">
        <div className="flex flex-col items-center text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-black text-[#0f172a] tracking-tight mb-4">L'humain au centre</h2>
          <p className="text-lg lg:text-xl text-gray-500 max-w-2xl font-medium">Yamoh est un réseau social physique. Derrière chaque trajet se cache une belle rencontre personnelle ou professionnelle.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="p-8 lg:p-10 bg-white/40 backdrop-blur-xl border border-white/60 rounded-[3rem] shadow-[0_10px_40px_rgba(0,0,0,0.03)] flex flex-col justify-between hover:bg-white/60 transition-colors">
            <div>
              <div className="w-14 h-14 bg-[#166C82]/10 text-[#166C82] rounded-2xl flex items-center justify-center mb-6"><Users size={28}/></div>
              <h3 className="text-2xl font-black mb-4 tracking-tight">Vous avez une voiture ?</h3>
              <p className="text-gray-600 font-medium leading-relaxed mb-8">Amortissez vos trajets quotidiens ou vos sorties en proposant vos places vides. Choisissez vos compagnons de route grâce à leurs profils détaillés.</p>
            </div>
            <Link href="/communaute" className="inline-flex items-center gap-2 font-bold text-[#166C82] hover:gap-3 transition-all">Découvrir la charte <ArrowRight size={18}/></Link>
          </div>

          <div className="p-8 lg:p-10 bg-white/40 backdrop-blur-xl border border-white/60 rounded-[3rem] shadow-[0_10px_40px_rgba(0,0,0,0.03)] flex flex-col justify-between hover:bg-white/60 transition-colors">
            <div>
              <div className="w-14 h-14 bg-[#E66825]/10 text-[#E66825] rounded-2xl flex items-center justify-center mb-6"><HeartHandshake size={28}/></div>
              <h3 className="text-2xl font-black mb-4 tracking-tight">Vous cherchez une place ?</h3>
              <p className="text-gray-600 font-medium leading-relaxed mb-8">Voyagez confortablement sans le stress du transport classique. Participez équitablement aux frais avec un membre fiable de la communauté.</p>
            </div>
            <Link href="/communaute" className="inline-flex items-center gap-2 font-bold text-[#E66825] hover:gap-3 transition-all">Rejoindre le mouvement <ArrowRight size={18}/></Link>
          </div>
        </div>
      </section>

      {/* --- SÉCURITÉ --- */}
      <section id="securite" className="py-24 px-6 lg:px-12 bg-white rounded-[3rem] lg:rounded-[4rem] mx-4 lg:mx-12 shadow-[0_30px_60px_rgba(0,0,0,0.05)] border border-gray-100 relative z-10 overflow-hidden mb-24">
        <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] bg-[#166C82]/10 rounded-full blur-[100px]"></div>
        <div className="max-w-7xl mx-auto flex flex-col-reverse lg:flex-row items-center gap-12 lg:gap-16">
          
          {/* Cadre Image Penché & Fun - Ajusté pour mobile */}
          <div className="flex-1 w-full max-w-lg relative mt-8 lg:mt-0">
            <div className="w-full aspect-[4/3] transform -rotate-3 translate-x-2 lg:translate-x-8 translate-y-2 lg:translate-y-4 rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-white/60 group hover:rotate-0 transition-transform duration-500">
              <img 
                src="/securite_verified.jpg" 
                alt="Communauté Vérifiée" 
                className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
              />
              <div className="absolute top-4 left-4 lg:top-6 lg:left-6 bg-white/20 backdrop-blur-xl border border-white/30 px-3 lg:px-4 py-2 rounded-full flex items-center gap-2">
                <ShieldCheck size={16} className="text-green-400 lg:w-5 lg:h-5" />
                <span className="text-white font-bold text-xs lg:text-sm tracking-wide">Communauté Vérifiée (KYC)</span>
              </div>
            </div>
          </div>

          <div className="flex-1">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#166C82]/10 border border-[#166C82]/10 text-[#166C82] font-bold text-xs uppercase tracking-widest mb-8 shadow-sm">
              <LockKeyhole size={14}/>
              Confiance Infaillible
            </div>
            <h2 className="text-4xl lg:text-5xl font-black text-[#0f172a] mb-6 tracking-tight leading-[1.1]">
              Voyagez en famille,<br/><span className="text-[#E66825]">l'esprit tranquille.</span>
            </h2>
            <p className="text-lg lg:text-xl text-gray-500 mb-10 leading-relaxed font-medium">
              Parce qu'une communauté repose avant tout sur la confiance, nous avons mis en place les meilleurs standards de sécurité. Zéro anonymat pour les profils.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 mb-10">
              <div className="flex items-center gap-3 font-bold text-[#0f172a] bg-[#F8FAFC] p-4 rounded-xl border border-gray-100 text-sm md:text-base"><CheckCircle2 className="text-green-500 flex-shrink-0"/> CNI Vérifiée (KYC)</div>
              <div className="flex items-center gap-3 font-bold text-[#0f172a] bg-[#F8FAFC] p-4 rounded-xl border border-gray-100 text-sm md:text-base"><CheckCircle2 className="text-green-500 flex-shrink-0"/> Avis & Notes</div>
              <div className="flex items-center gap-3 font-bold text-[#0f172a] bg-[#F8FAFC] p-4 rounded-xl border border-gray-100 text-sm md:text-base"><CheckCircle2 className="text-green-500 flex-shrink-0"/> Suivi GPS Temps Réel</div>
              <div className="flex items-center gap-3 font-bold text-[#0f172a] bg-[#F8FAFC] p-4 rounded-xl border border-gray-100 text-sm md:text-base"><CheckCircle2 className="text-red-500 flex-shrink-0"/> Bouton SOS intégré</div>
            </div>

            <Link href="/securite" className="inline-flex items-center gap-2 font-bold text-[#166C82] hover:gap-3 transition-all">Lire notre politique de sécurité <ArrowRight size={18}/></Link>
          </div>
        </div>
      </section>

      {/* --- CTA FINAL --- */}
      <section id="download" className="py-24 px-6 text-center max-w-4xl mx-auto relative z-10">
        <h2 className="text-4xl lg:text-6xl font-black text-[#0f172a] mb-8 tracking-tighter">Prêt à rejoindre la famille ?</h2>
        <p className="text-lg lg:text-xl text-gray-500 mb-12 font-medium max-w-xl mx-auto">Créez votre profil en 2 minutes et découvrez les trajets solidaires et les ambiances de Babi autour de vous.</p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-12">
          <button className="flex items-center justify-center gap-4 bg-black text-white px-8 py-4 rounded-2xl hover:scale-105 hover:shadow-2xl transition w-full sm:w-auto group">
            <Smartphone size={28}/>
            <div className="text-left leading-none"><p className="text-[10px] uppercase font-bold text-gray-400">Télécharger sur</p><p className="text-xl font-black mt-1">App Store</p></div>
          </button>
          <button className="flex items-center justify-center gap-4 bg-black text-white px-8 py-4 rounded-2xl hover:scale-105 hover:shadow-2xl transition w-full sm:w-auto group">
            <Smartphone size={28}/>
            <div className="text-left leading-none"><p className="text-[10px] uppercase font-bold text-gray-400">Disponible sur</p><p className="text-xl font-black mt-1">Google Play</p></div>
          </button>
        </div>
      </section>

      {/* --- FOOTER (Anonymisé & Lien Corrigé) --- */}
      <footer className="bg-[#0f172a] text-white pt-24 pb-12 px-6 lg:px-12 rounded-t-[3rem] lg:rounded-t-[5rem] relative z-0 mt-[-5rem]">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 border-b border-white/10 pb-16 mb-12 pt-16">
          <div className="col-span-1 md:col-span-2">
            <img src="/Yamo_Logo.png" className="h-10 lg:h-12 brightness-200 mb-6" alt="Yamoh White" />
            <p className="text-gray-400 font-medium leading-relaxed max-w-sm">Yamoh est le premier réseau communautaire de partage de frais de route en Côte d'Ivoire. L'humain au centre du voyage.</p>
          </div>
          <div>
            <h5 className="font-black text-lg mb-6">Légal</h5>
            <ul className="space-y-4 text-gray-400 font-medium text-sm">
              <li><Link href="/communaute" className="hover:text-white transition">Charte de la communauté</Link></li>
              <li><Link href="/securite" className="hover:text-white transition">Sécurité</Link></li>
              <li><Link href="/cgv-confidentialite" className="hover:text-white transition">CGV & Confidentialité</Link></li>
            </ul>
          </div>
          <div>
            <h5 className="font-black text-lg mb-6">Contact</h5>
            <ul className="space-y-4 text-gray-400 font-medium text-sm">
              <li>support@yamoh.net</li>
              <li>Abidjan, Côte d'Ivoire</li>
            </ul>
          </div>
        </div>
        <div className="text-center text-gray-600 font-bold text-sm">© {new Date().getFullYear()} Yamoh Côte d'Ivoire. Tous droits réservés.</div>
      </footer>
    </main>
  );
}