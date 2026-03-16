import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../../middleware/auth';
import Logger from '../../utils/logger';

const prisma = new PrismaClient();

// GET /api/recipes/:id/comments
export async function getRecipeComments(req: AuthRequest, res: Response) {
  try {
    const { id: recipeId } = req.params;
    const comments = await prisma.comment.findMany({
      where: { recipeId },
      include: { 
        user: { 
          select: { id: true, username: true, email: true, avatarUrl: true } 
        } 
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: comments });
  } catch (error) {
    Logger.error('Error fetching comments', error);
    res.status(500).json({ 
      success: false, 
      message: 'Errore nel recupero dei commenti',
      error: process.env.NODE_ENV === 'development' && error instanceof Error ? error.message : undefined
    });
  }
}

// POST /api/recipes/:id/comments
export async function createComment(req: AuthRequest, res: Response) {
  try {
    const { id: recipeId } = req.params;
    const { content } = req.body;
    const userId = req.user?.id;

    if (!userId) return res.status(401).json({ success: false, message: 'Utente non autenticato' });
    if (!content?.trim()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Il contenuto del commento è obbligatorio' 
      });
    }
    if (content.length > 1000) {
      return res.status(400).json({ 
        success: false, 
        message: 'Il commento non può superare i 1000 caratteri' 
      });
    }

    const [comment] = await prisma.$transaction([
      prisma.comment.create({
        data: { content: content.trim(), recipeId, userId },
        include: { 
          user: { 
            select: { id: true, username: true, email: true, avatarUrl: true } 
          } 
        }
      }),
      prisma.recipe.update({
        where: { id: recipeId },
        data: { commentCount: { increment: 1 } }
      })
    ]);

    res.status(201).json({
      success: true,
      message: 'Commento aggiunto con successo',
      data: comment
    });
  } catch (error) {
    Logger.error('Error creating comment', error);
    res.status(500).json({ 
      success: false, 
      message: 'Errore nella creazione del commento',
      error: process.env.NODE_ENV === 'development' && error instanceof Error ? error.message : undefined
    });
  }
}

// PUT /api/comments/:commentId
export async function updateComment(req: AuthRequest, res: Response) {
  try {
    const { commentId } = req.params;
    const { content } = req.body;
    const userId = req.user?.id;

    if (!userId) return res.status(401).json({ success: false, message: 'Utente non autenticato' });
    if (!content?.trim()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Il contenuto del commento è obbligatorio' 
      });
    }

    const comment = await prisma.comment.findUnique({ where: { id: commentId } });
    if (!comment) return res.status(404).json({ success: false, message: 'Commento non trovato' });
    if (comment.userId !== userId) {
      return res.status(403).json({ 
        success: false, 
        message: 'Non autorizzato a modificare questo commento' 
      });
    }

    const updatedComment = await prisma.comment.update({
      where: { id: commentId },
      data: { content: content.trim(), isEdited: true },
      include: { 
        user: { 
          select: { id: true, username: true, email: true, avatarUrl: true } 
        } 
      }
    });

    res.json({
      success: true,
      message: 'Commento aggiornato con successo',
      data: updatedComment
    });
  } catch (error) {
    Logger.error('Error updating comment', error);
    res.status(500).json({ 
      success: false, 
      message: 'Errore nell\'aggiornamento del commento',
      error: process.env.NODE_ENV === 'development' && error instanceof Error ? error.message : undefined
    });
  }
}

// DELETE /api/comments/:commentId
export async function deleteComment(req: AuthRequest, res: Response) {
  try {
    const { commentId } = req.params;
    const userId = req.user?.id;

    if (!userId) return res.status(401).json({ success: false, message: 'Utente non autenticato' });

    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: { recipe: { select: { id: true } } }
    });

    if (!comment) return res.status(404).json({ success: false, message: 'Commento non trovato' });
    if (comment.userId !== userId) {
      return res.status(403).json({ 
        success: false, 
        message: 'Non autorizzato a eliminare questo commento' 
      });
    }

    await prisma.$transaction([
      prisma.comment.delete({ where: { id: commentId } }),
      prisma.recipe.update({
        where: { id: comment.recipe.id },
        data: { commentCount: { decrement: 1 } }
      })
    ]);

    res.json({ success: true, message: 'Commento eliminato con successo' });
  } catch (error) {
    Logger.error('Error deleting comment', error);
    res.status(500).json({ 
      success: false, 
      message: 'Errore nell\'eliminazione del commento',
      error: process.env.NODE_ENV === 'development' && error instanceof Error ? error.message : undefined
    });
  }
}
