// Función serverless: recibe la pregunta y responde SI / NO / NOSE usando Gemini (plan gratuito).
exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method not allowed' };
  try {
    const { name, d, past, q } = JSON.parse(event.body || '{}');
    if (!name || !d || !q) return { statusCode: 400, body: 'Faltan datos' };

    const prompt =
      'Sos el juez de un juego tipo Akinator al revés. Un personaje secreto es integrante del grupo de WhatsApp "Argensimos". ' +
      'Se llama ' + String(name).slice(0, 60) + ' (SECRETO, nunca lo digas ni lo insinúes). Datos: ' + String(d).slice(0, 800) + '\n' +
      'Preguntas anteriores:\n' + String(past || '(ninguna)').slice(0, 2000) + '\n' +
      'Nueva pregunta del jugador: "' + String(q).slice(0, 200) + '"\n' +
      'Respondé con UNA sola palabra: SI, NO o NOSE. Usá NOSE si con los datos no se puede saber o si no es una pregunta de sí/no. ' +
      'Si pregunta directamente el nombre, respondé NO.';

    const res = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent',
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-goog-api-key': process.env.GEMINI_API_KEY
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 10, temperature: 0 }
        })
      }
    );
    if (!res.ok) return { statusCode: 502, body: 'Error de la API' };
    const data = await res.json();
    const r = data?.candidates?.[0]?.content?.parts?.[0]?.text || 'NOSE';
    return { statusCode: 200, headers: { 'content-type': 'application/json' }, body: JSON.stringify({ r }) };
  } catch (e) {
    return { statusCode: 500, body: 'Error' };
  }
};
