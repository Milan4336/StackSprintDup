import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../config/env';
import { logger } from '../config/logger';
import { secretProvider } from '../config/secrets';

export class GeminiService {
    private genAI: GoogleGenerativeAI | null = null;
    private model: any = null;
    private embeddingModel: any = null;
    private initializing: Promise<void> | null = null;

    private async initIfNeeded(): Promise<void> {
        if (this.model) return;
        if (this.initializing) {
            await this.initializing;
            return;
        }

        this.initializing = (async () => {
            const apiKey = await secretProvider.get('GOOGLE_GEMINI_API_KEY');
            if (!apiKey) {
                logger.warn('GOOGLE_GEMINI_API_KEY not found. GeminiService will run in dummy mode.');
                return;
            }

            this.genAI = new GoogleGenerativeAI(apiKey);
            this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
            this.embeddingModel = this.genAI.getGenerativeModel({ model: 'text-embedding-004' });
        })();

        await this.initializing;
    }

    isConfigured(): boolean {
        return Boolean(this.model || env.GOOGLE_GEMINI_API_KEY || env.SECRET_PROVIDER === 'vault');
    }

    async generateResponse(prompt: string, context?: string): Promise<string> {
        await this.initIfNeeded();

        if (!this.model) {
            return "I'm sorry, I'm currently in dummy mode because the Gemini API key is missing. Please configure GOOGLE_GEMINI_API_KEY in the environment.";
        }

        try {
            const cleanPrompt = prompt.trim().slice(0, 4000);
            const cleanContext = context?.slice(0, 30000);
            const fullPrompt = cleanContext
                ? `CONTEXT ANALYSIS:\n${cleanContext}\n\nUSER QUESTION: ${cleanPrompt}\n\nINSTRUCTION: Analyze the evidence above and provide the requested intelligence. Feel free to use your broader reasoning capabilities if the context is insufficient.`
                : cleanPrompt;

            const result = await this.model.generateContent(fullPrompt);
            const response = await result.response;
            return response.text();
        } catch (error) {
            logger.error({ error }, 'Error calling Gemini API');
            return "I encountered an error while processing your request. Please try again later.";
        }
    }

    async embedText(text: string): Promise<number[] | null> {
        await this.initIfNeeded();
        if (!this.embeddingModel) return null;

        try {
            const result = await this.embeddingModel.embedContent(text.slice(0, 4000));
            const values = result?.embedding?.values;
            if (Array.isArray(values)) {
                return values.map((value: any) => Number(value));
            }
            return null;
        } catch (error) {
            logger.error({ error }, 'Error generating Gemini embedding');
            return null;
        }
    }
}

export const geminiService = new GeminiService();
