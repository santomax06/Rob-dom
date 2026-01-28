
import { GoogleGenAI, Type } from "@google/genai";
import { Challenge, ChallengeTheme, ChallengeDifficulty } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function generateChallenge(theme: ChallengeTheme, difficulty: ChallengeDifficulty): Promise<Challenge> {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Crie um desafio de robótica educacional para LEGO WeDo 2.0.
    TEMA: ${theme}
    DIFICULDADE: ${difficulty}
    
    REGRAS DE CAMPO CRÍTICAS PARA DISTANCIAMENTO MÁXIMO: 
    - As coordenadas X e Y dos elementos devem estar entre 10 e 110 (espaço ampliado).
    - IMPORTANTE: Mantenha uma distância mínima de 55 unidades entre cada elemento. Eles devem estar em quadrantes opostos.
    - O elemento 'start' deve estar sempre em um canto, ex: (10, 10).
    - O elemento 'end' deve estar no canto diagonalmente oposto, ex: (100, 100).
    - Coloque obstáculos ou checkpoints bem distantes da linha direta entre start e end para forçar curvas.
    - NÃO permita que elementos fiquem próximos. Se um está em X=20, o próximo deve estar em pelo menos X=75 ou Y=75.

    SIMULADOR DE PROGRAMAÇÃO:
    - Forneça uma sequência de passos lógicos (logicSteps) para o aluno montar no software WeDo.
    - Use ícones: 'start', 'motor', 'sensor', 'wait', 'stop', 'loop'.

    A resposta deve ser em JSON seguindo exatamente a estrutura fornecida.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          theme: { type: Type.STRING },
          difficulty: { type: Type.STRING },
          description: { type: Type.STRING },
          estimatedTimeSeconds: { type: Type.NUMBER },
          logicSteps: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                icon: { type: Type.STRING, enum: ['start', 'motor', 'sensor', 'wait', 'stop', 'loop'] },
                text: { type: Type.STRING }
              },
              required: ["icon", "text"]
            }
          },
          rules: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                points: { type: Type.NUMBER }
              },
              required: ["id", "title", "description", "points"]
            }
          },
          elements: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                x: { type: Type.NUMBER },
                y: { type: Type.NUMBER },
                label: { type: Type.STRING },
                type: { type: Type.STRING, enum: ["obstacle", "sensor_point", "start", "end", "checkpoint"] },
                description: { type: Type.STRING }
              },
              required: ["id", "x", "y", "label", "type", "description"]
            }
          }
        },
        required: ["name", "theme", "difficulty", "description", "rules", "elements", "logicSteps", "estimatedTimeSeconds"]
      }
    }
  });

  return JSON.parse(response.text.trim());
}
