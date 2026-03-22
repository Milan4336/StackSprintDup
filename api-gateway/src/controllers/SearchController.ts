import { Request, Response } from 'express';
import { SearchService } from '../services/SearchService';

export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  query = async (req: Request, res: Response): Promise<void> => {
    const q = String(req.query.q ?? '');
    const result = await this.searchService.search(q);
    res.status(200).json(result);
  };
}
