import { Component, inject } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { ProgressBar } from 'primeng/progressbar';
import { PART_TYPES } from '../../../core/constants/part-types';
import { PartType } from '../../../core/models/part.model';
import { PartsService } from '../../../core/services/parts.service';
import { PartTypeLabelPipe } from '../../pipes/part-type-label.pipe';

@Component({
  selector: 'app-build-progress-banner',
  standalone: true,
  imports: [ProgressBar, TranslateModule, PartTypeLabelPipe],
  templateUrl: './build-progress-banner.component.html',
  styleUrl: './build-progress-banner.component.scss',
})
export class BuildProgressBannerComponent {
  readonly partsService = inject(PartsService);
  readonly partTypes = PART_TYPES;

  missingTypes(): PartType[] {
    const selected = this.partsService.selectedParts();
    return this.partTypes.filter((t) => !selected[t]);
  }
}
