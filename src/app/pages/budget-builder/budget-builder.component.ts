import { Component, inject, OnInit } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MessageService } from 'primeng/api';
import { BuildEditorComponent } from '../../shared/components/build-editor/build-editor.component';
import { BuildProgressBannerComponent } from '../../shared/components/build-progress-banner/build-progress-banner.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { PartsService } from '../../core/services/parts.service';
import { BuildLoadService } from '../../core/services/build-load.service';

@Component({
  selector: 'app-budget-builder',
  standalone: true,
  imports: [
    BuildEditorComponent,
    BuildProgressBannerComponent,
    PageHeaderComponent,
    TranslateModule,
  ],
  templateUrl: './budget-builder.component.html',
  styleUrl: './budget-builder.component.scss',
})
export class BudgetBuilderComponent implements OnInit {
  private readonly partsService = inject(PartsService);
  private readonly buildLoad = inject(BuildLoadService);
  private readonly messageService = inject(MessageService);
  private readonly translate = inject(TranslateService);

  ngOnInit(): void {
    void this.init();
  }

  private async init(): Promise<void> {
    await this.partsService.loadParts();
    const pending = this.buildLoad.consumePending();
    if (pending) {
      this.partsService.loadFromSavedParts(pending.parts);
      this.messageService.add({
        severity: 'info',
        summary: this.translate.instant('toast.loadedBuild'),
        detail: this.translate.instant('toast.loadedBuildDetail', { name: pending.name }),
      });
    }
  }
}
