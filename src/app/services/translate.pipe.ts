import { Pipe, PipeTransform, inject } from '@angular/core';
import { LanguageService } from './language.service';

@Pipe({ name: 'translate', standalone: true, pure: false })
export class TranslatePipe implements PipeTransform {
  private language = inject(LanguageService);
  private lastKey = '';
  private lastLang = '';
  private lastParamsJson = '';
  private lastResult = '';

  transform(key: string, params?: Record<string, string | number>): string {
    const currentLang = this.language.language();
    const hasParams = !!(params && Object.keys(params).length > 0);
    const paramsKey = hasParams ? JSON.stringify(params) : '';

    if (key === this.lastKey && currentLang === this.lastLang && paramsKey === this.lastParamsJson) {
      return this.lastResult;
    }

    this.lastKey = key;
    this.lastLang = currentLang;
    this.lastParamsJson = paramsKey;
    this.lastResult = this.language.t(key, params);
    return this.lastResult;
  }
}
