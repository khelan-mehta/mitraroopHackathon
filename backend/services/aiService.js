import OpenAI from 'openai';

let openai; // 🔑 lazy instance

const getOpenAI = () => {
  if (!openai) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is missing');
    }

    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }
  return openai;
};

// Check similarity between new note and existing notes
export const checkNoteSimilarity = async (noteContent, existingNotes) => {
  try {
    const openai = getOpenAI();

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

    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    console.error('AI Similarity Check Error:', error);
    throw new Error('Failed to check note similarity');
  }
};

// Generate summary of note pages
export const generatePageSummary = async (pageContent) => {
  try {
    const openai = getOpenAI();

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
    const openai = getOpenAI();

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
    const openai = getOpenAI();

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
    const openai = getOpenAI();

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

/**
 * Extract text from an image using OpenAI Vision
 * @param {string} imageUrl - URL of the image or base64 data URI
 * @returns {Promise<string>} - Extracted text from the image
 */
export const extractTextFromImage = async (imageUrl) => {
  try {
    const openai = getOpenAI();

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are an OCR expert. Extract all text from the provided image accurately. Preserve formatting like paragraphs, bullet points, and headings. If there are diagrams or figures, describe them briefly. Return only the extracted content.'
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Extract all the text content from this image. Include any handwritten notes, printed text, diagrams labels, and formulas. Preserve the structure and formatting.'
            },
            {
              type: 'image_url',
              image_url: {
                url: imageUrl
              }
            }
          ]
        }
      ],
      max_tokens: 4096,
      temperature: 0.2
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error('Image Text Extraction Error:', error);
    throw new Error('Failed to extract text from image');
  }
};

/**
 * Extract text from multiple images
 * @param {string[]} imageUrls - Array of image URLs
 * @returns {Promise<Array<{url: string, text: string}>>}
 */
export const extractTextFromMultipleImages = async (imageUrls) => {
  try {
    const results = await Promise.all(
      imageUrls.map(async (url) => {
        const text = await extractTextFromImage(url);
        return { url, text };
      })
    );
    return results;
  } catch (error) {
    console.error('Multiple Image Extraction Error:', error);
    throw new Error('Failed to extract text from images');
  }
};

/**
 * Analyze note images and generate comprehensive content
 * @param {string[]} imageUrls - Array of image URLs
 * @param {string} subject - Subject of the notes
 * @returns {Promise<{extractedText: string, summary: string, keyPoints: string[]}>}
 */
export const analyzeNoteImages = async (imageUrls, subject = 'General') => {
  try {
    const openai = getOpenAI();

    // Build content array with all images
    const imageContent = imageUrls.map(url => ({
      type: 'image_url',
      image_url: { url }
    }));

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are an expert educational content analyzer specializing in ${subject}. Analyze the provided note images and extract comprehensive information.`
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Analyze these note images and provide:
1. Complete extracted text (preserving structure)
2. A concise summary of the content
3. Key points and concepts covered

Return as JSON: {
  "extractedText": "full extracted text...",
  "summary": "concise summary...",
  "keyPoints": ["point 1", "point 2", ...]
}`
            },
            ...imageContent
          ]
        }
      ],
      response_format: { type: 'json_object' },
      max_tokens: 4096,
      temperature: 0.3
    });

    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    console.error('Note Image Analysis Error:', error);
    throw new Error('Failed to analyze note images');
  }
};
