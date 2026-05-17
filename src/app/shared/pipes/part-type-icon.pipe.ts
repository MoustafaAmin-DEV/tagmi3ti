import { Pipe, PipeTransform } from '@angular/core';
import { PartType } from '../../core/models/part.model';

@Pipe({ name: 'partTypeIcon', standalone: true })
export class PartTypeIconPipe implements PipeTransform {
  private readonly icons: Record<PartType, string> = {
    CPU: 'pi-microchip',
    Motherboard: 'pi-sitemap',
    GPU: 'pi-desktop',
    RAM: 'pi-database',
    Case: 'pi-box',
    PSU: 'pi-bolt',
    Cooler: 'pi-sun',
  };

  transform(type: PartType): string {
    return this.icons[type] ?? 'pi-cog';
  }
}
