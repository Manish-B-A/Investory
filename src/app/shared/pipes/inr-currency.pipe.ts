import { Pipe, PipeTransform } from '@angular/core';
import { formatINR } from '../../core/utilities/helpers';

@Pipe({
  name: 'inr',
  standalone: true,
})
export class InrCurrencyPipe implements PipeTransform {
  transform(value: number | null | undefined): string {
    return formatINR(value);
  }
}
