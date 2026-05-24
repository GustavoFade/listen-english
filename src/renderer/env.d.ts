import type { ElectronAPI } from '@shared/types';

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

declare module '*.css' {
  const content: Record<string, string>;
  export default content;
}

export {};
