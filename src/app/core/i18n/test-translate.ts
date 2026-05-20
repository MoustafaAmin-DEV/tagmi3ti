import { TestBed } from '@angular/core/testing';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';

/** Arabic compat strings aligned with public/i18n/ar.json */
const AR_COMPAT = {
  socketMismatch: 'عدم تطابق السوكت: المعالج ({{cpu}}) واللوحة ({{mb}})',
  ramMismatch: 'نوع الرام غير متوافق: اللوحة تدعم {{mbRam}} والرام {{ram}}',
  gpuTooLong: 'طول كارت الشاشة ({{gpu}}mm) أكبر من سعة الكيس ({{case}}mm)',
  psuInsufficient: 'مزود الطاقة ({{psu}}W) غير كافٍ — المطلوب ~{{required}}W (مع هامش 20%)',
  bottleneckGpu: 'تحذير: كارت الشاشة أقوى بكثير من المعالج — قد يحدث اختناق (Bottleneck)',
  bottleneckCpu: 'تحذير: المعالج أقوى بكثير من كارت الشاشة — قد لا تستفيد من قوة المعالج',
  coolerTdp: 'قدرة تبريد المبرد ({{cooler}}W) أقل من TDP المعالج ({{cpu}}W)',
  coolerSocket: 'سوكت المبرد لا يدعم سوكت المعالج ({{socket}})',
};

export function provideTestTranslate() {
  return provideTranslateService({ fallbackLang: 'ar', lang: 'ar' });
}

export function configureTestTranslate(): void {
  const translate = TestBed.inject(TranslateService);
  translate.setTranslation('ar', { compat: AR_COMPAT });
  translate.use('ar');
}
