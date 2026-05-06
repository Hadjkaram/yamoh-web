import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Le passe-partout Admin pour contourner la sécurité RLS de Supabase
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! 
);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const status = body.status; 
    
    // Si le paiement échoue, on ignore
    if (status !== 'SUCCESS' && status !== 'PAID' && status !== 'COMPLETED') {
      return NextResponse.json({ message: 'Paiement non finalisé' }, { status: 400 });
    }

    // On récupère l'ID du passager qu'on avait glissé à l'étape 1
    const userId = body.metadata?.userId;
    const amountPaid = Number(body.amount);

    if (!userId || !amountPaid) {
      return NextResponse.json({ error: 'Données utilisateur manquantes' }, { status: 400 });
    }

    // On vérifie combien il a déjà dans son portefeuille
    const { data: profile, error: fetchError } = await supabaseAdmin
      .from('profiles')
      .select('solde_wallet')
      .eq('id', userId)
      .single();

    if (fetchError) throw fetchError;

    // On ajoute le nouveau montant
    const nouveauSolde = (profile?.solde_wallet || 0) + amountPaid;

    // On sauvegarde la nouvelle somme
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ solde_wallet: nouveauSolde })
      .eq('id', userId);

    if (updateError) throw updateError;

    return NextResponse.json({ success: true, message: 'Portefeuille rechargé !' });

  } catch (error) {
    console.error("Erreur Webhook:", error);
    return NextResponse.json({ error: 'Erreur Interne' }, { status: 500 });
  }
}