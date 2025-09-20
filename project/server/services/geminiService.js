const { GoogleGenerativeAI } = require('@google/generative-ai');

class GeminiService {
  constructor() {
    if (!process.env.GEMINI_API_KEY) {
      console.error('⚠️ GEMINI_API_KEY not found in environment variables');
      return;
    }

    // Initialize Gemini
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    // Fast model (cheap, quick)
    this.flashModel = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Pro model (slower, better reasoning)
    this.proModel = this.genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
  }

  /**
   * Safely parse JSON from Gemini response
   */
  safeParse(response) {
    try {
      return JSON.parse(response);
    } catch {
      // Try to extract JSON-like part
      const jsonMatch = response.match(/\{[\s\S]*\}/) || response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[0]);
        } catch {
          return null;
        }
      }
      return null;
    }
  }

  /**
   * Analyze text to classify as emergency alert
   */
  async analyzeAlert(textContent) {
    try {
      const prompt = `
      Analyze the following text and determine if it should trigger an emergency alert.
      
      Text: "${textContent}"

      Respond ONLY in JSON format:
      {
        "alert": true/false,
        "type": "drill/emergency/warning/info",
        "title": "Brief alert title",
        "description": "Detailed description of the alert",
        "severity": "low/medium/high/critical"
      }`;

      const result = await this.flashModel.generateContent(prompt);
      const response = result.response.text();
      return this.safeParse(response);
    } catch (error) {
      console.error("Gemini alert analysis error:", error);
      throw new Error("Failed to analyze alert content");
    }
  }

  /**
   * Generate multiple-choice quizzes from training content
   */
  async generateQuiz(trainingContent) {
    try {
      const prompt = `
      Based on the following emergency preparedness content, generate 3–5 multiple choice questions.
      
      Content: "${trainingContent}"
      
      Respond ONLY in JSON array format:
      [
        {
          "question": "Question text?",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "answer": 0,
          "category": "fire/earthquake/flood/medical/weather/general",
          "difficulty": "easy/medium/hard"
        }
      ]`;

      const result = await this.proModel.generateContent(prompt);
      const response = result.response.text();
      return this.safeParse(response) || [];
    } catch (error) {
      console.error("Gemini quiz generation error:", error);
      throw new Error("Failed to generate quiz questions");
    }
  }

  /**
   * Generate chatbot response with optional chat history
   */
  async chatResponse(userMessage, chatHistory = []) {
    try {
      const recentHistory = chatHistory.slice(-5); // keep last 5 turns
      const contextPrompt = recentHistory.length > 0
        ? `Conversation so far:\n${recentHistory.map(chat => `User: ${chat.message}\nAI: ${chat.response}`).join('\n')}\n\n`
        : '';

      const prompt = `
      ${contextPrompt}
      You are CalamitySense AI, an emergency preparedness and disaster response assistant. 
      
      User message: "${userMessage}"

      Guidelines:
      - Provide helpful, accurate emergency preparedness advice
      - Be empathetic and supportive
      - If it's a life-threatening emergency, advise calling local emergency services immediately
      - Keep responses practical, step-by-step, and under 200 words
      `;

      const result = await this.flashModel.generateContent(prompt);
      return result.response.text().trim();
    } catch (error) {
      console.error("Gemini chat response error:", error);
      throw new Error("Failed to generate chat response");
    }
  }
}

module.exports = new GeminiService();
