// AI Service - now routed through external Python backend.
// We preserve the same public methods, but delegate to pythonBackend.
import { pythonBackend } from './pythonBackendService';

export interface GroqMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface GroqResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

export class GroqService {
  // callGroqAPI removed; replaced by pythonBackend endpoints.

  // Generate topic suggestions
  async generateTopicSuggestions(tutorExpertise: string[], teachingStyle: string, personality: string, tutorPublicId?: string): Promise<Array<{
    topic: string;
    description: string;
    difficulty: "beginner" | "intermediate" | "advanced";
    expertise_area: string;
  }>> {
    const prompt = `Generate exactly 6 learning topics for ${tutorExpertise.join(", ")} expert with ${teachingStyle} style and ${personality} personality.

Return ONLY this JSON array:
[{"topic": "Topic Name", "description": "Brief description", "difficulty": "beginner", "expertise_area": "Area"}]`;

    try {
      if (tutorPublicId) {
        const r = await pythonBackend.suggestTopics(tutorPublicId);
        return (r as any)?.suggestions || [];
      }
      // Fallback simple suggestions if no tutor ID provided
      return tutorExpertise.slice(0, 6).map(area => ({
        topic: `Introduction to ${area}`,
        description: `Learn the basics of ${area}`,
        difficulty: "beginner" as const,
        expertise_area: area
      }));
    } catch (error) {
      console.error('Topic suggestions via Python backend failed:', error);
      return tutorExpertise.slice(0, 6).map(area => ({
        topic: `Introduction to ${area}`,
        description: `Learn the basics of ${area}`,
        difficulty: "beginner" as const,
        expertise_area: area
      }));
    }
  }

  // Generate tutor chat response
  async generateTutorResponse(
    userMessage: string,
    tutorExpertise: string[],
    teachingStyle: string,
    personality: string,
    ragContext?: string
  ): Promise<string> {
    let prompt = `You are an expert tutor in: ${tutorExpertise.join(", ")}. 
Teaching style: ${teachingStyle}. 
Personality: ${personality}.

Student: "${userMessage}"`;

    // Add RAG context if available
    if (ragContext && ragContext.trim()) {
      prompt += `\n\nAdditional context:\n${ragContext}\n\nUse this information to provide a more accurate and detailed response.`;
    }

    prompt += `\n\nProvide a helpful, educational response that:
1. Directly addresses the student's question
2. Uses your expertise to explain concepts clearly
3. Follows your teaching style and personality
4. If there's course module context, reference it appropriately
5. Keep it conversational but educational (2-4 sentences)`;

    // No HTTP tutor-chat endpoint available yet; return a friendly fallback using context
    const contextHint = ragContext && ragContext.trim() ? ' I will use your materials to guide the answer.' : '';
    return `Thanks for the question.${contextHint} ${userMessage?.length > 0 ? 'Here\'s a concise explanation: ' : ''}`.trim();
  }

