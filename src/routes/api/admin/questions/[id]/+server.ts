import { json } from '@sveltejs/kit';
import { connectDB } from '$lib/db';
import type { RequestHandler } from './$types';

// PUT - Mettre à jour une question
export const PUT: RequestHandler = async ({ params, request }) => {
  try {
    const data = await request.json();
    const db = await connectDB();
    
    const cleanId = params.id.includes(':') ? params.id.split(':')[1] : params.id;
    
    // Construire les SET statements
    const sets: string[] = [];
    
    if (data.question !== undefined) sets.push(`question = ${JSON.stringify(data.question)}`);
    if (data.questionType !== undefined) sets.push(`questionType = ${JSON.stringify(data.questionType)}`);
    if (data.difficulty !== undefined) sets.push(`difficulty = ${JSON.stringify(data.difficulty)}`);
    if (data.isActive !== undefined) sets.push(`isActive = ${data.isActive}`);
    if (data.explanation !== undefined) sets.push(`explanation = ${JSON.stringify(data.explanation)}`);
    if (data.imageUrl !== undefined) sets.push(`imageUrl = ${data.imageUrl ? JSON.stringify(data.imageUrl) : 'NONE'}`);
    if (data.imageCaption !== undefined) sets.push(`imageCaption = ${data.imageCaption ? JSON.stringify(data.imageCaption) : 'NONE'}`);
    
    // Options pour QCM
    if (data.options !== undefined) sets.push(`options = ${JSON.stringify(data.options)}`);
    if (data.optionImages !== undefined) sets.push(`optionImages = ${JSON.stringify(data.optionImages)}`);
    if (data.correctAnswer !== undefined) sets.push(`correctAnswer = ${typeof data.correctAnswer === 'boolean' ? data.correctAnswer : JSON.stringify(data.correctAnswer)}`);
    if (data.correctAnswers !== undefined) sets.push(`correctAnswers = ${JSON.stringify(data.correctAnswers)}`);
    
    // QCM Multiple
    if (data.answers !== undefined) sets.push(`answers = ${JSON.stringify(data.answers)}`);
    
    // Fill blank
    if (data.textWithBlanks !== undefined) sets.push(`textWithBlanks = ${JSON.stringify(data.textWithBlanks)}`);
    
    // Matching
    if (data.leftItems !== undefined) sets.push(`leftItems = ${JSON.stringify(data.leftItems)}`);
    if (data.rightItems !== undefined) sets.push(`rightItems = ${JSON.stringify(data.rightItems)}`);
    if (data.correctMatches !== undefined) sets.push(`correctMatches = ${JSON.stringify(data.correctMatches)}`);
    
    // Ordering
    if (data.items !== undefined) sets.push(`items = ${JSON.stringify(data.items)}`);
    if (data.correctOrder !== undefined) sets.push(`correctOrder = ${JSON.stringify(data.correctOrder)}`);
    
    // Open
    if (data.sampleAnswers !== undefined) sets.push(`sampleAnswers = ${JSON.stringify(data.sampleAnswers)}`);
    if (data.expectedKeywords !== undefined) sets.push(`expectedKeywords = ${JSON.stringify(data.expectedKeywords)}`);
    
    // Map Labels (carte interactive)
    if (data.svgContent !== undefined) sets.push(`svgContent = ${JSON.stringify(data.svgContent)}`);
    if (data.expectedAnswers !== undefined) sets.push(`expectedAnswers = ${JSON.stringify(data.expectedAnswers)}`);
    
    // Metadata (options de validation avancées)
    if (data.metadata !== undefined) {
      if (data.metadata && Object.keys(data.metadata).length > 0) {
        sets.push(`metadata = ${JSON.stringify(data.metadata)}`);
      } else {
        sets.push(`metadata = NONE`);
      }
    }
    
    // Matière
    if (data.matiere_id !== undefined) {
      if (data.matiere_id) {
        const cleanMatiereId = data.matiere_id.includes(':') ? data.matiere_id.split(':')[1] : data.matiere_id;
        sets.push(`matiere_id = type::thing("subject", "${cleanMatiereId}")`);
      } else {
        sets.push(`matiere_id = NONE`);
      }
    }
    
    // Thèmes
    if (data.theme_ids !== undefined) {
      if (data.theme_ids && data.theme_ids.length > 0) {
        const cleanThemeIds = data.theme_ids.map((id: string) => {
          const clean = id.includes(':') ? id.split(':')[1] : id;
          return `type::thing("theme", "${clean}")`;
        });
        sets.push(`theme_ids = [${cleanThemeIds.join(', ')}]`);
      } else {
        sets.push(`theme_ids = []`);
      }
    }
    
    sets.push(`updatedAt = time::now()`);
    
    const updateQuery = `
      UPDATE type::thing("question", "${cleanId}") SET
        ${sets.join(',\n        ')}
      RETURN AFTER
    `;
    
    const result = await db.query(updateQuery);
    const updated = (result[0] as any[])?.[0];

    return json({
      success: true,
      question: {
        ...updated,
        id: updated?.id?.toString()
      }
    });
  } catch (error) {
    console.error('Update question error:', error);
    return json({ message: 'Failed to update question' }, { status: 500 });
  }
};

// DELETE - Supprimer une question
export const DELETE: RequestHandler = async ({ params }) => {
  try {
    const db = await connectDB();
    const cleanId = params.id.includes(':') ? params.id.split(':')[1] : params.id;
    
    await db.query(`DELETE type::thing("question", "${cleanId}")`);
    
    return json({ success: true });
  } catch (error) {
    console.error('Delete question error:', error);
    return json({ message: 'Failed to delete question' }, { status: 500 });
  }
};
