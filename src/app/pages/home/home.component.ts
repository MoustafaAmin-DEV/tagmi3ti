import { NgClass } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { Card } from 'primeng/card';
import { Button } from 'primeng/button';

interface FeatureCard {
  titleKey: string;
  descKey: string;
  icon: string;
  route: string;
  accent: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [NgClass, Card, Button, RouterLink, TranslateModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent {
  readonly features: FeatureCard[] = [
    {
      titleKey: 'home.featureCheckerTitle',
      descKey: 'home.featureCheckerDesc',
      icon: 'pi-check-circle',
      route: '/checker',
      accent: 'default',
    },
    {
      titleKey: 'home.featureBudgetTitle',
      descKey: 'home.featureBudgetDesc',
      icon: 'pi-wrench',
      route: '/budget',
      accent: 'default',
    },
    {
      titleKey: 'home.featureAiTitle',
      descKey: 'home.featureAiDesc',
      icon: 'pi-sparkles',
      route: '/ai',
      accent: 'gaming',
    },
    {
      titleKey: 'home.featureSavedTitle',
      descKey: 'home.featureSavedDesc',
      icon: 'pi-save',
      route: '/saved',
      accent: 'default',
    },
    {
      titleKey: 'home.featureCompareTitle',
      descKey: 'home.featureCompareDesc',
      icon: 'pi-arrows-h',
      route: '/compare',
      accent: 'default',
    },
    {
      titleKey: 'home.featureStoreTitle',
      descKey: 'home.featureStoreDesc',
      icon: 'pi-shop',
      route: '/store',
      accent: 'store',
    },
  ];
}