  // Generate course outline
  async generateCourseOutline(
    topic: string,
    tutorExpertise: string[],
    teachingStyle: string
  ): Promise<{
    title: string;
    description: string;
    learning_objectives: string[];
    estimated_duration: string;
    difficulty_level: string;
    modules: Array<{
      id: number;
      course_id: number;
      title: string;
      description: string;
      order: number;
      content: any;
      status: 'pending' | 'completed';
    }>;
  }> {
    const prompt = `Create a course outline for "${topic}" by ${tutorExpertise.join(", ")} expert with ${teachingStyle} style.

Return ONLY this JSON format:
{
  "title": "Course Title",
  "description": "Brief description",
  "learning_objectives": ["Objective 1", "Objective 2"],
  "estimated_duration": "4 weeks",
  "difficulty_level": "intermediate",
  "modules": [
    {"id": 1, "course_id": 1, "title": "Module 1", "description": "Description", "order": 1, "content": "", "status": "pending"},
    {"id": 2, "course_id": 1, "title": "Module 2", "description": "Description", "order": 2, "content": "", "status": "pending"},
    {"id": 3, "course_id": 1, "title": "Module 3", "description": "Description", "order": 3, "content": "", "status": "pending"}
  ]
}`;

    try {
      // No standalone endpoint; leave behavior to callers (some flows generate on session creation server-side)
      // Return a minimal local outline as a compatibility fallback
      return {
        title: `Introduction to ${topic}`,
        description: `A comprehensive course covering ${topic}`,
        learning_objectives: [
          `Understand the basics of ${topic}`,
          `Apply ${topic} concepts in practical scenarios`,
          `Master advanced ${topic} techniques`
        ],
        estimated_duration: "4 weeks",
        difficulty_level: "intermediate",
        modules: [
          { id: 1, course_id: 1, title: `Introduction to ${topic}`, description: "Get started with the basics", order: 1, content: "", status: "pending" as const },
          { id: 2, course_id: 1, title: `${topic} Fundamentals`, description: "Core concepts and principles", order: 2, content: "", status: "pending" as const },
          { id: 3, course_id: 1, title: `Advanced ${topic}`, description: "Deep dive into advanced topics", order: 3, content: "", status: "pending" as const }
        ]
      };
    } catch (error) {
      console.error('Course outline via Python backend failed:', error);
      return {
        title: `Introduction to ${topic}`,
        description: `A comprehensive course covering ${topic}`,
        learning_objectives: [
          `Understand the basics of ${topic}`,
          `Apply ${topic} concepts in practical scenarios`,
          `Master advanced ${topic} techniques`
        ],
        estimated_duration: "4 weeks",
        difficulty_level: "intermediate",
        modules: [
          { id: 1, course_id: 1, title: `Introduction to ${topic}`, description: "Get started with the basics", order: 1, content: "", status: "pending" as const },
          { id: 2, course_id: 1, title: `${topic} Fundamentals`, description: "Core concepts and principles", order: 2, content: "", status: "pending" as const },
          { id: 3, course_id: 1, title: `Advanced ${topic}`, description: "Deep dive into advanced topics", order: 3, content: "", status: "pending" as const }
        ]
      };
    }
  }

  // Validate topic
  async validateTopic(topic: string, tutorExpertise: string[]): Promise<{
    is_relevant: boolean;
    confidence: number;
    suggested_alternatives: string[];
    reasoning: string;
  }> {
    const prompt = `You are an AI assistant. Validate if "${topic}" is relevant for a tutor with expertise in ${tutorExpertise.join(", ")}.

Return ONLY a valid JSON object in this exact format:
{
  "is_relevant": true,
  "confidence": 0.8,
  "suggested_alternatives": ["alt1", "alt2"],
  "reasoning": "Brief explanation"
}

Do not include any other text, explanations, or formatting. Just the JSON object.`;

    try {
      const lastTutorId = localStorage.getItem('last_active_tutor_public_id') || '';
      if (lastTutorId) {
        const r = await pythonBackend.validateTutorTopic(lastTutorId, topic);
        return (r as any)?.validation || r;
      }
      // Fallback local check when tutor id is unknown
      const isRelevant = tutorExpertise.some(expertise =>
        topic.toLowerCase().includes(expertise.toLowerCase()) || expertise.toLowerCase().includes(topic.toLowerCase())
      );
      return {
        is_relevant: isRelevant,
        confidence: isRelevant ? 0.8 : 0.3,
        suggested_alternatives: isRelevant ? [] : tutorExpertise.slice(0, 2),
        reasoning: isRelevant ? 'Topic matches tutor expertise' : "Topic doesn't align with tutor expertise",
      };
    } catch (error) {
      console.error('Topic validation via Python backend failed:', error);
      const isRelevant = tutorExpertise.some(expertise =>
        topic.toLowerCase().includes(expertise.toLowerCase()) || expertise.toLowerCase().includes(topic.toLowerCase())
      );
      return {
        is_relevant: isRelevant,
        confidence: isRelevant ? 0.8 : 0.3,
        suggested_alternatives: isRelevant ? [] : tutorExpertise.slice(0, 2),
        reasoning: isRelevant ? 'Topic matches tutor expertise' : "Topic doesn't align with tutor expertise",
      };
    }
  }
}

export const groqService = new GroqService();
