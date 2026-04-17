"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function KycGuard() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const checkKycStatus = async () => {
      // 1. Les pages où le videur te laisse tranquille
      // On laisse la page d'accueil ('/') ouverte pour qu'il puisse au moins se déconnecter s'il veut.
      const allowedPaths = ['/', '/connexion', '/verif-identite', '/admin'];
      
      // Si on est sur une page autorisée, on arrête la vérification ici
      if (allowedPaths.includes(pathname)) {
        return; 
      }

      // 2. On vérifie qui essaie d'entrer
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        // 3. On regarde son statut dans la base de données
        const { data: profile } = await supabase
          .from('profiles')
          .select('verification_status')
          .eq('id', session.user.id)
          .single();

        // 4. LE BLOCAGE : S'il n'a pas encore envoyé ses documents, on le ramène de force !
        if (profile && profile.verification_status === 'non_verifie') {
          router.push('/verif-identite');
        }
      }
    };

    checkKycStatus();

    // On s'abonne aux changements (si l'utilisateur se connecte/déconnecte)
    const { data: authListener } = supabase.auth.onAuthStateChange(() => {
      checkKycStatus();
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [pathname, router]);

  // Ce composant est un "fantôme", il ne s'affiche pas à l'écran, il agit juste en fond.
  return null;
}