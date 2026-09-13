import { Component } from '@angular/core';
import { BankAccountsList } from '@/app/features/configuration/bank-accounts/components/bank-accounts-list';

@Component({
    selector: 'app-bank-accounts-page',
    standalone: true,
    imports: [BankAccountsList],
    template: `<app-bank-accounts-list />`
})
export class BankAccountsPage {}