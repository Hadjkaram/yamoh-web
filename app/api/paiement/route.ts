import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    // On réceptionne TOUTES les clés envoyées par l'app Flutter
    const { amount, payment_method, gateway, phone, name, userId } = body;

    const geniusPayResponse = await fetch('https://pay.genius.ci/api/v1/merchant/payments', { 
      method: 'POST',
      headers: {
        'X-API-Key': process.env.GENIUSPAY_API_KEY!,
        'X-API-Secret': process.env.GENIUSPAY_API_SECRET!,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount: amount,
        currency: 'XOF',
        // ON UTILISE LES VARIABLES ENVOYÉES DEPUIS FLUTTER
        payment_method: payment_method, 
        gateway: gateway, 
        customer: {
          name: name || "Client Yamoh",
          phone: phone 
        },
        metadata: {
          user_id: userId 
        },
        success_url: "https://www.yamoh.net", 
        error_url: "https://www.yamoh.net"    
      })
    });

    const json = await geniusPayResponse.json();

    if (!json.success) {
        return NextResponse.json({ error: json.error?.message || "Erreur GeniusPay" }, { status: 400 });
    }

    // ON PRIORISE LE LIEN DIRECT (payment_url) AVANT LA PAGE GLOBALE (checkout_url)
    const paymentUrl = json.data.payment_url || json.data.checkout_url;

    return NextResponse.json({ url: paymentUrl });

  } catch (error) {
    console.error("Erreur Init Paiement:", error);
    return NextResponse.json({ error: 'Erreur Serveur' }, { status: 500 });
  }
}