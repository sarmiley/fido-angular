import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('./module/fido/fido.module').then((m) => m.FidoModule),
  },
  {
    path: 'sample',
    loadChildren: () => import('./module/sample/sample.module').then((m) => m.SampleModule),
  },

];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule { }
