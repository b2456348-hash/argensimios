// Función serverless: responde SI / NO / NOSE usando Gemini (plan gratuito).
// Si abrís la URL de la función en el navegador (GET) te muestra un diagnóstico.
const URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent';

async function gemini(prompt) {
  return fetch(URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY || '' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: 10, temperature: 0 }
    })
  });
}

exports.handler = async (event) => {
  if (event.httpMethod === 'GET') {
    if (!process.env.GEMINI_API_KEY) return { statusCode: 200, body: 'DIAGNOSTICO: falta la variable GEMINI_API_KEY (o no se hizo un deploy nuevo después de crearla).' };
    try {
      const r = await gemini('Respondé solo: OK');
      const t = await r.text();
      return { statusCode: 200, body: 'DIAGNOSTICO: Google respondió con código ' + r.status + '\n\n' + t.slice(0, 600) };
    } catch (e) {
      return { statusCode: 200, body: 'DIAGNOSTICO: error de conexión: ' + e.message };
    }
  }
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

    const res = await gemini(prompt);
    if (!res.ok) return { statusCode: 502, body: 'Error de la API' };
    const data = await res.json();
    const r = data?.candidates?.[0]?.content?.parts?.[0]?.text || 'NOSE';
    return { statusCode: 200, headers: { 'content-type': 'application/json' }, body: JSON.stringify({ r }) };
  } catch (e) {
    return { statusCode: 500, body: 'Error' };
  }
};
