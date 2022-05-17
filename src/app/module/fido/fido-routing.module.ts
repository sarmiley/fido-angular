import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { FidoComponent } from './fido.component';

const routes: Routes = [
  {
    path: '',
    component: FidoComponent,
  },
  {
    path: 'fido',
    component: FidoComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class FidoRoutingModule { }
