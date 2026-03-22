export interface DeviceFingerprint {
    deviceHash: string;
    userAgent: string;
    platform: string;
    language: string;
    screenResolution: string;
    colorDepth: number;
    timezone: string;
    gpuVendor: string;
    gpuRenderer: string;
    deviceMemory: number | string;
    cpuCores: number | string;
}

export const generateDeviceFingerprint = async (): Promise<DeviceFingerprint> => {
    const nav = window.navigator as any;

    const userAgent = nav.userAgent || 'unknown';
    const platform = nav.platform || 'unknown';
    const language = nav.language || 'unknown';
    const screenResolution = `${window.screen.width}x${window.screen.height}`;
    const colorDepth = window.screen.colorDepth || 24;
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'unknown';

    // WebGL
    let gpuVendor = 'unknown';
    let gpuRenderer = 'unknown';
    try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (gl) {
            const debugInfo = (gl as WebGLRenderingContext).getExtension('WEBGL_debug_renderer_info');
            if (debugInfo) {
                gpuVendor = (gl as WebGLRenderingContext).getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || 'unknown';
                gpuRenderer = (gl as WebGLRenderingContext).getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || 'unknown';
            }
        }
    } catch (e) {
        console.warn('WebGL extraction failed');
    }

    const deviceMemory = nav.deviceMemory || 'unknown';
    const cpuCores = nav.hardwareConcurrency || 'unknown';

    const payload = {
        userAgent,
        platform,
        language,
        screenResolution,
        colorDepth,
        timezone,
        gpuVendor,
        gpuRenderer,
        deviceMemory,
        cpuCores
    };

    // SHA-256 Hashing Process
    const payloadString = JSON.stringify(payload);
    const msgBuffer = new TextEncoder().encode(payloadString);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const deviceHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    return {
        deviceHash,
        ...payload
    };
};
