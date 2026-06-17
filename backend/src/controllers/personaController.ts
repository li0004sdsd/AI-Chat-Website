import { Request, Response } from 'express';
import { personas, getPersonaById, getPersonasByCategory, getCategories } from '../data/personas';

export function getAllPersonas(req: Request, res: Response): void {
  try {
    res.json({
      personas,
      total: personas.length,
    });
  } catch (error) {
    console.error('Get personas error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export function getPersona(req: Request, res: Response): void {
  try {
    const { id } = req.params;
    const persona = getPersonaById(id);

    if (!persona) {
      res.status(404).json({ error: 'Persona not found' });
      return;
    }

    res.json({ persona });
  } catch (error) {
    console.error('Get persona error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export function getPersonaCategories(req: Request, res: Response): void {
  try {
    const categories = getCategories();
    res.json({ categories });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export function getPersonasByCat(req: Request, res: Response): void {
  try {
    const { category } = req.params;
    const filtered = getPersonasByCategory(category);
    res.json({
      personas: filtered,
      total: filtered.length,
    });
  } catch (error) {
    console.error('Get personas by category error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
