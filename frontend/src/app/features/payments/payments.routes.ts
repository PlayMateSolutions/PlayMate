import { Routes } from '@angular/router';
import { PaymentsPage } from './payments.page';
import { PaymentsListPage } from './payments-list/payments-list.page';

export const routes: Routes = [
  {
    path: '',
    component: PaymentsPage
  },
  {
    path: 'list',
    component: PaymentsListPage
  }
];
