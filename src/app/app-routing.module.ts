import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('./module/fido/fido.module').then((m) => m.FidoModule),
  },
  {
    path: 'example',
    loadChildren: () => import('./module/home/home.module').then((m) => m.HomeModule),
  },

];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule { }
