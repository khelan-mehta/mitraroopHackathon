import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Check similarity between new note and existing notes
export const checkNoteSimilarity = async (noteContent, existingNotes) => {
  try {
    const existingContents = existingNotes.map(note => ({
      id: note._id,
      title: note.title,
      content: note.pages.map(p => p.content).join('\n').substring(0, 2000)
    }));

    const prompt = `Compare the following new note content with existing notes and determine if there's plagiarism or excessive similarity.

NEW NOTE CONTENT:
${noteContent.substring(0, 2000)}

EXISTING NOTES:
${existingContents.map((n, i) => `[${i + 1}] ${n.title}:\n${n.content}`).join('\n\n')}

Analyze and return:
1. A similarity score from 1-10 (1 = completely original, 10 = identical/plagiarized)
2. Brief reason for the score
3. IDs of similar notes (if any)

Return as JSON: { "score": number, "reason": "string", "similarNoteIds": ["id1", "id2"] }`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are an expert at detecting plagiarism and content similarity. Be strict but fair in your assessment.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3
    });

    const result = JSON.parse(response.choices[0].message.content);
    return result;
  } catch (error) {
    console.error('AI Similarity Check Error:', error);
    throw new Error('Failed to check note similarity');
  }
};

// Generate summary of note pages
export const generatePageSummary = async (pageContent) => {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that creates concise, accurate summaries of educational content. Keep summaries under 150 words.'
        },
        {
          role: 'user',
          content: `Summarize the following educational content in 150 words or less:\n\n${pageContent}`
        }
      ],
      temperature: 0.5,
      max_tokens: 300
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error('Summary Generation Error:', error);
    throw new Error('Failed to generate summary');
  }
};

// Generate brief summary of entire note
export const generateBriefSummary = async (notePages) => {
  try {
    const fullContent = notePages.map(p => p.content).join('\n\n');

    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that creates brief overviews of educational materials.'
        },
        {
          role: 'user',
          content: `Create a brief summary (3-5 bullet points) of the main topics covered in this educational content:\n\n${fullContent.substring(0, 4000)}`
        }
      ],
      temperature: 0.5,
      max_tokens: 400
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error('Brief Summary Error:', error);
    throw new Error('Failed to generate brief summary');
  }
};

// Generate quiz from content
export const generateQuiz = async (content, numberOfQuestions = 10) => {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are an expert educator creating multiple-choice quizzes. Create engaging, educational questions with clear correct answers.'
        },
        {
          role: 'user',
          content: `Create ${numberOfQuestions} multiple-choice questions based on this content. Return as JSON array with format: [{ "question": "...", "options": ["A", "B", "C", "D"], "correctAnswer": 0, "explanation": "..." }]\n\nContent:\n${content.substring(0, 3000)}`
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7
    });

    const result = JSON.parse(response.choices[0].message.content);
    return result.questions || [];
  } catch (error) {
    console.error('Quiz Generation Error:', error);
    throw new Error('Failed to generate quiz');
  }
};

// Generate flashcards
export const generateFlashcards = async (content, numberOfCards = 10) => {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are an expert at creating educational flashcards. Create clear, concise Q&A pairs that help with memorization and understanding.'
        },
        {
          role: 'user',
          content: `Create ${numberOfCards} flashcards based on this content. Return as JSON array with format: [{ "front": "question", "back": "answer" }]\n\nContent:\n${content.substring(0, 3000)}`
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.6
    });

    const result = JSON.parse(response.choices[0].message.content);
    return result.flashcards || [];
  } catch (error) {
    console.error('Flashcard Generation Error:', error);
    throw new Error('Failed to generate flashcards');
  }
};
