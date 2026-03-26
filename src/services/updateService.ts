import { CapacitorHttp } from '@capacitor/core';
import packageJson from '../../package.json';

export interface ReleaseInfo {
  version: string;
  url: string;
  notes: string;
  publishedAt: string;
  assets: {
    name: string;
    browser_download_url: string;
  }[];
}

export interface UpdateCheckResult {
  hasUpdate: boolean;
  latestRelease?: ReleaseInfo;
  error?: string;
}

const GITHUB_REPO = 'malamoffo/flusso';
const API_URL = `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`;

export const updateService = {
  async checkForUpdates(): Promise<UpdateCheckResult> {
    try {
      const isNative = typeof window !== 'undefined' && (window as any).Capacitor?.isNativePlatform();
      
      let response;
      if (isNative) {
        response = await CapacitorHttp.get({ url: API_URL });
      } else {
        const res = await fetch(API_URL);
        if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);
        response = { data: await res.json(), status: res.status };
      }

      if (response.status !== 200) {
        throw new Error(`Failed to fetch latest release: ${response.status}`);
      }

      const data = response.data;
      const latestVersion = data.tag_name.replace(/^v/, '');
      const currentVersion = packageJson.version;

      const hasUpdate = this.compareVersions(currentVersion, latestVersion) < 0;

      return {
        hasUpdate,
        latestRelease: {
          version: latestVersion,
          url: data.html_url,
          notes: data.body,
          publishedAt: data.published_at,
          assets: data.assets.map((asset: any) => ({
            name: asset.name,
            browser_download_url: asset.browser_download_url
          }))
        }
      };
    } catch (error) {
      console.error('Update check failed:', error);
      return {
        hasUpdate: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },

  /**
   * Compares two version strings.
   * Returns -1 if v1 < v2, 1 if v1 > v2, 0 if v1 == v2.
   */
  compareVersions(v1: string, v2: string): number {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);
    
    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
      const p1 = parts1[i] || 0;
      const p2 = parts2[i] || 0;
      if (p1 < p2) return -1;
      if (p1 > p2) return 1;
    }
    return 0;
  }
};
