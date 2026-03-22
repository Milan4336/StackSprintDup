import { Request, Response } from 'express';
import { MlServiceClient } from '../services/MlServiceClient';
import { SystemHealthService } from '../services/SystemHealthService';
import fs from 'fs';
import path from 'path';

export class SystemController {
  constructor(
    private readonly mlServiceClient: MlServiceClient,
    private readonly systemHealthService: SystemHealthService
  ) { }

  mlStatus = async (_req: Request, res: Response): Promise<void> => {
    res.status(200).json(this.mlServiceClient.getStatus());
  };

  health = async (_req: Request, res: Response): Promise<void> => {
    const result = await this.systemHealthService.getHealth();
    res.status(200).json(result);
  };

  updates = async (_req: Request, res: Response): Promise<void> => {
    try {
      const isDocker = fs.existsSync('/.dockerenv');
      const basePath = isDocker ? process.cwd() : path.join(process.cwd(), '..');
      const notesPath = path.join(basePath, 'PATCH_NOTES.md');
      const content = fs.readFileSync(notesPath, 'utf8');

      const updatesList: any[] = [];
      const sections = content.split(/^## /m).slice(1); // Split by "## " and ignore the header

      for (const section of sections) {
        // Parse "\[Version\] — Date"
        const headerMatch = section.match(/^\[(.*?)\]\s*(?:—|-)\s*(.*)$/m);
        if (!headerMatch) continue;

        const version = headerMatch[1].trim();
        const date = headerMatch[2].trim();

        // Parse "### Title"
        const titleMatch = section.match(/^### (.*)$/m);
        const title = titleMatch ? titleMatch[1].trim() : 'System Update';

        // Extract everything after the title as details
        let details = '';
        if (titleMatch) {
          const titleIndex = section.indexOf(titleMatch[0]);
          details = section.slice(titleIndex + titleMatch[0].length).trim();
        }

        const firstLine = details.split('\n').find(line => line.trim().length > 0) || '';
        const description = firstLine.replace(/^- \*\*.*?\*\*:?\s*/, '').trim();

        // Heuristics for type, icon, color
        const type = version.toLowerCase().includes('release') ? 'major' :
          title.toLowerCase().includes('fix') ? 'fix' : 'feature';

        const isMajor = type === 'major';
        const isFix = type === 'fix';

        let icon = 'Zap';
        let color = 'blue';

        if (isMajor) {
          icon = 'Layout';
          color = 'indigo';
        } else if (title.toLowerCase().includes('data') || title.toLowerCase().includes('pipeline')) {
          icon = 'Database';
          color = 'emerald';
        } else if (title.toLowerCase().includes('ml') || title.toLowerCase().includes('neural')) {
          icon = 'Cpu';
          color = 'purple';
        } else if (title.toLowerCase().includes('security') || title.toLowerCase().includes('containment')) {
          icon = 'Shield';
          color = 'amber';
        }

        updatesList.push({
          version,
          date,
          title,
          description,
          details,
          type,
          icon,
          color
        });
      }

      res.status(200).json(updatesList);
    } catch (error) {
      console.error("Failed to parse PATCH_NOTES.md", error);
      res.status(500).json({ error: "Failed to fetch updates" });
    }
  };
}
