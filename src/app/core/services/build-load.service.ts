import { Injectable, signal } from '@angular/core';
import { SavedBuildRow } from '../models/build.model';

/** يمرّر تجميعة محفوظة إلى صفحة المحرّر (فحص التوافق / الميزانية) */
@Injectable({ providedIn: 'root' })
export class BuildLoadService {
  private readonly pending = signal<SavedBuildRow | null>(null);

  queueBuild(build: SavedBuildRow): void {
    this.pending.set(build);
  }

  consumePending(): SavedBuildRow | null {
    const build = this.pending();
    this.pending.set(null);
    return build;
  }

  hasPending(): boolean {
    return this.pending() !== null;
  }
}
