import { GoogleGenAI } from '@google/genai'

// Vite에서는 브라우저용 환경변수를 import.meta.env 로 읽어요.
const apiKey = (import.meta.env.VITE_GEMINI_API_KEY || '').trim()

function createClient() {
  if (!apiKey) {
    throw new Error(
      'VITE_GEMINI_API_KEY가 없습니다. 프로젝트 루트 .env에 키를 넣고 npm run dev를 다시 실행하세요.',
    )
  }
  return new GoogleGenAI({ apiKey })
}

function toFriendlyError(err) {
  const message = String(err?.message || err)
  if (message.includes('API_KEY_INVALID') || message.includes('API key not valid')) {
    return new Error(
      'Gemini API 키가 유효하지 않습니다. Google AI Studio에서 새 키를 복사해 .env의 VITE_GEMINI_API_KEY에 넣고, 서버를 재시작해 주세요.',
    )
  }
  return err instanceof Error ? err : new Error(message)
}

/**
 * 글자가 들어오는 대로 onChunk(전체텍스트)를 호출해요.
 * 화면에서 실시간으로 타이핑되는 느낌을 줄 수 있어요.
 */
export async function streamGemini(prompt, onChunk) {
  const ai = createClient()
  const models = ['gemini-3.6-flash', 'gemini-2.5-flash']

  let lastError = null

  for (const model of models) {
    try {
      const stream = await ai.models.generateContentStream({
        model,
        contents: prompt,
      })

      let fullText = ''
      for await (const chunk of stream) {
        const piece = chunk.text || ''
        if (!piece) continue
        fullText += piece
        onChunk(fullText)
      }

      return fullText
    } catch (err) {
      lastError = err
      const message = String(err?.message || err)
      // 모델이 없으면 다음 모델로 재시도
      if (message.includes('not found') || message.includes('NOT_FOUND')) {
        continue
      }
      throw toFriendlyError(err)
    }
  }

  throw toFriendlyError(lastError || new Error('Gemini 스트리밍에 실패했습니다.'))
}
