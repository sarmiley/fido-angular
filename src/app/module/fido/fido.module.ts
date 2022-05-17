import { FidoService } from './fido.service';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FidoRoutingModule } from './fido-routing.module';
import { FidoComponent } from './fido.component';



@NgModule({
  declarations: [
    FidoComponent
  ],
  imports: [CommonModule, FidoRoutingModule, FormsModule, ReactiveFormsModule],
  providers: [FidoService]
})
export class FidoModule { }
