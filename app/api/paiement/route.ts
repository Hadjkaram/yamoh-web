import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { amount, provider, phone, userId } = body;

    // Appel à l'API de GeniusPay pour créer la transaction
    const geniusPayResponse = await fetch('https://api.geniuspay.com/v1/payments', { 
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GENIUSPAY_SECRET_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount: amount,
        currency: 'XOF',
        payment_method: provider,
        customer_phone: phone,
        // On glisse l'ID du passager ici, GeniusPay nous le rendra plus tard
        metadata: {
          userId: userId
        },
        // L'URL de notre Caissier qui validera l'argent
        callback_url: 'https://yamoh.net/api/webhook' 
      })
    });

    const data = await geniusPayResponse.json();

    if (!geniusPayResponse.ok) {
        return NextResponse.json({ error: data.message || "Erreur GeniusPay" }, { status: 400 });
    }

    // On renvoie le lien de paiement à Flutter
    return NextResponse.json({ url: data.payment_url });

  } catch (error) {
    console.error("Erreur Init Paiement:", error);
    return NextResponse.json({ error: 'Erreur Serveur' }, { status: 500 });
  }
}