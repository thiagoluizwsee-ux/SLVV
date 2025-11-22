import { GoogleGenAI } from "@google/genai";
import { Vehicle, HistoryLog } from "../types";

const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error("API_KEY is not set in environment variables.");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const analyzeFleet = async (vehicles: Vehicle[], history: HistoryLog[]): Promise<string> => {
  const ai = getAiClient();
  if (!ai) return "Erro: Chave de API não configurada.";

  const prompt = `
    Você é um assistente sênior de gestão de frota do Metrô de São Paulo.
    Analise os dados atuais dos veículos e o histórico recente para fornecer um relatório curto e executivo.
    
    Dados Atuais dos Veículos:
    ${JSON.stringify(vehicles, null, 2)}

    Histórico Recente (Últimos 20 movimentos):
    ${JSON.stringify(history.slice(0, 20), null, 2)}

    Por favor, forneça:
    1. Resumo do status da frota (quantos em manutenção vs operação).
    2. Alertas sobre veículos parados há muito tempo ou movimentações excessivas.
    3. Sugestões de otimização logística baseadas nas localizações (PAT, ETC, RAMAL).
    
    Use formatação Markdown simples. Seja profissional e direto.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    return response.text || "Não foi possível gerar o relatório no momento.";
  } catch (error) {
    console.error("Error generating fleet report:", error);
    return "Erro ao conectar com o serviço de inteligência artificial.";
  }
};