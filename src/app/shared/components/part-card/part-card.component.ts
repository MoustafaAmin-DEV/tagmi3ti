import { DecimalPipe } from '@angular/common';
import { Component, input } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { Card } from 'primeng/card';
import { Part } from '../../../core/models/part.model';
import { getStorePrice } from '../../../core/utils/part-price.util';
import { PartTypeIconPipe } from '../../pipes/part-type-icon.pipe';

@Component({
  selector: 'app-part-card',
  standalone: true,
  imports: [Card, PartTypeIconPipe, DecimalPipe, TranslateModule],
  templateUrl: './part-card.component.html',
})
export class PartCardComponent {
  readonly part = input.required<Part>();

  storePrice(): number | null {
    return getStorePrice(this.part());
  }
}
