import { Pipe, PipeTransform, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { PartType } from '../../core/models/part.model';

@Pipe({ name: 'partTypeLabel', standalone: true, pure: false })
export class PartTypeLabelPipe implements PipeTransform {
  private readonly translate = inject(TranslateService);

  transform(type: PartType | string | undefined): string {
    if (!type) {
      return '';
    }
    return this.translate.instant(`partType.${type}`);
  }
}
