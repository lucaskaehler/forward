import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CustomersRoutingModule } from './customers-routing.module';
import { CustomersComponent } from './customers.component';
import { QuoteComponent } from './quote/quote.component';
import { SharedModule } from '../shared/shared.module';
import { PdfViewerModule } from 'ng2-pdf-viewer';


@NgModule({
  declarations: [
    CustomersComponent,
    QuoteComponent
  ],
  imports: [
    CommonModule,
    CustomersRoutingModule,
    SharedModule,
    PdfViewerModule
  ]
})
export class CustomersModule { }
