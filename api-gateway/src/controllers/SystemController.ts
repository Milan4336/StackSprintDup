import { Request, Response } from 'express';
import { MlServiceClient } from '../services/MlServiceClient';
import { SystemHealthService } from '../services/SystemHealthService';

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
    const updatesList = [
      {
        version: 'Patch v3.9',
        date: 'Today',
        title: 'Surgical Intelligence & Deployment Sync',
        description: 'Resolved the Autonomous Actions "Connecting..." hang with proactive socket state checks. Refined the cinematic chart hover aesthetics to eliminate bright background washouts. Synchronized the global repository with surgical v3.8+ deployment parity.',
        type: 'fix',
        icon: 'Shield',
        color: 'emerald'
      },
      {
        version: 'Release v3.8',
        date: 'Today',
        title: 'Ultra-HUD & Mission Control Overhaul',
        description: 'Complete reconstruct of the command center interface into a high-fidelity Ultra-HUD environment. Introduced glassmorphism architecture, corner-clipped tactical panels, and immersive forensic scanlines. Refined the Overview into a mission-critical "Mission Control" state and synchronized the entire forensic investigation lifecycle with technical data readouts.',
        type: 'major',
        icon: 'Layout',
        color: 'blue'
      },
      {
        version: 'Release v3.7',
        date: 'Today',
        title: 'Cinematic Intelligence & Security Portal',
        description: 'Implemented a massive high-fidelity visual and intelligence suite. Introduced 50+ elite features including the Defense Shield (Total Lockdown), Threat Shockwave, Geo Trajectories, and Neural Flow. Integrated the personal Security Portal for cardholders with intelligent role-based redirection. Added the ThreatAudioEngine for real-time risk sonification and Forensic Scanlines for deep investigation.',
        type: 'major',
        icon: 'Zap',
        color: 'indigo'
      },
      {
        version: 'Patch v3.6',
        date: 'Today',
        title: 'Network Intelligence & UI Refinement',
        description: 'Enhanced the Fraud Relationship Graph with full D3 zoom and pan interactivity for complex forensic deep-dives. Upgraded global connection status with a hardware-emulated persistent pulsar animation (green-active). Refined the Autonomous Actions feed with centralized store-based persistence. Removed legacy Fraud Radar to declutter the executive workspace.',
        type: 'feature',
        icon: 'Zap',
        color: 'blue'
      },
      {
        version: 'Patch v3.5',
        date: 'Today',
        title: 'Full Data Pipeline Restoration',
        description: 'Successfully restored all broken data bindings, API endpoints, and realtime listeners. Implemented 12-part master restoration: Dashboard KPIs, Threat Index visuals (0-100 normalization), Geo Analytics heatmaps with geo.live socket binding, Forensic transaction explanations, and live transaction counters. Fixed Geo Analytics unmount crash that was terminating global socket connections.',
        type: 'major',
        icon: 'Rocket',
        color: 'emerald'
      },
      {
        version: 'Patch v3.4',
        date: 'Today',
        title: 'Visual Intelligence Layer',
        description: 'Introduced a full enterprise visual intelligence overlay: dynamic Threat Atmosphere background that breathes with threat level, screen-border glow (yellow/orange/red pulsing), radial shockwave pulses on threat spikes, rotating SVG Fraud Radar with live transaction dots, ML activity indicator in the header, Attack Mode scanlines overlay on system.spike events, and pulsing health indicators in System Status Bar. All visuals GPU-accelerated via Framer Motion and bound to Zustand+Socket.io realtime state.',
        type: 'major',
        icon: 'Zap',
        color: 'red'
      },
      {
        version: 'Patch v3.3',
        date: 'Today',
        title: 'Executive Mode Dashboard',
        description: 'Added an Executive Mode toggle that strips away detailed datatables and forensic tools, presenting only top-level KPIs (KL Divergence, System Stress) to c-suite users.',
        type: 'feature',
        icon: 'Rocket',
        color: 'blue'
      },
      {
        version: 'Patch v3.2',
        date: 'Today',
        title: 'Dashboard Intelligence Worker',
        description: 'Introduced background cron jobs to pre-compute rolling aggregations (Threat Index, Velocity, Risk Pulse) every 10 seconds, drastically lowering API Gateway load.',
        type: 'feature',
        icon: 'Cpu',
        color: 'emerald'
      },
      {
        version: 'Patch v3.1',
        date: 'Today',
        title: 'Redis Realtime Event Bus',
        description: 'Re-architected the realtime websocket layer to use a centralized Redis Pub/Sub Event Bus. Subscriptions are now route-dependent, reducing global client payload by 85%.',
        type: 'major',
        icon: 'Database',
        color: 'red'
      },
      {
        version: 'Release v3.0',
        date: 'Today',
        title: 'Modular Intelligence Console',
        description: 'Transformed the legacy dashboard into a 10-module enterprise intelligence console. Rebuilt navigation with a collapsible LeftNav and dynamic routing for optimal workspace utilization.',
        type: 'major',
        icon: 'Layout',
        color: 'indigo'
      },
      {
        version: 'Patch v2.5',
        date: 'Feb 2026',
        title: 'Multi-Dimensional Intelligence Fusion',
        description: 'Integrated behavioral profiling and fraud graph relationship detection into the core scoring pipeline. Implemented weighted fusion of Rules, ML, Behavior, and Graph scores.',
        type: 'major',
        icon: 'Database',
        color: 'emerald'
      },
      {
        version: 'Patch v2.1',
        date: 'Feb 2026',
        title: 'Bank-Grade ML Ensemble System',
        description: 'Upgraded to a 3-model weighted ensemble (XGBoost + Autoencoder + iForest) with refined confidence scoring and model fallback logic.',
        type: 'major',
        icon: 'Cpu',
        color: 'blue'
      },
      {
        version: 'Patch v1.9',
        date: 'Feb 2026',
        title: 'Cinematic Boot & ECG Pulsation',
        description: 'Implemented high-impact SystemBootIntro orbital animations and realtime ECG-pulse connectivity indicators for command center presence.',
        type: 'feature',
        icon: 'Zap',
        color: 'amber'
      },
      {
        version: 'Patch v1.5',
        date: 'Jan 2026',
        title: 'Enterprise Fraud Radar',
        description: 'Launched geospatial fraud intelligence with heatmaps, clustering, and suspicious geo-jump path detection.',
        type: 'major',
        icon: 'Globe',
        color: 'indigo'
      }
    ];
    res.status(200).json(updatesList);
  };
}
