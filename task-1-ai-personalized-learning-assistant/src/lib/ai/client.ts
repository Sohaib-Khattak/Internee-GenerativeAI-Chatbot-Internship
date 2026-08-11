import OpenAI from 'openai';

const ZEN_BASE_URL = 'https://opencode.ai/zen/v1';
const ZEN_MODEL = 'deepseek-v4-flash-free';

export const ai = new OpenAI({
  apiKey: process.env.ZEN_API_KEY || '',
  baseURL: ZEN_BASE_URL,
});

export function getModel() {
  return ZEN_MODEL;
}
